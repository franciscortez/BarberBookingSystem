# Barber Booking System

A premium, full-stack appointment scheduling and management platform for barbershops. Built with **React**, **Vite**, **TailwindCSS v4**, **TypeScript**, **Express**, **PostgreSQL**, and **Drizzle ORM**.

---

## 🏗️ Architecture Overview

The workspace is organized as a monorepo-style structure containing separate frontend and backend directories:

```
├── .agents/               # AI agent configuration & project rules
├── backend/               # Express & Drizzle ORM Server
│   ├── config/            # Database configs and seed scripts
│   ├── controller/        # Thin route handlers
│   ├── drizzle/           # Migration files
│   ├── middleware/        # Authentication, errors, and validation middlewares
│   ├── model/             # Drizzle query builders & schema abstractions
│   ├── routes/            # Express endpoint mapping
│   ├── services/          # Business logic & transactional operations
│   ├── utils/             # Helper utilities (e.g., SMTP mailer, cleanups)
│   └── validation/        # Zod validation schemas
├── frontend/              # Vite & React SPA Client
│   ├── src/
│   │   ├── hooks/         # React hooks
│   │   ├── pages/         # Thin page shells organized by role
│   │   ├── sections/      # Extracted UI component views and modals
│   │   ├── services/      # API communication layer (with caching)
│   │   └── types/         # Domain TypeScript type definitions
└── vercel.json            # Monorepo deployment mapping for Vercel
```

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19 (SPA client)
- **Bundler**: Vite 8
- **Styling**: TailwindCSS v4 & Vanilla CSS
- **Routing**: React Router DOM 7
- **Alerts/Notifications**: SweetAlert2

### Backend

- **Framework**: Express 5 (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Emailing**: Nodemailer (Gmail SMTP integration)
- **Security**: CORS, Helmet, Rate Limiter

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js**: `v20.x` or higher recommended
- **PostgreSQL**: Local or remote database instance running

### 🔧 Installation & Setup

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd BarberBookingSystem
   ```

2. **Install Workspace Dependencies**:
   Install all dependencies for both frontend and backend:

   ```bash
   # In root directory
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. **Configure Environment Variables**:

   - **Backend** (`backend/.env`):
     Copy `backend/.env.example` to `backend/.env` and fill in your values:

     ```env
     PORT=5000
     DATABASE_URL=postgresql://user:password@localhost:5432/barber_db
     JWT_SECRET=your_jwt_secret_here
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-google-app-password
     EMAIL_FROM=your-email@gmail.com
     ```

     _(Note: Google App Passwords must be 16 characters long)_

   - **Frontend** (`frontend/.env`):
     Create a `.env` in the `frontend` folder:
     ```env
     VITE_API_URL=http://localhost:5000
     ```

4. **Prepare the Database**:
   Generate Drizzle migrations, apply them, and seed initial data:
   ```bash
   cd backend
   npm run db:generate   # Generate migrations from schemas
   npm run db:migrate    # Apply migrations to database
   npm run db:seed       # Seed base services, roles, and status configurations
   npm run db:seed:admin # Seed first admin user
   cd ..
   ```

---

## 💻 Available Scripts

Run workspace commands from the root directory or individual workspaces.

### Root Commands

- `npm run dev`: Launch local development servers (frontend and backend).
- `npm run build`: Build production bundles.
- `npm run lint`: Run ESLint checks.
- `npm run lint:fix`: Run ESLint and automatically fix violations.
- `npm run typecheck`: Run TypeScript compiler validation across the workspace.
- `npm run format`: Format code using Prettier.
- `npm run format:check`: Verify code formatting standard.

### Backend Commands

From the `backend/` directory:

- `npm run dev`: Starts Express development server using `tsx`.
- `npm run build`: Compiles TypeScript files into `dist/`.
- `npm run start`: Runs compiled production build.
- `npm run test`: Executes integration tests using Jest.
- `npm run db:generate`: Generates SQL migrations.
- `npm run db:migrate`: Applies migrations to database.
- `npm run db:push`: Syncs database schema directly (useful for local development).
- `npm run db:seed`: Seeds base records.
- `npm run db:seed:admin`: Seeds initial administrator.
- `npm run db:studio`: Opens Drizzle Studio GUI on `https://local.drizzle.studio`.

### Frontend Commands

From the `frontend/` directory:

- `npm run dev`: Launches Vite dev server.
- `npm run build`: Compiles UI project for production deployment.
- `npm run preview`: Previews built bundle locally.

---

## 📐 Development Guidelines

Developers working on this codebase must follow these strict project architectural rules:

### 1. File Naming Conventions

Match files to their architectural layer using dot-separated suffixes:

- **Controllers**: `*.controller.ts` (e.g., `appointment.controller.ts`)
- **Services**: `*.services.ts` (e.g., `appointment.services.ts`)
- **Models**: `*.model.ts` (e.g., `appointment.model.ts`)
- **Routes**: `*.routes.ts` (e.g., `appointment.routes.ts`)
- **Validation**: `*.validation.ts` (e.g., `appointment.validation.ts`)

### 2. Separation of Concerns

- **Thin Controllers**: Controllers only parse user inputs (`req.body`, `req.params`), trigger service delegates, and format response payloads. Use safe body navigation (`req.body?.param`).
- **Service Layer**: Business logic, transactional db operations, and external system operations must be housed in services.
- **Validation**: Keep Zod schemas in `backend/validation/`. Services load validation rules from here.
- **Global Error Handling**: Delegate error propagation in controllers to the global handler via `next(err)`. Use `AppError` subclasses inside services for HTTP responses.

### 3. Database Operations (Drizzle ORM)

- **Pure Query Builder**: Avoid raw SQL strings. All queries must utilize Drizzle ORM methods (`db.select()`, `db.insert()`, etc.) using tables from `config/db/schema.ts`.
- **Snake Casing**: Map Drizzle columns to `snake_case` in database definitions (`created_at: timestamp('created_at')`).
- **Soft Deletions**: Always include active flags (`is_active: true`) when pulling data, including retrieval by primary keys.

### 4. Frontend Organization

- **Thin Pages**: React pages under `src/pages/<role>/` act as container shells managing state, routing, and data hooks. No inline JSX blocks.
- **Sections**: Extract UI layouts to components under `src/sections/<role>/<domain>/`. Modal dialogs must be extracted to separate files and not inline-coded in parent sections.
- **React Fast Refresh**: Component files (`.tsx`) must only export React components to satisfy the Fast Refresh compiler constraint. Put utility helpers in sibling `.ts` files.
- **API Caching**: Admin/staff portals use short-term in-memory caching (30s TTL, 5m stale-while-revalidate). Invalidate cache on write operations (`clearStaffCache()`).

---

## 🌐 Deployment (Vercel)

The workspace supports deployment to Vercel via the root `vercel.json` routing:

- Roots `/api/*` are mapped to the backend service.
- All other routes map to the static React frontend.
- **Environment Configuration**: Set `VITE_API_URL` to your Vercel deployment domain (e.g., `https://your-domain.vercel.app`) without trailing `/api` (avoiding duplicate `/api/api` routing paths).
