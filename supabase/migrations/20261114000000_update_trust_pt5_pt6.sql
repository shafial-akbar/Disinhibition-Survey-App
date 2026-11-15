-- Clean Schema Update for public.survey_responses (CW1–CW4, PT1–PT6, SD1–SD8)
-- Removes the unnecessary view `survey_responses_v1_16_items` and recreates the empty
-- `public.survey_responses` table so `pt_5` and `pt_6` appear right after `pt_4` in exact order.

drop view if exists public.survey_responses_v1_16_items;
drop table if exists public.survey_responses cascade;

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  age_group text not null check (age_group in ('18–24 years', '25–34 years', '35–44 years', '45 years or above')),
  gender text,
  education text not null,
  occupation text,
  ai_tools jsonb not null,
  primary_ai_tool text,
  ai_frequency text not null,
  ai_duration text not null,
  ai_purpose jsonb not null,
  ai_familiarity text not null,
  questionnaire_version text not null default 'v1_16_items',
  cw_1 smallint not null check (cw_1 between 1 and 5),
  cw_2 smallint not null check (cw_2 between 1 and 5),
  cw_3 smallint not null check (cw_3 between 1 and 5),
  cw_4 smallint not null check (cw_4 between 1 and 5),
  pt_1 smallint not null check (pt_1 between 1 and 5),
  pt_2 smallint not null check (pt_2 between 1 and 5),
  pt_3 smallint not null check (pt_3 between 1 and 5),
  pt_4 smallint not null check (pt_4 between 1 and 5),
  pt_5 smallint not null check (pt_5 between 1 and 5),
  pt_6 smallint not null check (pt_6 between 1 and 5),
  sd_1 smallint not null check (sd_1 between 1 and 5),
  sd_2 smallint not null check (sd_2 between 1 and 5),
  sd_3 smallint not null check (sd_3 between 1 and 5),
  sd_4 smallint not null check (sd_4 between 1 and 5),
  sd_5 smallint not null check (sd_5 between 1 and 5),
  sd_6 smallint not null check (sd_6 between 1 and 5),
  sd_7 smallint not null check (sd_7 between 1 and 5),
  sd_8 smallint not null check (sd_8 between 1 and 5),
  warmth_total numeric,
  warmth_mean numeric,
  trust_total numeric,
  trust_mean numeric,
  disclosure_total numeric,
  disclosure_mean numeric,
  submitted_at timestamptz not null default now(),
  withdrawal_code_hash text unique,
  withdrawal_deadline timestamptz not null default (now() + interval '3 days'),
  locked_for_analysis boolean not null default false
);

create index if not exists idx_survey_responses_withdrawal_hash
  on public.survey_responses (withdrawal_code_hash);

create index if not exists idx_survey_responses_questionnaire_version
  on public.survey_responses (questionnaire_version);

alter table public.survey_responses enable row level security;

drop policy if exists "Anonymous insert only" on public.survey_responses;
create policy "Anonymous insert only"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
revoke select, update, delete on public.survey_responses from anon, authenticated;

