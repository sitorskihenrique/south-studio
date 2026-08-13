drop policy if exists usage_insert on public.usage_events;

revoke insert on table public.usage_events from authenticated;
revoke usage, select on sequence public.usage_events_id_seq from authenticated;
