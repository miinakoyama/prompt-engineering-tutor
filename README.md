# Prompt Engineering Tutor

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5ae6b943-0750-4e1c-ad7d-e0b141bdfeca

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` with:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_ENV` (`local` for local run, `production` on Vercel)
   - `ADMIN_DASHBOARD_PASSCODE`
3. In Supabase SQL editor, run `supabase/schema.sql`.
4. Run the app:
   `npm run dev`

## Admin Dashboard

- Open `/admin` in the deployed app or local dev server.
- Enter `ADMIN_DASHBOARD_PASSCODE`.
- Use:
  - **Load Data** to fetch sessions/pending attempts
  - **Grade Pending** to grade pre/post submissions later
  - **Export CSV/JSON** for analysis
