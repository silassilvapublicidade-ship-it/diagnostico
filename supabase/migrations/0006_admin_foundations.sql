-- public.profiles stays a live mirror of auth.users identity fields, not
-- just a signup snapshot: Supabase Auth lets a signed-in user change their
-- own email/name via the client SDK even though this app has no "edit
-- profile" screen yet, and the Admin's Clientes view needs that data to
-- stay accurate for support/operations.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_identity_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set full_name = new.raw_user_meta_data ->> 'full_name',
      email = new.email
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_identity_updated
  after update on auth.users
  for each row
  when (
    new.email is distinct from old.email
    or (new.raw_user_meta_data ->> 'full_name')
       is distinct from (old.raw_user_meta_data ->> 'full_name')
  )
  execute function public.handle_user_identity_update();

-- Backfill users created before this migration existed.
insert into public.profiles (id, full_name, email)
select id, raw_user_meta_data ->> 'full_name', email
from auth.users
on conflict (id) do nothing;

-- Indexes for Admin aggregate/filter/sort queries (status, date-range,
-- model/prompt distribution). Additive only; no existing index is touched.
create index if not exists analysis_requests_status_idx on public.analysis_requests (status);
create index if not exists analysis_requests_created_at_idx on public.analysis_requests (created_at);
create index if not exists analysis_jobs_status_started_at_idx on public.analysis_jobs (status, started_at);
create index if not exists analysis_results_generated_at_idx on public.analysis_results (generated_at);
create index if not exists analysis_results_model_prompt_idx on public.analysis_results (model_name, prompt_version);
create index if not exists profiles_created_at_idx on public.profiles (created_at);
