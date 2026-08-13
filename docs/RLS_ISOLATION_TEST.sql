-- Teste manual de isolamento RLS.
--
-- Use somente em ambiente local ou staging com dois usuarios reais de teste
-- existentes em auth.users. Nao rode contra dados de clientes.
--
-- Como usar no psql:
--   \set user_a '00000000-0000-0000-0000-000000000000'
--   \set user_b '11111111-1111-1111-1111-111111111111'
--   \i docs/RLS_ISOLATION_TEST.sql
--
-- Resultado esperado:
--   - os checks "own_visible" retornam 1.
--   - os checks "other_visible", "update_other", "delete_other" e
--     "ownership_change" retornam 0.
--   - os inserts "forged_user" falham por RLS WITH CHECK.
--
-- Este arquivo abre uma transacao e termina com rollback.

begin;

set local role authenticated;

select 'rls-project-a-' || gen_random_uuid()::text as project_a_id \gset
select 'rls-project-b-' || gen_random_uuid()::text as project_b_id \gset
select 'rls-task-a-' || gen_random_uuid()::text as task_a_id \gset
select 'rls-task-b-' || gen_random_uuid()::text as task_b_id \gset
select 'rls-budget-a-' || gen_random_uuid()::text as budget_a_id \gset
select 'rls-budget-b-' || gen_random_uuid()::text as budget_b_id \gset
select 'rls-film-plan-a-' || gen_random_uuid()::text as film_plan_a_id \gset
select 'rls-film-plan-b-' || gen_random_uuid()::text as film_plan_b_id \gset

