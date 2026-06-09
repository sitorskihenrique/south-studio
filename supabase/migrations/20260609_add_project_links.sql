alter table public.budgets add column if not exists project_id text;
alter table public.film_plans add column if not exists project_id text;
alter table public.tasks add column if not exists project_id text;

create index if not exists budgets_user_project_idx on public.budgets (user_id, project_id);
create index if not exists film_plans_user_project_idx on public.film_plans (user_id, project_id);
create index if not exists tasks_user_project_idx on public.tasks (user_id, project_id);
