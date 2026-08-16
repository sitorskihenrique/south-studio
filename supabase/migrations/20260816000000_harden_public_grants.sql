-- Harden public grants for private user-owned tables and internal trigger functions.
--
-- Rollback, if needed:
--   grant execute on function public.handle_new_user_profile() to anon, authenticated;
--   grant select, insert, update, delete on table
--     public.profiles,
--     public.projects,
--     public.tasks,
--     public.budgets,
--     public.film_plans
--   to anon;

revoke execute on function public.handle_new_user_profile() from public;
revoke execute on function public.handle_new_user_profile() from anon;
revoke execute on function public.handle_new_user_profile() from authenticated;

revoke select, insert, update, delete, truncate, references, trigger on table
  public.profiles,
  public.projects,
  public.tasks,
  public.budgets,
  public.film_plans
from anon;