-- Usuario A: operacoes positivas.
select set_config('request.jwt.claim.sub', :'user_a', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.profiles (user_id, full_name, email)
values (:'user_a'::uuid, 'RLS user A', 'rls-a@example.invalid')
on conflict (user_id) do update set full_name = excluded.full_name, email = excluded.email;

insert into public.projects (id, user_id, title, data)
values (:'project_a_id', :'user_a'::uuid, 'RLS project A', '{"test":true}'::jsonb);

insert into public.tasks (id, user_id, project_id, title, data)
values (:'task_a_id', :'user_a'::uuid, :'project_a_id', 'RLS task A', '{"test":true}'::jsonb);

insert into public.budgets (id, user_id, project_id, title, data)
values (:'budget_a_id', :'user_a'::uuid, :'project_a_id', 'RLS budget A', '{"test":true}'::jsonb);

insert into public.film_plans (id, user_id, project_id, title, data)
values (:'film_plan_a_id', :'user_a'::uuid, :'project_a_id', 'RLS film plan A', '{"test":true}'::jsonb);

-- Usuario B: operacoes positivas.
select set_config('request.jwt.claim.sub', :'user_b', true);

insert into public.profiles (user_id, full_name, email)
values (:'user_b'::uuid, 'RLS user B', 'rls-b@example.invalid')
on conflict (user_id) do update set full_name = excluded.full_name, email = excluded.email;

insert into public.projects (id, user_id, title, data)
values (:'project_b_id', :'user_b'::uuid, 'RLS project B', '{"test":true}'::jsonb);

insert into public.tasks (id, user_id, project_id, title, data)
values (:'task_b_id', :'user_b'::uuid, :'project_b_id', 'RLS task B', '{"test":true}'::jsonb);

insert into public.budgets (id, user_id, project_id, title, data)
values (:'budget_b_id', :'user_b'::uuid, :'project_b_id', 'RLS budget B', '{"test":true}'::jsonb);

insert into public.film_plans (id, user_id, project_id, title, data)
values (:'film_plan_b_id', :'user_b'::uuid, :'project_b_id', 'RLS film plan B', '{"test":true}'::jsonb);

-- Usuario A contra dados do Usuario B.
select set_config('request.jwt.claim.sub', :'user_a', true);

select 'profiles_a_own_visible' as check_name, count(*) as expected_1
from public.profiles where user_id = :'user_a'::uuid;
select 'profiles_a_other_visible' as check_name, count(*) as expected_0
from public.profiles where user_id = :'user_b'::uuid;

select 'projects_a_own_visible' as check_name, count(*) as expected_1
from public.projects where id = :'project_a_id';
select 'projects_a_other_visible' as check_name, count(*) as expected_0
from public.projects where id = :'project_b_id';

select 'tasks_a_own_visible' as check_name, count(*) as expected_1
from public.tasks where id = :'task_a_id';
select 'tasks_a_other_visible' as check_name, count(*) as expected_0
from public.tasks where id = :'task_b_id';

select 'budgets_a_own_visible' as check_name, count(*) as expected_1
from public.budgets where id = :'budget_a_id';
select 'budgets_a_other_visible' as check_name, count(*) as expected_0
from public.budgets where id = :'budget_b_id';

select 'film_plans_a_own_visible' as check_name, count(*) as expected_1
from public.film_plans where id = :'film_plan_a_id';
select 'film_plans_a_other_visible' as check_name, count(*) as expected_0
from public.film_plans where id = :'film_plan_b_id';

update public.projects set title = 'RLS should not update B' where id = :'project_b_id';
update public.tasks set title = 'RLS should not update B' where id = :'task_b_id';
update public.budgets set title = 'RLS should not update B' where id = :'budget_b_id';
update public.film_plans set title = 'RLS should not update B' where id = :'film_plan_b_id';

select 'projects_a_update_other' as check_name, count(*) as expected_0
from public.projects where id = :'project_b_id' and title = 'RLS should not update B';
select 'tasks_a_update_other' as check_name, count(*) as expected_0
from public.tasks where id = :'task_b_id' and title = 'RLS should not update B';
select 'budgets_a_update_other' as check_name, count(*) as expected_0
from public.budgets where id = :'budget_b_id' and title = 'RLS should not update B';
select 'film_plans_a_update_other' as check_name, count(*) as expected_0
from public.film_plans where id = :'film_plan_b_id' and title = 'RLS should not update B';

update public.projects set user_id = :'user_b'::uuid where id = :'project_a_id';
select 'projects_a_ownership_change' as check_name, count(*) as expected_0
from public.projects where id = :'project_a_id' and user_id = :'user_b'::uuid;

delete from public.projects where id = :'project_b_id';
delete from public.tasks where id = :'task_b_id';
delete from public.budgets where id = :'budget_b_id';
delete from public.film_plans where id = :'film_plan_b_id';

select 'projects_a_delete_other' as check_name, count(*) as expected_0
from public.projects where id = :'project_b_id';
select 'tasks_a_delete_other' as check_name, count(*) as expected_0
from public.tasks where id = :'task_b_id';
select 'budgets_a_delete_other' as check_name, count(*) as expected_0
from public.budgets where id = :'budget_b_id';
select 'film_plans_a_delete_other' as check_name, count(*) as expected_0
from public.film_plans where id = :'film_plan_b_id';

\set ON_ERROR_STOP off
savepoint forged_project;
insert into public.projects (id, user_id, title, data)
values ('rls-forged-project-' || gen_random_uuid()::text, :'user_b'::uuid, 'Forged project', '{"test":true}'::jsonb);
rollback to savepoint forged_project;
savepoint forged_task;
insert into public.tasks (id, user_id, title, data)
values ('rls-forged-task-' || gen_random_uuid()::text, :'user_b'::uuid, 'Forged task', '{"test":true}'::jsonb);
rollback to savepoint forged_task;
savepoint forged_budget;
insert into public.budgets (id, user_id, title, data)
values ('rls-forged-budget-' || gen_random_uuid()::text, :'user_b'::uuid, 'Forged budget', '{"test":true}'::jsonb);
rollback to savepoint forged_budget;
savepoint forged_film_plan;
insert into public.film_plans (id, user_id, title, data)
values ('rls-forged-film-plan-' || gen_random_uuid()::text, :'user_b'::uuid, 'Forged film plan', '{"test":true}'::jsonb);
rollback to savepoint forged_film_plan;
\set ON_ERROR_STOP on

-- Usuario B contra dados do Usuario A.
select set_config('request.jwt.claim.sub', :'user_b', true);

select 'projects_b_own_visible' as check_name, count(*) as expected_1
from public.projects where id = :'project_b_id';
select 'projects_b_other_visible' as check_name, count(*) as expected_0
from public.projects where id = :'project_a_id';
select 'tasks_b_own_visible' as check_name, count(*) as expected_1
from public.tasks where id = :'task_b_id';
select 'tasks_b_other_visible' as check_name, count(*) as expected_0
from public.tasks where id = :'task_a_id';
select 'budgets_b_own_visible' as check_name, count(*) as expected_1
from public.budgets where id = :'budget_b_id';
select 'budgets_b_other_visible' as check_name, count(*) as expected_0
from public.budgets where id = :'budget_a_id';
select 'film_plans_b_own_visible' as check_name, count(*) as expected_1
from public.film_plans where id = :'film_plan_b_id';
select 'film_plans_b_other_visible' as check_name, count(*) as expected_0
from public.film_plans where id = :'film_plan_a_id';

rollback;
