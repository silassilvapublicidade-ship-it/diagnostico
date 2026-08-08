create extension if not exists pgcrypto;

create type public.profile_type as enum ('business', 'creator');
create type public.dimension_key as enum (
  'positioning',
  'first_impression',
  'authority',
  'content',
  'identity',
  'conversion',
  'relationship',
  'opportunities'
);
create type public.dimension_status as enum ('evaluated', 'insufficient_evidence');
create type public.confidence_level as enum ('high', 'medium', 'low');
create type public.evidence_type as enum ('visual', 'declared', 'inferred');
create type public.analysis_status as enum (
  'draft',
  'waiting_payment',
  'waiting_briefing',
  'waiting_assets',
  'ready',
  'processing',
  'requires_review',
  'waiting_for_more_information',
  'generating_report',
  'completed',
  'failed'
);
create type public.order_status as enum ('draft', 'pending', 'paid', 'canceled', 'refunded', 'failed');
create type public.payment_provider as enum ('mercado_pago');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'charged_back');
create type public.asset_type as enum ('profile_top', 'feed', 'highlights', 'insights', 'stories', 'comments', 'other');
create type public.score_kind as enum ('complete', 'partial');
create type public.report_status as enum ('blocked', 'generating', 'available', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'BRL',
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid not null references public.products(id),
  price_id uuid not null references public.product_prices(id),
  status public.order_status not null default 'draft',
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'BRL',
  customer_email text not null,
  provider public.payment_provider not null default 'mercado_pago',
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider public.payment_provider not null default 'mercado_pago',
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'BRL',
  idempotency_key text,
  raw_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_id),
  unique (provider, idempotency_key)
);

create table public.methodology_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  name text not null,
  profile_type public.profile_type,
  weights_snapshot jsonb not null,
  criteria_snapshot jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  methodology_version_id uuid references public.methodology_versions(id),
  prompt_hash text not null,
  prompt_snapshot jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.scoring_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  rules_snapshot jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.analysis_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  user_id uuid references auth.users(id) on delete set null,
  profile_type public.profile_type not null,
  instagram_url text,
  status public.analysis_status not null default 'draft',
  requires_review boolean not null default false,
  review_reasons text[] not null default array[]::text[],
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or requires_review = false)
);

create table public.analysis_answers (
  id uuid primary key default gen_random_uuid(),
  analysis_request_id uuid not null references public.analysis_requests(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  unique (analysis_request_id, question_key)
);

create table public.analysis_assets (
  id uuid primary key default gen_random_uuid(),
  analysis_request_id uuid not null references public.analysis_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  asset_type public.asset_type not null,
  storage_bucket text not null default 'analysis-assets',
  storage_path text not null,
  original_filename text,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  metadata jsonb not null default '{}'::jsonb,
  retention_until timestamptz,
  processing_consent_at timestamptz not null,
  deleted_at timestamptz,
  deletion_reason text,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  check (deleted_at is not null or deletion_reason is null),
  check (retention_until is null or retention_until > created_at)
);

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  analysis_request_id uuid not null references public.analysis_requests(id) on delete cascade,
  parent_job_id uuid references public.analysis_jobs(id),
  status public.analysis_status not null default 'processing',
  attempt_number integer not null default 1 check (attempt_number > 0),
  trigger_reason text not null default 'initial',
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  check (finished_at is null or started_at is null or finished_at >= started_at)
);

create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  analysis_request_id uuid not null references public.analysis_requests(id) on delete cascade,
  analysis_job_id uuid not null references public.analysis_jobs(id) on delete restrict,
  result_sequence integer not null check (result_sequence > 0),
  score_kind public.score_kind not null,
  score integer not null check (score >= 0 and score <= 100),
  confidence public.confidence_level not null,
  requires_review boolean not null default false,
  review_reasons text[] not null default array[]::text[],
  methodology_version text not null,
  prompt_version text not null,
  scoring_version text not null,
  result_version text not null,
  model_provider text not null,
  model_name text not null,
  weights_snapshot jsonb not null,
  raw_output jsonb,
  normalized_result jsonb not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (analysis_job_id),
  unique (analysis_request_id, result_sequence)
);

create table public.analysis_scores (
  id uuid primary key default gen_random_uuid(),
  analysis_result_id uuid not null references public.analysis_results(id) on delete cascade,
  dimension public.dimension_key not null,
  status public.dimension_status not null,
  score integer check (score >= 0 and score <= 100),
  confidence public.confidence_level not null,
  original_weight numeric(8,4) not null check (original_weight >= 0),
  effective_weight numeric(8,4) not null check (effective_weight >= 0),
  evidence_summary jsonb not null default '{}'::jsonb,
  limitations text[] not null default array[]::text[],
  recommendations text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  unique (analysis_result_id, dimension),
  check (
    (status = 'evaluated' and score is not null)
    or (status = 'insufficient_evidence' and score is null)
  )
);

