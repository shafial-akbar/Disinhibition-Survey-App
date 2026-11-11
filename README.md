# Research Survey App

React + Vite participant-only survey with Supabase PostgreSQL, bilingual (English + Bengali) measurement scales, and a 7-calendar-day Participant Withdrawal Code & Data Deletion system.

## Run locally
1. Install Node.js 18.18+ (Node 20/22 LTS recommended).
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your Supabase Project URL and publishable/anon key.
5. Run `npm run dev`.

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql` (or `supabase/migrations/20261111000000_withdrawal_code_and_deletion.sql` if upgrading an existing `survey_responses` table).
3. Open Project Settings > API; copy Project URL and publishable/anon key.
4. Add them to `.env`, then restart Vite.

Never put a `service_role`/secret key in the React frontend.

### Optional: Supabase Edge Function (`withdraw-response`)
By default, the app uses the atomic `SECURITY DEFINER` PostgreSQL RPCs (`public.submit_survey_response` and `public.request_response_withdrawal`) installed by `supabase/schema.sql`.
If you also want IP-header rate limiting via Supabase Edge Functions:
1. Deploy `supabase/functions/withdraw-response/index.ts`:
   ```bash
   supabase functions deploy withdraw-response --no-verify-jwt
   ```
2. Set `VITE_USE_EDGE_FUNCTION=true` in `.env`.

## Run automated tests
```bash
node --test tests/withdrawal.test.mjs
```

## Build
`npm run build`
