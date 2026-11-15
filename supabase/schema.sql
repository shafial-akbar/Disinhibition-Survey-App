-- Complete Supabase Schema & Idempotent Migration for Conversational AI Research Survey (CW1–CW4, PT1–PT6, SD1–SD8)
-- Safe to run multiple times in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1. Fresh Installation Table Definition (18 Active Psychological Items: CW1–CW4, PT1–PT6, SD1–SD8)
create table if not exists public.survey_responses (
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

-- 2. Idempotent Schema Update for Existing Databases
-- Step 2a: Ensure all required columns exist (including pt_5 and pt_6)
alter table public.survey_responses
  add column if not exists primary_ai_tool text,
  add column if not exists questionnaire_version text default 'v1_16_items',
  add column if not exists pt_5 smallint,
  add column if not exists pt_6 smallint,
  add column if not exists warmth_total numeric,
  add column if not exists warmth_mean numeric,
  add column if not exists trust_total numeric,
  add column if not exists trust_mean numeric,
  add column if not exists disclosure_total numeric,
  add column if not exists disclosure_mean numeric,
  add column if not exists withdrawal_code_hash text unique,
  add column if not exists withdrawal_deadline timestamptz not null default (now() + interval '3 days'),
  add column if not exists locked_for_analysis boolean not null default false;

-- Step 2b: Drop NOT NULL on obsolete columns (cw_5..cw_8, pt_7..pt_9, sd_9) and enforce NOT NULL + CHECK (1..5) on active columns (including pt_5 and pt_6)
do $$
declare
  v_obsolete_col text;
  v_active_col text;
begin
  -- Make obsolete columns nullable so they never block inserts
  foreach v_obsolete_col in array array['cw_5', 'cw_6', 'cw_7', 'cw_8', 'pt_7', 'pt_8', 'pt_9', 'sd_9']
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'survey_responses'
        and column_name = v_obsolete_col
    ) then
      execute format('alter table public.survey_responses alter column %I drop not null', v_obsolete_col);
    end if;
  end loop;

  alter table public.survey_responses
    alter column questionnaire_version set default 'v1_16_items';

  -- Ensure all 18 active columns (CW1–CW4, PT1–PT6, SD1–SD8) are NOT NULL with 1..5 CHECK constraint
  foreach v_active_col in array array[
    'cw_1', 'cw_2', 'cw_3', 'cw_4',
    'pt_1', 'pt_2', 'pt_3', 'pt_4', 'pt_5', 'pt_6',
    'sd_1', 'sd_2', 'sd_3', 'sd_4', 'sd_5', 'sd_6', 'sd_7', 'sd_8'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'survey_responses'
        and column_name = v_active_col
    ) then
      execute format('alter table public.survey_responses alter column %I set not null', v_active_col);
    end if;
  end loop;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.survey_responses'::regclass
      and conname = 'survey_responses_pt_5_check'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_pt_5_check check (pt_5 between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.survey_responses'::regclass
      and conname = 'survey_responses_pt_6_check'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_pt_6_check check (pt_6 between 1 and 5);
  end if;
end;
$$;

create index if not exists idx_survey_responses_withdrawal_hash
  on public.survey_responses (withdrawal_code_hash);

create index if not exists idx_survey_responses_questionnaire_version
  on public.survey_responses (questionnaire_version);

-- 3. Rate limiting table for withdrawal attempts
create table if not exists public.withdrawal_rate_limits (
  client_key_hash text primary key,
  attempt_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz
);

-- 4. Enable RLS & Permissions
alter table public.survey_responses enable row level security;
alter table public.withdrawal_rate_limits enable row level security;

drop policy if exists "Anonymous insert only" on public.survey_responses;
create policy "Anonymous insert only"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
revoke select, update, delete on public.survey_responses from anon, authenticated;
revoke all on public.withdrawal_rate_limits from anon, authenticated;

-- 5. Cryptographic withdrawal code generator using core pg_catalog CSPRNG (gen_random_uuid + sha256)
create or replace function public.generate_withdrawal_code()
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_entropy bytea;
  v_raw text := '';
  v_i integer;
  v_idx integer;
begin
  v_entropy := pg_catalog.sha256(
    convert_to(pg_catalog.gen_random_uuid()::text || '-' || pg_catalog.gen_random_uuid()::text, 'UTF8')
  );

  for v_i in 0..11 loop
    v_idx := (get_byte(v_entropy, v_i) % 32) + 1;
    v_raw := v_raw || substr(v_alphabet, v_idx, 1);
  end loop;

  return 'WDR-' || substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4) || '-' || substr(v_raw, 9, 4);
