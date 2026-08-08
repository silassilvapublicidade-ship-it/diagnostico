alter table public.analysis_results
  add column input_tokens integer,
  add column output_tokens integer,
  add column model_duration_ms integer,
  add column estimated_cost_usd_cents integer,
  add column is_test_analysis boolean not null default false;

alter table public.analysis_results
  add constraint analysis_results_input_tokens_check check (input_tokens is null or input_tokens >= 0),
  add constraint analysis_results_output_tokens_check check (output_tokens is null or output_tokens >= 0),
  add constraint analysis_results_model_duration_ms_check check (model_duration_ms is null or model_duration_ms >= 0),
  add constraint analysis_results_estimated_cost_usd_cents_check check (estimated_cost_usd_cents is null or estimated_cost_usd_cents >= 0);
