revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on function public.set_updated_at() from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.products, public.product_prices to anon, authenticated;

grant select on
  public.profiles,
  public.orders,
  public.payments,
  public.analysis_requests,
  public.analysis_answers,
  public.analysis_assets,
  public.analysis_jobs,
  public.analysis_results,
  public.analysis_scores,
  public.analysis_reports,
  public.audit_logs
to authenticated;

grant update on public.profiles to authenticated;

grant all on
  public.profiles,
  public.products,
  public.product_prices,
  public.orders,
  public.payments,
  public.methodology_versions,
  public.prompt_versions,
  public.scoring_versions,
  public.analysis_requests,
  public.analysis_answers,
  public.analysis_assets,
  public.analysis_jobs,
  public.analysis_results,
  public.analysis_scores,
  public.analysis_reports,
  public.audit_logs
to service_role;

grant execute on function public.set_updated_at() to service_role;

revoke all privileges on storage.objects from anon, authenticated;
grant select on storage.objects to authenticated;
grant all on storage.objects to service_role;