end;
$$;

-- 6. Atomic server-side submission RPC (CW1–CW4, PT1–PT6, SD1–SD8)
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

  -- Composite scores using the 18 active items (4 Warmth, 6 Trust, 8 Self-Disclosure)
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

-- 7. Atomic server-side withdrawal & data deletion RPC (3-calendar-day window)
create or replace function public.request_response_withdrawal(
  p_withdrawal_code text,
  p_client_key text default 'default_client'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_normalized_code text;
  v_code_hash text;
  v_client_hash text;
  v_rate_record public.withdrawal_rate_limits%rowtype;
  v_target_id uuid;
  v_submitted_at timestamptz;
  v_deadline timestamptz;
begin
  v_client_hash := encode(
    pg_catalog.sha256(convert_to(coalesce(nullif(trim(p_client_key), ''), 'default_client'), 'UTF8')),
    'hex'
  );

  select * into v_rate_record
  from public.withdrawal_rate_limits
  where client_key_hash = v_client_hash
  for update;

  if found then
    if v_rate_record.blocked_until is not null and v_rate_record.blocked_until > v_now then
      return jsonb_build_object(
        'status', 'rate_limited',
        'message', 'Too many withdrawal attempts. Please wait 15 minutes before trying again.'
      );
    end if;

    if v_rate_record.window_started_at < (v_now - interval '15 minutes') then
      update public.withdrawal_rate_limits
      set attempt_count = 0,
          window_started_at = v_now,
          blocked_until = null
      where client_key_hash = v_client_hash;
      v_rate_record.attempt_count := 0;
    end if;
  else
    insert into public.withdrawal_rate_limits (client_key_hash, attempt_count, window_started_at, blocked_until)
    values (v_client_hash, 0, v_now, null);
    v_rate_record.attempt_count := 0;
  end if;

  v_normalized_code := upper(regexp_replace(trim(coalesce(p_withdrawal_code, '')), '\s+', '', 'g'));

  if v_normalized_code !~ '^WDR-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$' then
    update public.withdrawal_rate_limits
    set attempt_count = attempt_count + 1,
        blocked_until = case when attempt_count + 1 >= 5 then v_now + interval '15 minutes' else null end
    where client_key_hash = v_client_hash;

    return jsonb_build_object(
      'status', 'invalid_code',
      'message', 'Invalid withdrawal code. Please check the code and try again.'
    );
  end if;

  v_code_hash := encode(pg_catalog.sha256(convert_to(v_normalized_code, 'UTF8')), 'hex');

  select id, submitted_at, withdrawal_deadline
  into v_target_id, v_submitted_at, v_deadline
  from public.survey_responses
  where withdrawal_code_hash = v_code_hash
  for update;

  if not found then
    update public.withdrawal_rate_limits
    set attempt_count = attempt_count + 1,
        blocked_until = case when attempt_count + 1 >= 5 then v_now + interval '15 minutes' else null end
    where client_key_hash = v_client_hash;

    return jsonb_build_object(
      'status', 'invalid_code',
      'message', 'Invalid withdrawal code. Please check the code and try again.'
    );
  end if;

  if v_now > v_deadline or v_now > (v_submitted_at + interval '3 days') then
    update public.survey_responses
    set locked_for_analysis = true
    where id = v_target_id;

    return jsonb_build_object(
      'status', 'expired',
      'message', 'The 3-day withdrawal period has expired. Your response is no longer eligible for deletion through the withdrawal code because it has been locked for research analysis.'
    );
  end if;

  delete from public.survey_responses
  where id = v_target_id
    and withdrawal_code_hash = v_code_hash;

  if not found then
    return jsonb_build_object(
      'status', 'error',
      'message', 'Could not complete deletion. Please try again.'
    );
  end if;

  delete from public.withdrawal_rate_limits
  where client_key_hash = v_client_hash;

  return jsonb_build_object(
    'status', 'deleted',
    'deleted_at', v_now,
    'message', 'Your submitted questionnaire response has been permanently deleted from the research database.'
  );
end;
$$;

-- 8. Drop legacy view if it exists (no separate view needed)
drop view if exists public.survey_responses_v1_16_items;

grant execute on function public.generate_withdrawal_code() to postgres, service_role;
grant execute on function public.submit_survey_response(jsonb) to anon, authenticated, service_role;
grant execute on function public.request_response_withdrawal(text, text) to anon, authenticated, service_role;
