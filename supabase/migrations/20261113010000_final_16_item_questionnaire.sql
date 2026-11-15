-- Idempotent Migration: Upgrade existing public.survey_responses to the Final 16-Item Questionnaire
-- Preserves all existing records, marks historical 26-item records as 'v0_26_items',
-- makes obsolete columns (cw_5..cw_8, pt_5..pt_9, sd_9) nullable, adds primary_ai_tool
-- and questionnaire_version, and updates composite score calculations in submit_survey_response.

alter table public.survey_responses
  add column if not exists primary_ai_tool text,
  add column if not exists questionnaire_version text,
  add column if not exists warmth_total numeric,
  add column if not exists warmth_mean numeric,
  add column if not exists trust_total numeric,
  add column if not exists trust_mean numeric,
  add column if not exists disclosure_total numeric,
  add column if not exists disclosure_mean numeric,
  add column if not exists withdrawal_code_hash text unique,
  add column if not exists withdrawal_deadline timestamptz not null default (now() + interval '3 days'),
  add column if not exists locked_for_analysis boolean not null default false;

do $$
declare
  v_obsolete_col text;
  v_active_col text;
  v_has_cw5 boolean := false;
begin
  -- 1. Safely drop NOT NULL on obsolete 26-item columns so they do not block 16-item submissions
  foreach v_obsolete_col in array array['cw_5', 'cw_6', 'cw_7', 'cw_8', 'pt_5', 'pt_6', 'pt_7', 'pt_8', 'pt_9', 'sd_9']
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'survey_responses'
        and column_name = v_obsolete_col
    ) then
      if v_obsolete_col = 'cw_5' then
        v_has_cw5 := true;
      end if;
      execute format('alter table public.survey_responses alter column %I drop not null', v_obsolete_col);
    end if;
  end loop;

  -- 2. Preserve historical version ('v0_26_items') on existing records before setting default
  if v_has_cw5 then
    execute $sql$
      update public.survey_responses
      set questionnaire_version = case
        when cw_5 is not null then 'v0_26_items'
        else coalesce(questionnaire_version, 'v0_26_items')
      end
      where questionnaire_version is null
    $sql$;
  else
    update public.survey_responses
    set questionnaire_version = 'v0_26_items'
    where questionnaire_version is null;
  end if;

  -- 3. Set default version for new 16-item submissions
  alter table public.survey_responses
    alter column questionnaire_version set default 'v1_16_items';

  -- 4. Ensure all 16 active columns remain NOT NULL
  foreach v_active_col in array array[
    'cw_1', 'cw_2', 'cw_3', 'cw_4',
    'pt_1', 'pt_2', 'pt_3', 'pt_4',
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
end;
$$;

create index if not exists idx_survey_responses_questionnaire_version
  on public.survey_responses (questionnaire_version);

-- 5. Update server-side submission RPC for the 16-item questionnaire
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
  v_pt_1 smallint; v_pt_2 smallint; v_pt_3 smallint; v_pt_4 smallint;
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

  v_sd_1 := (p_payload->>'sd_1')::smallint;
  v_sd_2 := (p_payload->>'sd_2')::smallint;
  v_sd_3 := (p_payload->>'sd_3')::smallint;
  v_sd_4 := (p_payload->>'sd_4')::smallint;
  v_sd_5 := (p_payload->>'sd_5')::smallint;
  v_sd_6 := (p_payload->>'sd_6')::smallint;
  v_sd_7 := (p_payload->>'sd_7')::smallint;
  v_sd_8 := (p_payload->>'sd_8')::smallint;

  if v_cw_1 is null or v_cw_2 is null or v_cw_3 is null or v_cw_4 is null or
     v_pt_1 is null or v_pt_2 is null or v_pt_3 is null or v_pt_4 is null or
     v_sd_1 is null or v_sd_2 is null or v_sd_3 is null or v_sd_4 is null or
     v_sd_5 is null or v_sd_6 is null or v_sd_7 is null or v_sd_8 is null then
    raise exception 'All 16 questionnaire items are required before calculating scores.';
  end if;

  v_warmth_total := (v_cw_1 + v_cw_2 + v_cw_3 + v_cw_4)::numeric;
  v_warmth_mean := round(v_warmth_total / 4.0, 2);

  v_trust_total := (v_pt_1 + v_pt_2 + v_pt_3 + v_pt_4)::numeric;
  v_trust_mean := round(v_trust_total / 4.0, 2);

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
    pt_1, pt_2, pt_3, pt_4,
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
    v_pt_1, v_pt_2, v_pt_3, v_pt_4,
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

-- 6. Analysis & Export View for Final 16-Item Questionnaire ('v1_16_items' only)
create or replace view public.survey_responses_v1_16_items as
select
  id,
  questionnaire_version,
  submitted_at,
  age_group,
  gender,
  education,
  occupation,
  primary_ai_tool,
  ai_tools,
  ai_frequency,
  ai_duration,
  ai_purpose,
  ai_familiarity,
  cw_1, cw_2, cw_3, cw_4,
  pt_1, pt_2, pt_3, pt_4,
  sd_1, sd_2, sd_3, sd_4, sd_5, sd_6, sd_7, sd_8,
  warmth_total,
  warmth_mean,
  trust_total,
  trust_mean,
  disclosure_total,
  disclosure_mean,
  withdrawal_deadline,
  locked_for_analysis
from public.survey_responses
where questionnaire_version = 'v1_16_items';

revoke all on public.survey_responses_v1_16_items from anon, authenticated;
