Today's Check-in feature
=========================

What this implements
- A simple check-in form (`src/screens/TodaysCheckInScreen.tsx`).
- A service that saves check-ins to Supabase and a separate processor that computes risk and calls OpenAI when risk >= 0.5 (`src/services/checkInService.ts`).

Supabase tables used
- `checkins` (created by the app when the user submits the form)
  - columns: `id`, `user_id`, `mood`, `tiredness`, `environment_comfort`, `notes`, `processed` (boolean), `created_at`
- `risk_assessments` (populated by the processor)
  - columns: `id`, `checkin_id`, `user_id`, `risk_score`, `ai_alert`, `ai_message`, `assessment_payload`, `created_at`
- crowdness data is expected in two tables (malls + MRT): `mall_crowdness` and `mrt_crowdness`
  - columns: `level` (0-100), `duration_minutes`, `created_at`
  - the processor reads the latest row from each table and combines them when computing risk

Environment variables / config
- `src/config/env.ts` exports the Supabase values used by `src/lib/supabase.ts`:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- The AI endpoint used when risk > 0.5 is available at `AI_API_URL` (also in `src/config/env.ts`).

How it works
- On form submit: the app saves a row to `checkins` and does NOT run the risk calculation immediately.
- Processing: call `processNextUnprocessedCheckin()` in `src/services/checkInService.ts` which:
  - finds the next unprocessed `checkins` row
  - fetches supporting data: `heart_rate`, `sleep_summary`, `mall_crowdness`, and `mrt_crowdness` latest rows
  - computes a normalized risk score in [0..1]
  - if `riskScore >= 0.5`, calls OpenAI to request recommended actions and rationale
  - inserts a `risk_assessments` row and marks the checkin as processed

Next steps
- Replace simulated heart rate / sleep quality with real device data.
- Adjust weights in `checkInService.ts` to match clinical or product requirements.
- Implement mobile push notifications for urgent AI alerts.
