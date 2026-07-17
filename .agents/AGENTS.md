# Project Custom Rules

## Mandatory Initial Context Check

- **Check Rules & KIs First**: Before performing any research, code analysis, or modifications, always inspect `AGENTS.md` and Knowledge Item (KI) summaries first to adhere strictly to established architectural rules and repository patterns.

## File Naming Conventions

- Name files strictly according to their architectural layer, using dot-separated suffixes:
  - Controllers: `*.controller.ts` (e.g., `appointment.controller.ts`)
  - Services: `*.services.ts` (e.g., `appointment.services.ts`)
  - Models: `*.model.ts` (e.g., `appointment.model.ts`)
  - Routes: `*.routes.ts` (e.g., `appointment.routes.ts`)
  - Validation: `*.validation.ts` (e.g., `appointment.validation.ts`)

## Architecture & Separation of Concerns

- **Thin Controllers**: Controllers must only parse request inputs, delegate processing to the services layer, and format the HTTP response. Avoid placing database queries or complex logic inside controllers.
- **Safe Body Parsing**: When reading request body fields in controllers, use safe navigation operators (e.g., `req.body?.param`) to avoid type crashes if `req.body` is undefined in test/headless pipelines.
- **Service Layer**: All business logic, database transaction orchestrations, external API calls, and schema parsing are handled in service files.
- **Validation Layer**: Keep all Zod validation schemas in a dedicated `validation/` directory. Services import schemas from here.
- **Soft-Deletion Filters**: In query models, ensure that fetches (including single row gets by ID) include active filters (e.g. `is_active = true` / `is_active: true`) so soft-deleted entities are not returned.
- **Global Error Handling**: Errors in controllers must be delegated to the global error middleware via `next(err)`. Do not write per-endpoint custom try-catch response blocks. Throw `AppError` subclasses inside services to return specific status codes.

## Database Casing for Drizzle ORM

- When defining or updating Drizzle schemas, map Drizzle property names to snake_case (matching their database columns) instead of standard camelCase.
- Example: Use `created_at: timestamp('created_at')` instead of `createdAt: timestamp('created_at')`. This preserves compatibility with the existing controller models, tests, and frontend.

## Pure Drizzle ORM Query Builder & Transactions

