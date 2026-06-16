create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_owner_id_idx on public.tenants(owner_id);
create index if not exists tenant_members_user_id_idx on public.tenant_members(user_id);
create index if not exists tenant_members_tenant_id_idx on public.tenant_members(tenant_id);

drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

drop trigger if exists set_tenant_settings_updated_at on public.tenant_settings;
create trigger set_tenant_settings_updated_at
before update on public.tenant_settings
for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_settings enable row level security;

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_admin(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin')
  );
$$;

drop policy if exists "tenants select member" on public.tenants;
create policy "tenants select member"
on public.tenants for select
to authenticated
using (public.is_tenant_member(id));

drop policy if exists "tenants insert owner" on public.tenants;
create policy "tenants insert owner"
on public.tenants for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "tenants update admin" on public.tenants;
create policy "tenants update admin"
on public.tenants for update
to authenticated
using (public.is_tenant_admin(id))
with check (public.is_tenant_admin(id));

drop policy if exists "tenant_members select member" on public.tenant_members;
create policy "tenant_members select member"
on public.tenant_members for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_members insert admin" on public.tenant_members;
create policy "tenant_members insert admin"
on public.tenant_members for insert
to authenticated
with check (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_members update admin" on public.tenant_members;
create policy "tenant_members update admin"
on public.tenant_members for update
to authenticated
using (public.is_tenant_admin(tenant_id))
with check (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_members delete admin" on public.tenant_members;
create policy "tenant_members delete admin"
on public.tenant_members for delete
to authenticated
using (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_settings select member" on public.tenant_settings;
create policy "tenant_settings select member"
on public.tenant_settings for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_settings insert admin" on public.tenant_settings;
create policy "tenant_settings insert admin"
on public.tenant_settings for insert
to authenticated
with check (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_settings update admin" on public.tenant_settings;
create policy "tenant_settings update admin"
on public.tenant_settings for update
to authenticated
using (public.is_tenant_admin(tenant_id))
with check (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_settings delete admin" on public.tenant_settings;
create policy "tenant_settings delete admin"
on public.tenant_settings for delete
to authenticated
using (public.is_tenant_admin(tenant_id));

grant select, insert, update, delete on table public.tenants to authenticated;
grant select, insert, update, delete on table public.tenant_members to authenticated;
grant select, insert, update, delete on table public.tenant_settings to authenticated;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.is_tenant_admin(uuid) to authenticated;

create or replace function public.tenant_slug_from_user(p_user_id uuid, p_user_email text, p_full_name text)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  base text;
begin
  base := lower(coalesce(nullif(split_part(p_user_email, '@', 1), ''), nullif(p_full_name, ''), 'studio'));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);

  if base = '' then
    base := 'studio';
  end if;

  return left(base, 40) || '-' || left(replace(p_user_id::text, '-', ''), 20);
end;
$$;

create or replace function public.ensure_personal_tenant(p_user_id uuid, p_user_email text, p_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tenant_id uuid;
  tenant_name text;
  tenant_slug text;
begin
  select tm.tenant_id
  into tenant_id
  from public.tenant_members tm
  where tm.user_id = p_user_id
    and tm.role = 'owner'
  order by tm.created_at asc
  limit 1;

  if tenant_id is not null then
    return tenant_id;
  end if;

  tenant_name := coalesce(nullif(p_full_name, ''), nullif(split_part(p_user_email, '@', 1), ''), 'South Studio');
  tenant_slug := public.tenant_slug_from_user(p_user_id, p_user_email, p_full_name);

  insert into public.tenants (name, slug, owner_id)
  values (tenant_name, tenant_slug, p_user_id)
  on conflict (slug) do nothing
  returning id into tenant_id;

  if tenant_id is null then
    select t.id
    into tenant_id
    from public.tenants t
    where t.owner_id = p_user_id
    order by t.created_at asc
    limit 1;
  end if;

  if tenant_id is null then
    raise exception 'Could not create personal tenant for user %', p_user_id;
  end if;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (tenant_id, p_user_id, 'owner')
  on conflict (tenant_id, user_id) do update set role = excluded.role;

  insert into public.tenant_settings (tenant_id, settings)
  values (tenant_id, '{}'::jsonb)
  on conflict (tenant_id) do nothing;

  return tenant_id;
end;
$$;

revoke execute on function public.ensure_personal_tenant(uuid, text, text) from public, anon, authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name text;
begin
  full_name := new.raw_user_meta_data ->> 'full_name';

  insert into public.profiles (user_id, full_name, email)
  values (new.id, full_name, new.email)
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();

  perform public.ensure_personal_tenant(new.id, new.email, full_name);

  return new;
end;
$$;

do $$
declare
  user_record record;
begin
  for user_record in
    select
      u.id,
      u.email,
      coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name') as full_name
    from auth.users u
    left join public.profiles p on p.user_id = u.id
  loop
    perform public.ensure_personal_tenant(user_record.id, user_record.email, user_record.full_name);
  end loop;
end;
$$;
