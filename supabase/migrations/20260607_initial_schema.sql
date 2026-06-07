create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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

create table if not exists public.budgets (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.film_plans (
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
  title text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
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

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists film_plans_user_id_idx on public.film_plans(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists projects_user_id_idx on public.projects(user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();

drop trigger if exists set_film_plans_updated_at on public.film_plans;
create trigger set_film_plans_updated_at before update on public.film_plans for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.film_plans enable row level security;
alter table public.tasks enable row level security;
alter table public.projects enable row level security;

create policy "profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles delete own" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "budgets select own" on public.budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy "budgets insert own" on public.budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budgets update own" on public.budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets delete own" on public.budgets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "film_plans select own" on public.film_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "film_plans insert own" on public.film_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "film_plans update own" on public.film_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "film_plans delete own" on public.film_plans for delete to authenticated using ((select auth.uid()) = user_id);

create policy "tasks select own" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks insert own" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tasks update own" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks delete own" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "projects select own" on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects insert own" on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "projects update own" on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects delete own" on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
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
