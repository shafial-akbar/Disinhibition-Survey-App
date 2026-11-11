create extension if not exists pgcrypto;
create table if not exists public.survey_responses (
 id uuid primary key default gen_random_uuid(),
 age_group text not null check(age_group in ('18–24 years','25–34 years','35–44 years','45 years or above')),
 gender text, education text not null, occupation text,
 ai_tools jsonb not null, ai_frequency text not null, ai_duration text not null,
 ai_purpose jsonb not null, ai_familiarity text not null,
 cw_1 smallint not null check(cw_1 between 1 and 5), cw_2 smallint not null check(cw_2 between 1 and 5),
 cw_3 smallint not null check(cw_3 between 1 and 5), cw_4 smallint not null check(cw_4 between 1 and 5),
 cw_5 smallint not null check(cw_5 between 1 and 5), cw_6 smallint not null check(cw_6 between 1 and 5),
 cw_7 smallint not null check(cw_7 between 1 and 5), cw_8 smallint not null check(cw_8 between 1 and 5),
 pt_1 smallint not null check(pt_1 between 1 and 5), pt_2 smallint not null check(pt_2 between 1 and 5),
 pt_3 smallint not null check(pt_3 between 1 and 5), pt_4 smallint not null check(pt_4 between 1 and 5),
 pt_5 smallint not null check(pt_5 between 1 and 5), pt_6 smallint not null check(pt_6 between 1 and 5),
 pt_7 smallint not null check(pt_7 between 1 and 5), pt_8 smallint not null check(pt_8 between 1 and 5),
 pt_9 smallint not null check(pt_9 between 1 and 5),
 sd_1 smallint not null check(sd_1 between 1 and 5), sd_2 smallint not null check(sd_2 between 1 and 5),
 sd_3 smallint not null check(sd_3 between 1 and 5), sd_4 smallint not null check(sd_4 between 1 and 5),
 sd_5 smallint not null check(sd_5 between 1 and 5), sd_6 smallint not null check(sd_6 between 1 and 5),
 sd_7 smallint not null check(sd_7 between 1 and 5), sd_8 smallint not null check(sd_8 between 1 and 5),
 sd_9 smallint not null check(sd_9 between 1 and 5),
 submitted_at timestamptz not null default now()
);
alter table public.survey_responses enable row level security;
drop policy if exists "Anonymous insert only" on public.survey_responses;
create policy "Anonymous insert only" on public.survey_responses for insert to anon with check(true);
grant usage on schema public to anon;
grant insert on public.survey_responses to anon;
revoke select,update,delete on public.survey_responses from anon,authenticated;