- **No Raw SQL Queries or Manual Pool Clients**: All database operations and transaction orchestrations in `backend/model/*.ts` and `backend/services/*.ts` must use Drizzle ORM query builder methods (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`, `db.transaction()`) with schema tables imported from `config/db/schema.ts`. Avoid manual `pool.connect()`, `client.query("BEGIN")`, or raw SQL strings.

## ESLint & TypeScript CommonJS Integration

- Allow CommonJS `require()` syntax (e.g., `import pool = require(...)`) in TypeScript files without triggering linting failures. Disable `@typescript-eslint/no-require-imports` and `@typescript-eslint/no-var-requires` in `eslint.config.js`.

## Local API Communication

- Always verify that `VITE_API_URL` in the frontend `.env` matches the exact port and protocol (HTTP vs HTTPS) of the active backend server configurations.
- **Ngrok & CORS**: Frontend requests in `src/services/api.ts` and direct `fetch()` calls (e.g. in `AuthContext.tsx`) must include `'ngrok-skip-browser-warning': 'true'` header to bypass ngrok free tier warning pages.
- Backend `buildCorsOptions` in `backend/config/cors.ts` must explicitly list `'ngrok-skip-browser-warning'` in `allowedHeaders`.

## Unified Role-Based Authentication

- Authentication endpoints must support auto-role detection via a single `POST /api/auth/login` endpoint that accepts an identifier (email or username) and password. Do not force role selection tabs on login forms.

## Frontend Types Organization

- Organize frontend TypeScript types in dedicated domain files within `src/types/` (e.g., `auth.ts`, `barber.ts`, `service.ts`, `appointment.ts`, `payment.ts`) and re-export all from `src/types/index.ts`.

## React Fast Refresh & Hooks Guidelines

- Every `.tsx` file must export ONLY React components. Helper functions, utility constants, and TypeScript types shared across components must live in sibling `.ts` files (e.g., `servicesUtils.ts`, `teamUtils.ts`), NOT in the `.tsx` component file. Mixed exports (component + non-component) in the same `.tsx` file will fail the `react-refresh/only-export-components` ESLint rule.
- Place `createContext` definitions in a separate object file (e.g., `AuthContextObject.ts`) and hooks in `src/hooks/` (e.g., `src/hooks/useAuth.ts`).
- Page-shell components (under `pages/`) may re-import helpers directly from the `.ts` utils files — do NOT re-export them through the `.tsx` section file to avoid the same violation.

## Integration Tests Database Operations

- Test suites creating admin user records in test hooks (`beforeAll`) must insert into `users` table with `role = 'admin'` and use `{ identifier, password }` in login request payloads.

## Gmail SMTP Configuration

- When configuring Gmail in `.env`, set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, and use a 16-character Google App Password for `EMAIL_PASS`. `EMAIL_FROM` domain must match `EMAIL_USER`.

## Frontend Sections & Pages Architecture

- Pages live under `src/pages/<role>/` (e.g., `pages/user/`, `pages/admin/`, `pages/barber/`). Each page is a thin shell: state, data fetching, and event handlers only — no inline JSX blocks.
- All JSX content is extracted into section components under `src/sections/<role>/<domain>/` (e.g., `sections/user/home/HeroSection.tsx`, `sections/user/booking/DateTimeStep.tsx`).
- **Modal Extraction**: Extract all modal dialogs (e.g. `CreateBarberModal.tsx`, `EditBarberModal.tsx`, `ViewBarberModal.tsx`, `CreateServiceModal.tsx`) into dedicated `.tsx` section components under `src/sections/<role>/<domain>/`. Do not inline modal forms inside parent section components.
- **Admin Entity Tables & Pending States**: Render admin lists (Barbers, Services, Appointments, Payments) in structured HTML data tables. Pending items (e.g., pending invitations) must be rendered directly as table rows with a `Pending` status pill badge rather than in standalone top containers.
- Non-component helpers for a section live in a sibling `.ts` utils file in the same directory (e.g., `sections/user/home/servicesUtils.ts`).
- `lazyRoutes.ts` always imports from `pages/<role>/`, never directly from `sections/`.
- **Prevent Horizontal Layout Overflow**: Root container in `App.tsx` must include `overflow-x-hidden relative`. Ambient background glows must use `w-full max-w-[PX_SIZE]` (e.g. `w-full max-w-[500px]`) rather than fixed width `w-[500px]` with translations to prevent viewport overflow.
- **Navbar Responsive Breakpoint**: Navbar must use `lg` (1024px) for desktop nav links vs mobile drawer toggle (`hidden lg:flex` and `lg:hidden`) to avoid tablet menu squeezing.

## Workspace NPM Scripts & Formatting

- Workspace `package.json` files must define `"format"` and `"format:check"` scripts invoking `npx prettier`:
  - `"format": "npx prettier --write ..."`
  - `"format:check": "npx prettier --check ..."`
- `frontend/package.json` must always include these scripts:
  - `"lint": "eslint src --ext .ts,.tsx"` — scope to `src/` with explicit extensions
  - `"lint:fix": "eslint src --ext .ts,.tsx --fix"` — auto-fix variant
  - `"typecheck": "tsc --noEmit"` — type-check without emitting files
  - `"format": "npx prettier --write \"src/**/*.{ts,tsx,css,json}\""` — Prettier format
- Use `npm run typecheck`, `npm run lint`, and `npm run format` as the standard verification steps after any refactor.

## Code Formatting & Readability (Prettier)

- **Standard Prettier Formatting**: Always format code using Prettier with standard multi-line spacing for readability. Avoid writing dense single-line compound statements (e.g. chaining multiple route definitions on a single line).

## Third-Party UI Library Styling

- When integrating third-party UI libraries (e.g. SweetAlert2, React Hot Toast, Sonner), use their **default/base styles out of the box**. Do not add `customClass`, CSS overrides, or wrapper styling unless the user explicitly requests a custom look. Only configure functional options (e.g. `timer`, `icon`, `confirmButtonColor`) to match the project palette.

## UI Component Redesign Scope

- When asked to "fix" or "improve" a UI element, make the **minimal change** that solves the stated problem. Do not replace the interaction pattern (e.g. dropdown → card grid, table → accordion) unless the user explicitly proposes or approves a different pattern. Ask first if the scope is ambiguous.

## Git Operations

- **Commit Only**: Only stage (`git add`) and commit (`git commit`) changes when asked. Never push (`git push`) changes to remote repository.

## TypeScript Type-Safe Imports & Exports

- **Explicit Type Modifiers**: When importing or exporting Zod schema types (e.g., `CreateBookingInput` from `appointment.validation.ts`) inside other files, always use explicit `import type` and `export type` syntax. This prevents production bundler compilation warnings (e.g., `MISSING_EXPORT`).

## Vercel Multi-Project Services Deployment

- **Root Vercel Routing**: The root `vercel.json` maps `/api` to the backend service.
- **VITE_API_URL Configuration**: In production, set `VITE_API_URL` to the base domain (e.g., `https://your-domain.vercel.app`) without the `/api` suffix. Suffixing it will cause duplicate `/api/api` paths since frontend routes already start with `/api`.
- **Health Check Path**: The backend health check endpoint must support both `/health` and `/api/health` requests for Vercel rewrite compatibility.

## Frontend API Caching for Admin/Staff Portals

- **In-Memory Caching**: Cache authenticated GET API responses in `staffApi.ts` using short-term TTL (e.g., 30s) and stale-while-revalidate window (e.g., 5m). This avoids lag during SPA page transitions.
- **Auto-Invalidation on Mutation**: Any write operation (POST, PUT, DELETE, PATCH) must trigger cache clearing via `clearStaffCache()` to prevent displaying stale data to users.