-- Update server-side submission RPC so trust_total = pt_1 + pt_2 + pt_3 + pt_4 + pt_5 + pt_6 and trust_mean = trust_total / 6
create or replace function public.submit_survey_response(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_code text;
  v_hash text;
  v_now timestamptz := clock_timestamp();
  v_deadline timestamptz := v_now + interval '3 days';
  v_attempts integer := 0;
  v_primary_ai_tool text;
  v_version text;
  v_cw_1 smallint; v_cw_2 smallint; v_cw_3 smallint; v_cw_4 smallint;
  v_pt_1 smallint; v_pt_2 smallint; v_pt_3 smallint; v_pt_4 smallint; v_pt_5 smallint; v_pt_6 smallint;
  v_sd_1 smallint; v_sd_2 smallint; v_sd_3 smallint; v_sd_4 smallint;
  v_sd_5 smallint; v_sd_6 smallint; v_sd_7 smallint; v_sd_8 smallint;
  v_warmth_total numeric;
  v_warmth_mean numeric;
  v_trust_total numeric;
  v_trust_mean numeric;
  v_disclosure_total numeric;
  v_disclosure_mean numeric;
begin
  if p_payload is null then
    raise exception 'Missing survey payload';
  end if;

  v_primary_ai_tool := nullif(trim(coalesce(p_payload->>'primary_ai_tool', '')), '');
  if v_primary_ai_tool is null then
    raise exception 'Primary conversational AI tool (primary_ai_tool) is required.';
  end if;

  v_version := coalesce(nullif(trim(p_payload->>'questionnaire_version'), ''), 'v1_16_items');

  v_cw_1 := (p_payload->>'cw_1')::smallint;
  v_cw_2 := (p_payload->>'cw_2')::smallint;
  v_cw_3 := (p_payload->>'cw_3')::smallint;
  v_cw_4 := (p_payload->>'cw_4')::smallint;

  v_pt_1 := (p_payload->>'pt_1')::smallint;
  v_pt_2 := (p_payload->>'pt_2')::smallint;
  v_pt_3 := (p_payload->>'pt_3')::smallint;
  v_pt_4 := (p_payload->>'pt_4')::smallint;
  v_pt_5 := (p_payload->>'pt_5')::smallint;
  v_pt_6 := (p_payload->>'pt_6')::smallint;

  v_sd_1 := (p_payload->>'sd_1')::smallint;
  v_sd_2 := (p_payload->>'sd_2')::smallint;
  v_sd_3 := (p_payload->>'sd_3')::smallint;
  v_sd_4 := (p_payload->>'sd_4')::smallint;
  v_sd_5 := (p_payload->>'sd_5')::smallint;
  v_sd_6 := (p_payload->>'sd_6')::smallint;
  v_sd_7 := (p_payload->>'sd_7')::smallint;
  v_sd_8 := (p_payload->>'sd_8')::smallint;

  if v_cw_1 is null or v_cw_2 is null or v_cw_3 is null or v_cw_4 is null or
     v_pt_1 is null or v_pt_2 is null or v_pt_3 is null or v_pt_4 is null or v_pt_5 is null or v_pt_6 is null or
     v_sd_1 is null or v_sd_2 is null or v_sd_3 is null or v_sd_4 is null or
     v_sd_5 is null or v_sd_6 is null or v_sd_7 is null or v_sd_8 is null then
    raise exception 'All 18 questionnaire items (CW1-CW4, PT1-PT6, SD1-SD8) are required before calculating scores.';
  end if;

  if v_cw_1 not between 1 and 5 or v_cw_2 not between 1 and 5 or v_cw_3 not between 1 and 5 or v_cw_4 not between 1 and 5 or
     v_pt_1 not between 1 and 5 or v_pt_2 not between 1 and 5 or v_pt_3 not between 1 and 5 or v_pt_4 not between 1 and 5 or v_pt_5 not between 1 and 5 or v_pt_6 not between 1 and 5 or
     v_sd_1 not between 1 and 5 or v_sd_2 not between 1 and 5 or v_sd_3 not between 1 and 5 or v_sd_4 not between 1 and 5 or
     v_sd_5 not between 1 and 5 or v_sd_6 not between 1 and 5 or v_sd_7 not between 1 and 5 or v_sd_8 not between 1 and 5 then
    raise exception 'All questionnaire item responses must be integers between 1 and 5.';
  end if;

  v_warmth_total := (v_cw_1 + v_cw_2 + v_cw_3 + v_cw_4)::numeric;
  v_warmth_mean := round(v_warmth_total / 4.0, 2);

  v_trust_total := (v_pt_1 + v_pt_2 + v_pt_3 + v_pt_4 + v_pt_5 + v_pt_6)::numeric;
  v_trust_mean := round(v_trust_total / 6.0, 2);

  v_disclosure_total := (v_sd_1 + v_sd_2 + v_sd_3 + v_sd_4 + v_sd_5 + v_sd_6 + v_sd_7 + v_sd_8)::numeric;
  v_disclosure_mean := round(v_disclosure_total / 8.0, 2);

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique withdrawal code';
    end if;

    v_code := public.generate_withdrawal_code();
    v_hash := encode(pg_catalog.sha256(convert_to(v_code, 'UTF8')), 'hex');

    exit when not exists (
      select 1 from public.survey_responses where withdrawal_code_hash = v_hash
    );
  end loop;

  insert into public.survey_responses (
    age_group, gender, education, occupation,
    ai_tools, primary_ai_tool, ai_frequency, ai_duration, ai_purpose, ai_familiarity,
    questionnaire_version,
    cw_1, cw_2, cw_3, cw_4,
    pt_1, pt_2, pt_3, pt_4, pt_5, pt_6,
    sd_1, sd_2, sd_3, sd_4, sd_5, sd_6, sd_7, sd_8,
    warmth_total, warmth_mean,
    trust_total, trust_mean,
    disclosure_total, disclosure_mean,
    submitted_at, withdrawal_code_hash, withdrawal_deadline, locked_for_analysis
  ) values (
    p_payload->>'age_group',
    nullif(p_payload->>'gender', ''),
    p_payload->>'education',
    nullif(p_payload->>'occupation', ''),
    coalesce(p_payload->'ai_tools', '[]'::jsonb),
    v_primary_ai_tool,
    p_payload->>'ai_frequency',
    p_payload->>'ai_duration',
    coalesce(p_payload->'ai_purpose', '[]'::jsonb),
    p_payload->>'ai_familiarity',
    v_version,
    v_cw_1, v_cw_2, v_cw_3, v_cw_4,
    v_pt_1, v_pt_2, v_pt_3, v_pt_4, v_pt_5, v_pt_6,
    v_sd_1, v_sd_2, v_sd_3, v_sd_4, v_sd_5, v_sd_6, v_sd_7, v_sd_8,
    v_warmth_total, v_warmth_mean,
    v_trust_total, v_trust_mean,
    v_disclosure_total, v_disclosure_mean,
    v_now,
    v_hash,
    v_deadline,
    false
  );

  return jsonb_build_object(
    'status', 'submitted',
    'withdrawal_code', v_code,
    'submitted_at', v_now,
    'withdrawal_deadline', v_deadline
  );
end;
$$;

grant execute on function public.submit_survey_response(jsonb) to anon, authenticated, service_role;
