create type public.result_origin as enum (
  'ai_generated',
  'development_fixture',
  'human_reviewed'
);

alter table public.analysis_results
  add column result_origin public.result_origin;

update public.analysis_results
set result_origin = 'ai_generated'
where result_origin is null;

alter table public.analysis_results
  alter column result_origin set not null;
