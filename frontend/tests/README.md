# Public journey browser checks

The fixture-based runner checks the six public task routes: `/login`, `/signup`, `/book`, `/success`, `/reschedule-booking`, and `/cancel-booking`.

Install frontend dependencies, then make Chromium available through either the Playwright browser cache or an existing executable:

```sh
frontend/node_modules/.bin/playwright-core install chromium
npm run test:public --prefix frontend
```

To use an existing Chromium executable instead, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when running the command. `playwright-core` is a development dependency; the runner does not install or launch a production service.

The runner starts its own Vite server on `127.0.0.1:5185`, with strict port binding and a temporary `VITE_API_URL` pointing to that server. It intercepts every `/api/**` browser request with fixtures, records requests, and closes the server and browser on completion. It does not write `.env` files, require a backend, create real appointments, send email, or contact PayMongo.

Optional environment variables:

- `PUBLIC_JOURNEY_TEST_PORT`: override the local port when 5185 is occupied.
- `PUBLIC_JOURNEY_CAPTURE_DIR`: write full-page screenshots to the specified directory.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: use a specific Chromium executable.

Coverage includes route reflow at 320, 390, 768, 1024, and 1440px; validation and password visibility; signup auto-authentication and contact defaults; role defaults and rejected redirect destinations; guest booking and all four steps; contact preservation; conflict recovery and submission locks; unavailable API retries; a local checkout HTML fixture and stored-token success return; receipt amounts and status outcomes; sequential polling, timeout, retry, and cleanup on unmount; management behavior; keyboard focus, reduced motion, and zoom-equivalent reflow. Read the runner's printed results for the assertions that passed on a particular run.

These checks verify the interface against controlled API responses. They do not verify real PostgreSQL integration, checkout creation, payment webhooks, email delivery, deployed configuration, or measured color contrast. Run live integration acceptance separately against an authorized configured environment.