create table public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  analysis_result_id uuid not null references public.analysis_results(id) on delete cascade,
  status public.report_status not null default 'blocked',
  report_version text not null,
  web_payload jsonb,
  pdf_storage_path text,
  blocked_reason text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (analysis_result_id, report_version)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger analysis_requests_set_updated_at
  before update on public.analysis_requests
  for each row execute function public.set_updated_at();

create index profiles_email_idx on public.profiles (email);
create index orders_user_id_idx on public.orders (user_id);
create index orders_customer_email_idx on public.orders (customer_email);
create index payments_order_id_idx on public.payments (order_id);
create index analysis_requests_user_id_idx on public.analysis_requests (user_id);
create index analysis_requests_order_id_idx on public.analysis_requests (order_id);
create index analysis_assets_request_id_idx on public.analysis_assets (analysis_request_id);
create index analysis_assets_retention_until_idx on public.analysis_assets (retention_until) where deleted_at is null;
create index analysis_jobs_request_id_idx on public.analysis_jobs (analysis_request_id);
create index analysis_results_request_id_idx on public.analysis_results (analysis_request_id);
create index analysis_scores_result_id_idx on public.analysis_scores (analysis_result_id);
create index audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.methodology_versions enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.scoring_versions enable row level security;
alter table public.analysis_requests enable row level security;
alter table public.analysis_answers enable row level security;
alter table public.analysis_assets enable row level security;
alter table public.analysis_jobs enable row level security;
alter table public.analysis_results enable row level security;
alter table public.analysis_scores enable row level security;
alter table public.analysis_reports enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "products_select_active" on public.products
  for select using (active = true);
create policy "product_prices_select_active" on public.product_prices
  for select using (active = true);

create policy "orders_select_own" on public.orders
  for select using (user_id = auth.uid());

create policy "payments_select_own_order" on public.payments
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "analysis_requests_select_own" on public.analysis_requests
  for select using (user_id = auth.uid());

create policy "analysis_answers_select_own_request" on public.analysis_answers
  for select using (
    exists (
      select 1 from public.analysis_requests
      where analysis_requests.id = analysis_answers.analysis_request_id
      and analysis_requests.user_id = auth.uid()
    )
  );

create policy "analysis_assets_select_own_request" on public.analysis_assets
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.analysis_requests
      where analysis_requests.id = analysis_assets.analysis_request_id
      and analysis_requests.user_id = auth.uid()
    )
  );

create policy "analysis_jobs_select_own_request" on public.analysis_jobs
  for select using (
    exists (
      select 1 from public.analysis_requests
      where analysis_requests.id = analysis_jobs.analysis_request_id
      and analysis_requests.user_id = auth.uid()
    )
  );

create policy "analysis_results_select_own_request" on public.analysis_results
  for select using (
    requires_review = false
    and
    exists (
      select 1 from public.analysis_requests
      where analysis_requests.id = analysis_results.analysis_request_id
      and analysis_requests.user_id = auth.uid()
    )
  );

create policy "analysis_scores_select_own_result" on public.analysis_scores
  for select using (
    exists (
      select 1
      from public.analysis_results
      join public.analysis_requests
        on analysis_requests.id = analysis_results.analysis_request_id
      where analysis_results.id = analysis_scores.analysis_result_id
      and analysis_results.requires_review = false
      and analysis_requests.user_id = auth.uid()
    )
  );

create policy "analysis_reports_select_own_result" on public.analysis_reports
  for select using (
    status = 'available'
    and
    exists (
      select 1
      from public.analysis_results
      join public.analysis_requests
        on analysis_requests.id = analysis_results.analysis_request_id
      where analysis_results.id = analysis_reports.analysis_result_id
      and analysis_results.requires_review = false
      and analysis_requests.user_id = auth.uid()
    )
  );

create policy "audit_logs_select_own" on public.audit_logs
  for select using (actor_user_id = auth.uid());

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'analysis-assets',
  'analysis-assets',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_analysis_assets_select_own" on storage.objects
  for select using (
    bucket_id = 'analysis-assets'
    and exists (
      select 1
      from public.analysis_assets
      join public.analysis_requests
        on analysis_requests.id = analysis_assets.analysis_request_id
      where analysis_assets.storage_bucket = storage.objects.bucket_id
      and analysis_assets.storage_path = storage.objects.name
      and analysis_assets.deleted_at is null
      and analysis_requests.user_id = auth.uid()
    )
  );

grant select on storage.objects to authenticated;
grant all on storage.objects to service_role;
