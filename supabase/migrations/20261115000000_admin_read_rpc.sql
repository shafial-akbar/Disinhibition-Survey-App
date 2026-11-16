-- Non-destructive Admin Read RPC + v1_18_items Default Sync
-- Keeps public.survey_responses RLS intact (anon can INSERT only; SELECT stays revoked)
-- Never returns withdrawal_code_hash to the client.

alter table public.survey_responses
  alter column questionnaire_version set default 'v1_18_items';

create or replace function public.admin_get_survey_responses()
returns table (
  id uuid,
  age_group text,
  gender text,
  education text,
  occupation text,
  ai_tools jsonb,
  primary_ai_tool text,
  ai_frequency text,
  ai_duration text,
  ai_purpose jsonb,
  ai_familiarity text,
  questionnaire_version text,
  cw_1 smallint, cw_2 smallint, cw_3 smallint, cw_4 smallint,
  pt_1 smallint, pt_2 smallint, pt_3 smallint, pt_4 smallint, pt_5 smallint, pt_6 smallint,
  sd_1 smallint, sd_2 smallint, sd_3 smallint, sd_4 smallint, sd_5 smallint, sd_6 smallint, sd_7 smallint, sd_8 smallint,
  warmth_total numeric,
  warmth_mean numeric,
  trust_total numeric,
  trust_mean numeric,
  disclosure_total numeric,
  disclosure_mean numeric,
  submitted_at timestamptz,
  withdrawal_deadline timestamptz,
  locked_for_analysis boolean
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    id, age_group, gender, education, occupation,
    ai_tools, primary_ai_tool, ai_frequency, ai_duration, ai_purpose, ai_familiarity,
    questionnaire_version,
    cw_1, cw_2, cw_3, cw_4,
    pt_1, pt_2, pt_3, pt_4, pt_5, pt_6,
    sd_1, sd_2, sd_3, sd_4, sd_5, sd_6, sd_7, sd_8,
    warmth_total, warmth_mean,
    trust_total, trust_mean,
    disclosure_total, disclosure_mean,
    submitted_at, withdrawal_deadline, locked_for_analysis
  from public.survey_responses
  order by submitted_at desc;
$$;

grant execute on function public.admin_get_survey_responses() to anon, authenticated, service_role;
