# Bible Run

A Bible-knowledge quiz web app. Players race the clock and compete against
players from around the world; every question is grounded in a real,
source-verified Bible text with context and citation, not AI guesswork.

Live at [biblerun.se](https://biblerun.se).

## Tech stack

- **Frontend**: React 18 + Vite + Tailwind CSS, single main component
  (`src/BibleRun.jsx`). No router, no state library - plain `useState`.
- **Backend**: Supabase (Postgres + Row Level Security + `SECURITY DEFINER`
  RPC functions + Edge Functions + `pg_net`). Project ref
  `mhgnikriicjamwmxdjdg`.
- **Email**: [Resend](https://resend.com), called from Supabase Edge
  Functions.
- **Hosting**: Netlify, auto-deploying from the `main` branch on GitHub.

## Project structure

```
src/
  BibleRun.jsx   # the entire app: state, screens, i18n dictionary, admin panel
  main.jsx       # React root
  index.css      # Tailwind directives only
public/
  favicon.svg
index.html
netlify.toml     # build command + publish dir for Netlify
```

## Data model & security architecture

**No table has a broad RLS policy.** Every table has Row Level Security
enabled; almost none has a policy attached, so `anon`/`authenticated` can't
read or write them directly. All reads and writes go through
`SECURITY DEFINER` Postgres functions (`public.*` RPCs, called via
PostgREST as `rpc/<name>`), which validate input, hash passwords with
`pgcrypto` (`crypt()` / `gen_salt('bf')`), and enforce authorization
themselves.

The two narrow exceptions:
- `questions`: public `SELECT` limited to `status = 'approved' AND is_active`.
- `contact_messages`: public `INSERT` only (the contact form).

Two views (`players_public`, `leaderboard`) are intentionally
`SECURITY DEFINER` so the leaderboard can read across `players` and
`game_sessions` without opening direct policies on either - the columns
they expose are verified safe (never email or password hash). See the
`COMMENT ON VIEW` text on both in the database for the full rationale.

Key RPCs: `signup_player`, `login_player`, `request_password_reset` /
`complete_password_reset`, `oauth_upsert_player`, `submit_game_result`,
`get_player_stats`, and the `admin_*` family (passcode-gated via
`admin_check`).

**Rate limiting**: `login_player` and `admin_check` both block after 10
failed attempts within 15 minutes (tracked in `auth_attempts`, keyed by
email for login and a shared identity for the admin passcode; cleared on
success).

## Password reset flow

1. Client calls `request_password_reset(email, lang)`.
2. The RPC generates a token, stores its bcrypt hash in
   `password_reset_tokens` (30 min expiry), and fires a `pg_net.http_post`
   to the `send-password-reset` Edge Function with a shared-secret header.
3. The Edge Function sends the email via Resend, localized into the
   player's UI language (falls back to English for anything unrecognized).
4. The link (`https://biblerun.se/?reset_token=...`) opens the app's
   "set new password" screen, which calls `complete_password_reset`.

## Contact form flow

`contact_messages` INSERT → a database trigger calls
`notify-contact-message` (Edge Function) via `pg_net`, which emails the
owner through Resend. Visible to the owner in the admin panel's
"Meddelanden" tab.

## Internationalization

24 languages: sv, en, no, da, fi, es, pt, fr, de, it, nl, pl, ru, ar, zh,
hi, vi, id, tr, el, sw, tl, ko, th - flat-key dictionary
(`TRANSLATIONS` in `BibleRun.jsx`), `translate(lang, key, vars)` with
`{var}` interpolation. Arabic renders right-to-left (`dir="rtl"`).

Language auto-detects from `navigator.languages` on first visit (falls
back to English), then persists to `localStorage`. English is also the
fallback for any missing key in any language.

Counts that need grammatical agreement (currently just
`ready.questions_count`) use `Intl.PluralRules(lang).select(count)` to
pick a `_one` / `_few` / `_many` / `_other` key variant where the
language actually inflects (e.g. Polish, Russian, Arabic); languages
where the noun is invariant (e.g. Norwegian, Thai, Chinese) just use the
base key.

The admin panel itself is Swedish-only by design - it's an internal tool
for the app owner, not player-facing.

## Admin panel

Reached via the "Admin" footer link, gated by a passcode checked against
`admin_config.passcode_hash` (bcrypt). Tabs:

- **Att granska** - approve/edit/reject pending questions.
- **Publicerade** - activate/deactivate published questions.
- **Meddelanden** - contact form submissions, mark handled.
- **Kyrko-agent** - read-only view of Resend contacts/segments/domains for
  the church outreach effort, plus editable limits (max countries per
  batch, max emails per day) stored in `outreach_config`. **Nothing is
  ever sent from here** - the actual send flow doesn't exist yet, and
  sending always requires explicit owner approval when it's built.

There is currently no AI question generation in the app - it was removed
because it exposed an API key client-side and had no source-verification.
Rebuilding it safely (server-side, verified against the four licensed
source Bible texts, with question-variant generation and shuffling) is
tracked as a separate task.

## Known placeholders / not yet finished

- **Payment** ("Skicka en gåva") explicitly tells the visitor no payment
  can be received yet - no provider is connected.
- **Google/Facebook OAuth** buttons are real Supabase Auth calls but
  won't work until the owner registers OAuth apps with Google/Meta and
  configures the client ID/secret in the Supabase dashboard.
- **biblerun.se is not yet a verified sending domain in Resend** - all
  outbound email (password reset, contact notifications) currently sends
  from a different verified domain until DNS records are added at the
  registrar and the domain is verified in Resend.
- **Question inventory is small.** Content must be manually reviewed and
  approved in the admin panel before it's playable; there is no bulk
  content pipeline yet (see AI question generation above).

## Local development

```
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

The Supabase URL and publishable (anon) key are hardcoded in
`BibleRun.jsx` - safe to commit, since every table is locked down at the
RLS layer and all real access goes through the RPCs described above.

## Deployment

Netlify auto-deploys `main` (build command and publish dir come from
`netlify.toml`). Push to `main` to ship.
