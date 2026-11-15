-- Idempotent Migration: Add Automatic Calculated Score Columns to survey_responses
-- Safe to run multiple times in Supabase SQL Editor without losing existing participant data.

alter table public.survey_responses
  add column if not exists warmth_total numeric,
  add column if not exists warmth_mean numeric,
  add column if not exists trust_total numeric,
  add column if not exists trust_mean numeric,
  add column if not exists disclosure_total numeric,
  add column if not exists disclosure_mean numeric;

-- Optional: Backfill existing rows that have all 26 raw responses but null calculated scores
update public.survey_responses
set
  warmth_total = (cw_1 + cw_2 + cw_3 + cw_4 + cw_5 + cw_6 + cw_7 + cw_8)::numeric,
  warmth_mean = round((cw_1 + cw_2 + cw_3 + cw_4 + cw_5 + cw_6 + cw_7 + cw_8)::numeric / 8.0, 2),
  trust_total = (pt_1 + pt_2 + pt_3 + pt_4 + pt_5 + pt_6 + pt_7 + pt_8 + pt_9)::numeric,
  trust_mean = round((pt_1 + pt_2 + pt_3 + pt_4 + pt_5 + pt_6 + pt_7 + pt_8 + pt_9)::numeric / 9.0, 2),
  disclosure_total = (sd_1 + sd_2 + sd_3 + sd_4 + sd_5 + sd_6 + sd_7 + sd_8 + sd_9)::numeric,
  disclosure_mean = round((sd_1 + sd_2 + sd_3 + sd_4 + sd_5 + sd_6 + sd_7 + sd_8 + sd_9)::numeric / 9.0, 2)
where warmth_total is null
   or warmth_mean is null
   or trust_total is null
   or trust_mean is null
   or disclosure_total is null
   or disclosure_mean is null;

-- Update server-side submission RPC so it persists all 26 raw responses + 6 calculated scores
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
  v_cw_1 smallint; v_cw_2 smallint; v_cw_3 smallint; v_cw_4 smallint;
  v_cw_5 smallint; v_cw_6 smallint; v_cw_7 smallint; v_cw_8 smallint;
  v_pt_1 smallint; v_pt_2 smallint; v_pt_3 smallint; v_pt_4 smallint; v_pt_5 smallint;
  v_pt_6 smallint; v_pt_7 smallint; v_pt_8 smallint; v_pt_9 smallint;
  v_sd_1 smallint; v_sd_2 smallint; v_sd_3 smallint; v_sd_4 smallint; v_sd_5 smallint;
  v_sd_6 smallint; v_sd_7 smallint; v_sd_8 smallint; v_sd_9 smallint;
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

  v_cw_1 := (p_payload->>'cw_1')::smallint;
  v_cw_2 := (p_payload->>'cw_2')::smallint;
  v_cw_3 := (p_payload->>'cw_3')::smallint;
  v_cw_4 := (p_payload->>'cw_4')::smallint;
  v_cw_5 := (p_payload->>'cw_5')::smallint;
  v_cw_6 := (p_payload->>'cw_6')::smallint;
  v_cw_7 := (p_payload->>'cw_7')::smallint;
  v_cw_8 := (p_payload->>'cw_8')::smallint;

  v_pt_1 := (p_payload->>'pt_1')::smallint;
  v_pt_2 := (p_payload->>'pt_2')::smallint;
  v_pt_3 := (p_payload->>'pt_3')::smallint;
  v_pt_4 := (p_payload->>'pt_4')::smallint;
  v_pt_5 := (p_payload->>'pt_5')::smallint;
  v_pt_6 := (p_payload->>'pt_6')::smallint;
  v_pt_7 := (p_payload->>'pt_7')::smallint;
  v_pt_8 := (p_payload->>'pt_8')::smallint;
  v_pt_9 := (p_payload->>'pt_9')::smallint;

  v_sd_1 := (p_payload->>'sd_1')::smallint;
  v_sd_2 := (p_payload->>'sd_2')::smallint;
  v_sd_3 := (p_payload->>'sd_3')::smallint;
  v_sd_4 := (p_payload->>'sd_4')::smallint;
  v_sd_5 := (p_payload->>'sd_5')::smallint;
  v_sd_6 := (p_payload->>'sd_6')::smallint;
  v_sd_7 := (p_payload->>'sd_7')::smallint;
  v_sd_8 := (p_payload->>'sd_8')::smallint;
  v_sd_9 := (p_payload->>'sd_9')::smallint;

  if v_cw_1 is null or v_cw_2 is null or v_cw_3 is null or v_cw_4 is null or
     v_cw_5 is null or v_cw_6 is null or v_cw_7 is null or v_cw_8 is null or
     v_pt_1 is null or v_pt_2 is null or v_pt_3 is null or v_pt_4 is null or v_pt_5 is null or
     v_pt_6 is null or v_pt_7 is null or v_pt_8 is null or v_pt_9 is null or
     v_sd_1 is null or v_sd_2 is null or v_sd_3 is null or v_sd_4 is null or v_sd_5 is null or
     v_sd_6 is null or v_sd_7 is null or v_sd_8 is null or v_sd_9 is null then
    raise exception 'All 26 questionnaire items are required before calculating scores.';
  end if;

  v_warmth_total := coalesce(
    (p_payload->>'warmth_total')::numeric,
    (v_cw_1 + v_cw_2 + v_cw_3 + v_cw_4 + v_cw_5 + v_cw_6 + v_cw_7 + v_cw_8)::numeric
  );
  v_warmth_mean := coalesce(
    (p_payload->>'warmth_mean')::numeric,
    round(v_warmth_total / 8.0, 2)
  );

  v_trust_total := coalesce(
    (p_payload->>'trust_total')::numeric,
    (v_pt_1 + v_pt_2 + v_pt_3 + v_pt_4 + v_pt_5 + v_pt_6 + v_pt_7 + v_pt_8 + v_pt_9)::numeric
  );
  v_trust_mean := coalesce(
    (p_payload->>'trust_mean')::numeric,
    round(v_trust_total / 9.0, 2)
  );

  v_disclosure_total := coalesce(
    (p_payload->>'disclosure_total')::numeric,
    (v_sd_1 + v_sd_2 + v_sd_3 + v_sd_4 + v_sd_5 + v_sd_6 + v_sd_7 + v_sd_8 + v_sd_9)::numeric
  );
  v_disclosure_mean := coalesce(
    (p_payload->>'disclosure_mean')::numeric,
    round(v_disclosure_total / 9.0, 2)
  );

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
    ai_tools, ai_frequency, ai_duration, ai_purpose, ai_familiarity,
    cw_1, cw_2, cw_3, cw_4, cw_5, cw_6, cw_7, cw_8,
    pt_1, pt_2, pt_3, pt_4, pt_5, pt_6, pt_7, pt_8, pt_9,
    sd_1, sd_2, sd_3, sd_4, sd_5, sd_6, sd_7, sd_8, sd_9,
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
    p_payload->>'ai_frequency',
    p_payload->>'ai_duration',
    coalesce(p_payload->'ai_purpose', '[]'::jsonb),
    p_payload->>'ai_familiarity',
    v_cw_1, v_cw_2, v_cw_3, v_cw_4, v_cw_5, v_cw_6, v_cw_7, v_cw_8,
    v_pt_1, v_pt_2, v_pt_3, v_pt_4, v_pt_5, v_pt_6, v_pt_7, v_pt_8, v_pt_9,
    v_sd_1, v_sd_2, v_sd_3, v_sd_4, v_sd_5, v_sd_6, v_sd_7, v_sd_8, v_sd_9,
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
