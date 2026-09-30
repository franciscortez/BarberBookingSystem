# Vercel deployment audit — September 30, 2026

## Scope and deployment

This audit covers deployment packaging, public routing, configuration presence, and database health checks. It is not a complete security or booking/payment audit.

- Project: `barber-booking-system`, team `bamcortezzs-projects`.
- Production alias: <https://gentlemensquarter.vercel.app>.
- Deployment: `dpl_64gxstqP7KA2woN3qyFYdgxhrgsx`.
- Deployed commit: `30b3366d26833b9c981aba21fb086429451f14ee` on `main`.
- Vercel reports `READY`, framework `services`, Node `24.x`.
- Build logs use Vercel CLI `60.1.3` and show successful frontend and backend dependency installation and compilation.

Project settings, build logs, runtime logs, and public GET responses were inspected. No deployment, project settings, environment values, database records, bookings, payments, or emails were changed.

## Findings

### High: the deployed backend cannot load its dependencies

Both `/api/health` and `/api/catalog` return HTTP 500 with `FUNCTION_INVOCATION_FAILED`. Runtime logs show `Cannot find module 'express'` from `/var/task/index.js`. Express is already declared in `backend/package.json`; this is not a missing dependency declaration or failed npm installation.

An isolated standalone Vercel build reproduced the failure. The original function places compiled `index.js` at its root but places runtime packages under `backend/node_modules`. Node resolves dependencies relative to the handler, so those packages are unavailable to the root handler. Other runtime dependencies fail for the same reason. A successful build and `READY` status do not prove that a function can start.

The local fix builds the backend service from the repository root, pins the Express framework, and identifies `backend/index.ts` explicitly. The generated handler and runtime packages retain matching `backend/` paths. The install command uses the package manifest nearest the entrypoint, while the explicit build command runs `npm run build --prefix backend` from the service root. `npm ci --include=dev` preserves the existing lockfile and supplies TypeScript tools when `NODE_ENV=production`.

No dependency versions or lockfiles changed. The generated function was copied outside the source tree and imported successfully, preventing locally installed dependencies from masking packaging failures.

### High: direct frontend links return 404

Direct GET requests to `/book`, `/login`, and `/signup` return HTTP 404, although `/` and `/index.html` return HTTP 200. Client-side navigation may still display a route, explaining why a booking screenshot can show the page while a refresh fails.

The original generated frontend service has no SPA rewrite. Its nested `frontend/vercel.json` is not automatically incorporated into the Services build. The local fix declares the SPA fallback within the frontend service in the root configuration. Generated routing now serves existing files first and falls back to `/index.html` for frontend routes. Top-level routing sends `/api` and `/api/*` to the backend before the frontend catch-all.

### Unverified: production database and catalog schema

`backend/index.ts` already exposes `/api/health`, which executes `SELECT 1`. A successful response is HTTP 200 with `{"status":"ok","database":"connected"}`. An application-level database failure returns HTTP 500 with `{"status":"error","database":"disconnected"}`.

The deployed startup failure occurs before this query can run. The database has therefore not been proven connected or disconnected. The `DATABASE_URL` environment variable is configured for production and preview, but configuration presence alone does not establish a valid connection, permissions, schema, or data.

After deploying the fix, inspect these read-only endpoints:

```bash
curl -i https://gentlemensquarter.vercel.app/api/health
curl -i https://gentlemensquarter.vercel.app/api/catalog
```

Health validates connectivity only. Catalog validates its actual table queries and returns the available data. Empty catalog arrays are distinct from a failed query. Directly open and refresh `/book`, `/login`, and `/signup` after redeployment.

### Review before payment testing: preview uses production configuration names

`NODE_ENV` and the `PAYMONGO_LIVE_*` variables are configured for both production and preview. The backend selects live payment configuration when `NODE_ENV=production`. Environment values were not decrypted or inspected, so this audit does not establish which account, mode, or database a preview actually uses.

Before any end-to-end booking or payment test on a preview deployment, verify its environment isolation and PayMongo mode. No booking, payment, webhook, cleanup, or email endpoint was invoked during this audit.

### Follow-up: dependency audit warnings

The lockfile-based installs reported 7 frontend advisories (3 moderate, 4 high) and 12 backend advisories (1 low, 6 moderate, 5 high), including development dependencies. These install summaries were not individually validated for runtime reachability or exploitability. They do not explain the module-resolution failure. No automatic dependency upgrades were applied; dependency review remains a separate follow-up.

## Local validation

- `git fetch origin` and `git pull --ff-only origin main`: passed; checkout already matched remote `main`.
- `npm run typecheck --prefix backend`: passed before edits.
- `npx vercel@61.1.0 build --standalone --scope bamcortezzs-projects`: passed in an isolated source copy with dummy environment values.
- `npx vercel@60.1.3 build --standalone --scope bamcortezzs-projects`: passed with the same configuration, matching the production build's CLI version.
- `npm run verify:vercel -- <isolated-output>`: passed against the generated artifact. It checks API/service routing, frontend deep links, static asset priority, every declared runtime dependency, actual isolated handler import, unauthenticated rejection, and mocked connected/disconnected database health responses.
- `npm run typecheck`: passed for frontend and backend.
- `npm run lint`: passed for frontend and backend.
- Changed deployment JSON, verification script, audit notes, and README formatting: passed Prettier checks.
- `git diff --check`: passed.

The artifact smoke test uses dummy credentials and mocked queries. It does not prove production database connectivity, catalog contents, authentication success, booking persistence, payment processing, or email delivery. Hosted verification remains pending deployment. The patch contains no migrations, RLS/grant changes, money-path changes, or production-data changes.

## References

- [Deployment details and build logs](https://vercel.com/bamcortezzs-projects/barber-booking-system/64gxstqP7KA2woN3qyFYdgxhrgsx).
- [Runtime logs](https://vercel.com/bamcortezzs-projects/barber-booking-system/logs).
- [Vercel Services configuration](https://vercel.com/docs/services/config-reference).
- [Vercel Services routing](https://vercel.com/docs/services/routing).
- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).
- [Vite SPA routing on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
