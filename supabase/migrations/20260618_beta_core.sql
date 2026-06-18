create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.tasks (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.budgets (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.film_plans (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_project_idx on public.tasks(user_id, project_id);
create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists budgets_user_project_idx on public.budgets(user_id, project_id);
create index if not exists film_plans_user_id_idx on public.film_plans(user_id);
create index if not exists film_plans_user_project_idx on public.film_plans(user_id, project_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'projects', 'tasks', 'budgets', 'film_plans']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.budgets enable row level security;
alter table public.film_plans enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'projects', 'tasks', 'budgets', 'film_plans']
  loop
    execute format('drop policy if exists "%s select own" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s insert own" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s update own" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s delete own" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s select own" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
    execute format(
      'create policy "%s insert own" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
    execute format(
      'create policy "%s update own" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
    execute format(
      'create policy "%s delete own" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;
grant select, insert, update, delete on table public.film_plans to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();
