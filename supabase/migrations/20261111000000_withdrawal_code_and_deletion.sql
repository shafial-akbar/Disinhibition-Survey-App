-- Migration: Restore RLS Insert Policy & Install Withdrawal RPC Functions
-- Copy and run this ENTIRE file in the Supabase SQL Editor.

alter table public.survey_responses
  add column if not exists withdrawal_code_hash text unique,
  add column if not exists withdrawal_deadline timestamptz not null default (now() + interval '3 days'),
  add column if not exists locked_for_analysis boolean not null default false;

create index if not exists idx_survey_responses_withdrawal_hash
  on public.survey_responses (withdrawal_code_hash);

create table if not exists public.withdrawal_rate_limits (
  client_key_hash text primary key,
  attempt_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz
);

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
begin
  if p_payload is null then
    raise exception 'Missing survey payload';
  end if;

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
    (p_payload->>'cw_1')::smallint, (p_payload->>'cw_2')::smallint,
    (p_payload->>'cw_3')::smallint, (p_payload->>'cw_4')::smallint,
    (p_payload->>'cw_5')::smallint, (p_payload->>'cw_6')::smallint,
    (p_payload->>'cw_7')::smallint, (p_payload->>'cw_8')::smallint,
    (p_payload->>'pt_1')::smallint, (p_payload->>'pt_2')::smallint,
    (p_payload->>'pt_3')::smallint, (p_payload->>'pt_4')::smallint,
    (p_payload->>'pt_5')::smallint, (p_payload->>'pt_6')::smallint,
    (p_payload->>'pt_7')::smallint, (p_payload->>'pt_8')::smallint,
    (p_payload->>'pt_9')::smallint,
    (p_payload->>'sd_1')::smallint, (p_payload->>'sd_2')::smallint,
    (p_payload->>'sd_3')::smallint, (p_payload->>'sd_4')::smallint,
    (p_payload->>'sd_5')::smallint, (p_payload->>'sd_6')::smallint,
    (p_payload->>'sd_7')::smallint, (p_payload->>'sd_8')::smallint,
    (p_payload->>'sd_9')::smallint,
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

grant execute on function public.generate_withdrawal_code() to postgres, service_role;
grant execute on function public.submit_survey_response(jsonb) to anon, authenticated, service_role;
grant execute on function public.request_response_withdrawal(text, text) to anon, authenticated, service_role;
