# Repository Guidelines

## Project Structure & Module Organization
- `server.js` hosts the Express API, Socket.IO gateway, and Supabase/Nodemailer/Puppeteer utilities.
- Dashboards and experiments live in feature folders such as `dashboard/`, `chest-strap-app/`, `kernel/`, `simulator/`, `tinyML/`, and `firmware/`; datasets and generated artifacts live under `datasets/` and `supabase/`.
- Automated tests belong in `tests/` (mirrors runtime folders like `tests/kernel/`). Use co-located fixtures beside each suite.

## Build, Test, and Development Commands
- `npm start` spins up the local API/websocket bridge via `server.js` using `.env` or `.env.local` for secrets.
- `npm test` runs every Node test (`node --test tests/**/*.test.js`). Favor this before commits.
- `npm run test:kernel` narrows execution to kernel-specific suites; ideal while iterating on DSP/ML logic.

## Coding Style & Naming Conventions
- JavaScript modules use CommonJS with 4-space indents, single quotes, and camelCase functions (`storeReading`, `ensureDeviceExists`).
- Favor descriptive folder names (`body-tracker`, `home-freezer`) and kebab-case route directories inside UI bundles.
- Keep async helpers pure and place shared utilities under `kernel/` or top-level helpers to ease reuse.

## Testing Guidelines
- Stick with the built-in Node test runner. Name files `*.test.js` and describe behavior blocks with actionable verbs.
- Add Supabase or MQTT mocks for networked modules; keep credentials stubbed through environment variables.
- Ensure every new alerting path or device ingestion flow has at least one regression test covering fault cases.

## Commit & Pull Request Guidelines
- Follow the existing short, imperative subject format (`Fix door monitor false positives`, `Add BLE chest strap page`). Prefix with component or area when relevant.
- Each PR should list the affected modules, manual test evidence (commands, screenshots for dashboards), and linked issue or plan ID.
- Document secret or config changes (new `.env` keys, Supabase tables) in the description and update onboarding docs when introducing them.

## Security & Configuration Tips
- Load secrets through `.env`/`.env.local`; never hard-code API keys inside `server.js` or dashboard bundles.
- When developing against Supabase, restrict keys to least privilege and confirm read/write scopes before pushing.
- Redact device identifiers or customer data in fixtures and documentation unless explicitly approved.
