# Research Survey App

React + Vite participant-only survey with Supabase PostgreSQL.

## Run locally
1. Install Node.js 18.18+ (Node 20 LTS recommended).
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your Supabase Project URL and publishable/anon key.
5. Run `npm run dev`.

PowerShell copy command: `Copy-Item .env.example .env`

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Open Project Settings > API; copy Project URL and publishable/anon key.
4. Add them to `.env`, then restart Vite.

Never put a service_role/secret key in the React frontend.

## Build
`npm run build`

## Deploy
Deploy to Vercel or another static host and configure the same two environment variables.

## Research/privacy checklist
This is a technical draft, not an ethics-approved protocol or validated instrument. Obtain written ethics approval/exemption before pilot testing or main data collection, as directed by your supervisor/committee. Confirm approved consent wording, researcher/supervisor contact details, data retention, hosting region, and privacy disclosures. Do not collect direct identifiers or sensitive data. Public participants can insert only; no public read/update/delete policy is provided. This starter does not yet include robust duplicate detection, bot protection, rate limiting, or researcher export tooling. Check Supabase free-plan limits, backup behavior, inactivity/pausing, and data location before use.
