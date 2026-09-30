const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const frontendRoot = path.resolve(__dirname, "..");
const port = process.env.PUBLIC_JOURNEY_TEST_PORT || "5185";
const base = "http://127.0.0.1:" + port;
const out = process.env.PUBLIC_JOURNEY_CAPTURE_DIR;
if (out) fs.mkdirSync(out, { recursive: true });
let server;
const token = "d6b730dc-c661-453a-9487-fafaf22f893d";
const barber = {
  id: "81111111-1111-4111-8111-111111111111",
  name: "Alex Rivera",
};
const service = {
  id: "82222222-2222-4222-8222-222222222222",
  barber_id: barber.id,
  name: "Classic haircut",
  description: "A tailored cut with a clean finish.",
  duration_mins: 30,
  total_price: "450.00",
  downpayment_amount: "150.00",
};
const appointment = {
  id: "83333333-3333-4333-8333-333333333333",
  barber_id: barber.id,
  service_id: service.id,
  barber_name: barber.name,
  service_name: service.name,
  customer_name: "Jordan Cruz",
  customer_email: "jordan@example.test",
  customer_phone: "09123456789",
  appointment_date: new Date(Date.now() + 15 * 86400000).toLocaleDateString(
    "en-CA",
    { timeZone: "Asia/Manila" },
  ),
  start_time: "10:00:00",
  end_time: "10:30:00",
  status: "confirmed",
  downpayment_amount: "125.00",
  payment_reference_number: "QA-RECEIPT-2026",
  management_token: token,
};
const paid = { appointment, payment_status: "paid" };
const availability = {
  duration: 30,
  availableSlots: [{ start: "10:00", end: "10:30" }],
  slots: [
    {
      start: "09:00",
      end: "09:30",
      available: false,
      unavailableReason: "booked",
    },
    {
      start: "09:30",
      end: "10:00",
      available: false,
      unavailableReason: "blocked",
    },
    { start: "10:00", end: "10:30", available: true },
    {
      start: "10:30",
      end: "11:00",
      available: false,
      unavailableReason: "outside_hours",
    },
  ],
};
let browser;
const reports = [];
(async () => {
  server = spawn(
    process.execPath,
    [
      path.join(frontendRoot, "node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      port,
      "--strictPort",
    ],
    {
      cwd: frontendRoot,
      env: { ...process.env, VITE_API_URL: base },
      stdio: "pipe",
    },
  );
  let serverError = "";
  server.stderr.on("data", (chunk) => {
    serverError += chunk;
  });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null)
      throw Error("QA server failed: " + serverError);
    try {
      const response = await fetch(base);
      if (response.ok) break;
    } catch {}
    if (i === 99) throw Error("QA server did not start.");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  async function setup(options = {}) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: "Asia/Manila",
    });
    const page = await context.newPage();
    const calls = [];
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/api/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      calls.push({
        path: url.pathname,
        method: req.method(),
        body: req.postDataJSON(),
      });
      const custom = await options.handler?.(route, url, calls);
      if (custom) return;
      const respond = (data, status = 200) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      if (url.pathname === "/api/auth/me")
        return respond(
          options.user ? { user: options.user } : { error: "Unauthorized" },
          options.user ? 200 : 401,
        );
      if (url.pathname === "/api/catalog")
        return respond({ barbers: [barber], services: [service] });
      if (url.pathname === "/api/availability") return respond(availability);
      if (url.pathname === "/api/appointments/status") return respond(paid);
      if (url.pathname === "/api/appointments/manage")
        return respond(appointment);
      if (url.pathname === "/api/appointments/reschedule")
        return respond({
          appointment: {
            ...appointment,
            appointment_date: req.postDataJSON().appointment_date,
            start_time: req.postDataJSON().start_time,
          },
        });
      if (url.pathname === "/api/appointments/cancel")
        return respond({
          appointment: { ...appointment, status: "cancelled" },
        });
      return respond({ error: "Unhandled QA endpoint" }, 500);
    });
    return { context, page, calls, errors };
  }
  const go = async (p, route) => {
    await p.goto(base + route);
    await p.locator(".public-task h1").waitFor();
    await p.evaluate(() => document.fonts.ready);
  };
  const shot = async (p, name) => {
    if (!out) return;
    await p.waitForTimeout(250);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
  };
  const waitFor = async (fn, description) => {
    for (let n = 0; n < 100; n++) {
      if (await fn()) return;
      await new Promise((r) => setTimeout(r, 30));
    }
    throw Error("Timed out: " + description);
  };
  const pickDate = async (p) => {
    const buttons = p.locator(".rdp-day_button:not([disabled])");
    assert((await buttons.count()) > 0);
    await buttons.first().click();
    await p.locator(".booking-slot").first().waitFor();
  };
  const selectService = async (p) => {
    await p.getByRole("button", { name: /Classic haircut/ }).click();
    await p.getByRole("button", { name: "Continue", exact: true }).click();
  };
  const toReview = async (p) => {
    await selectService(p);
    await pickDate(p);
    await p.getByRole("button", { name: /10:00 AM until/ }).click();
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p.getByLabel("Full name", { exact: true }).fill("  Jordan Cruz  ");
    await p
      .getByLabel("Email address", { exact: true })
      .fill("  jordan@example.test  ");
    await p.getByLabel("Phone number", { exact: true }).fill("  09123456789  ");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
  };
  // First batched capture round and responsive checks, all target routes.
  const capture = await setup();
  for (const route of [
    "/login",
    "/signup",
    "/book",
    "/success?token=" + token,
    "/cancel-booking?token=" + token,
    "/reschedule-booking?token=" + token,
  ]) {
    await go(capture.page, route);
    if (route === "/book")
      await capture.page
        .getByRole("button", { name: /Classic haircut/ })
        .waitFor();
    if (route.startsWith("/success"))
      await capture.page
        .getByRole("heading", { name: "Your booking is confirmed." })
        .waitFor();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await capture.page.setViewportSize({ width, height: 900 });
      const overflow = await capture.page.evaluate(() =>
        Array.from(document.querySelectorAll(".public-task *"))
          .filter((e) => {
            const r = e.getBoundingClientRect(),
              s = getComputedStyle(e);
            return (
              r.width > 1 &&
              s.visibility !== "hidden" &&
              s.display !== "none" &&
              (r.right > innerWidth + 1 || r.left < -1) &&
              !e.classList.contains("landing-skip")
            );
          })
          .map((e) => ({ tag: e.tagName, class: e.className })),
      );
      assert.deepEqual(
        overflow,
        [],
        route + " overflow " + width + ": " + JSON.stringify(overflow),
      );
      if ([390, 1440].includes(width))
        await shot(capture.page, route.split("?")[0].slice(1) + "-" + width);
    }
  }
  assert.deepEqual(capture.errors, []);
  reports.push(
    "All six routes: no element overflow at 320, 390, 768, 1024, 1440px. Desktop/mobile layout coverage.",
  );
  await go(capture.page, "/book");
  await selectService(capture.page);
  await pickDate(capture.page);
  assert(
    await capture.page.getByRole("button", { name: /Blocked/ }).isDisabled(),
  );
  assert(
    await capture.page
      .getByRole("button", { name: /Outside hours/ })
      .isDisabled(),
  );
  await shot(capture.page, "book-calendar-1440");
  await capture.page.setViewportSize({ width: 320, height: 900 });
  await shot(capture.page, "book-calendar-320");
  assert.equal(
    await capture.page.evaluate(() => document.documentElement.scrollWidth),
    320,
  );
  await capture.page.getByRole("button", { name: /10:00 AM until/ }).click();
  await capture.page
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await capture.page
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  assert.equal(
    await capture.page.locator(":focus").getAttribute("id"),
    "contact-name",
  );
  assert.equal(
    await capture.page.locator("#contact-name").getAttribute("aria-invalid"),
    "true",
  );
  await shot(capture.page, "book-contact-320");
  reports.push(
    "Calendar touch targets, unavailable reasons, contact validation and focus.",
  );
  await capture.context.close();
  // Login validation, visibility, network error preservation and synchronous double-submit lock.
  let authPosts = 0;
  const auth = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/auth/login") {
        authPosts++;
        await new Promise((r) => setTimeout(r, 150));
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid credentials" }),
        });
        return true;
      }
    },
  });
  await go(auth.page, "/login");
  await auth.page.getByRole("button", { name: "Sign in", exact: true }).click();
  assert.equal(
    await auth.page.locator(":focus").getAttribute("id"),
    "auth-identifier",
  );
  assert.equal(authPosts, 0);
  await auth.page
    .getByLabel("Email or username", { exact: true })
    .fill("jordan");
  await auth.page
    .getByLabel("Password", { exact: true })
    .fill("example-password");
  await auth.page.getByRole("button", { name: "Show password" }).click();
  assert.equal(
    await auth.page.locator("#auth-password").getAttribute("type"),
    "text",
  );
  await auth.page.locator("form").evaluate((f) => {
    f.requestSubmit();
    f.requestSubmit();
  });
  await auth.page.getByRole("alert").waitFor();
  assert.equal(authPosts, 1);
  assert.equal(
    await auth.page.getByLabel("Password", { exact: true }).inputValue(),
    "example-password",
  );
  await shot(auth.page, "login-error");
  await auth.context.close();
  reports.push(
    "Login: validation, focus, password visibility, error preservation, one POST for duplicate submissions.",
  );
  // Signup signs in and arrives at live booking; password not persisted.
  const user = {
    id: "84444444-4444-4444-8444-444444444444",
    name: "Jordan Cruz",
    phone: "09123456789",
    email: "jordan@example.test",
    role: "user",
  };
  const signup = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/auth/register") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            user,
            token: "qa-token",
            refreshToken: "qa-refresh",
          }),
        });
        return true;
      }
    },
  });
  await go(signup.page, "/signup");
  await signup.page.getByLabel("Full name", { exact: true }).fill(user.name);
  await signup.page
    .getByLabel("Phone number", { exact: true })
    .fill(user.phone);
  await signup.page
    .getByLabel("Email address", { exact: true })
    .fill(user.email);
  await signup.page
    .getByLabel("Password", { exact: true })
    .fill("example-password");
  await signup.page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await signup.page.waitForURL("**/book");
  await toReview(signup.page);
  assert(
    await signup.page
      .getByText("jordan@example.test", { exact: true })
      .isVisible(),
  );
  assert(
    !JSON.stringify(
      await signup.page.evaluate(() => ({ ...localStorage })),
    ).includes("example-password"),
  );
  await shot(signup.page, "book-review-1440");
  await signup.context.close();
  reports.push(
    "Signup: auto sign-in, /book destination, saved-contact defaults, password absent from storage.",
  );
  // Booking conflict returns to times and preserves contact. One POST, no automatic retry.
  let bookingPosts = 0;
  const booking = await setup({
    handler: async (route, url) => {
      if (
        url.pathname === "/api/appointments" &&
        route.request().method() === "POST"
      ) {
        bookingPosts++;
        await new Promise((r) => setTimeout(r, 150));
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ error: "This slot is no longer available." }),
        });
        return true;
      }
    },
  });
  await go(booking.page, "/book");
  await toReview(booking.page);
  await booking.page
    .getByRole("button", { name: "Continue to PayMongo" })
    .evaluate((b) => {
      b.click();
      b.click();
    });
  await booking.page
    .getByRole("heading", { name: "Choose a date and time" })
    .waitFor();
  assert.equal(bookingPosts, 1);
  assert(
    await booking.page
      .getByRole("button", { name: "Continue", exact: true })
      .isDisabled(),
  );
  const payload = booking.calls.find(
    (c) => c.path === "/api/appointments",
  ).body;
  assert.equal(payload.customer_name, "Jordan Cruz");
  assert.equal(payload.customer_email, "jordan@example.test");
  assert.equal(payload.service_id, service.id);
  assert.equal(payload.total_price, undefined);
  await booking.page.getByRole("button", { name: /10:00 AM until/ }).click();
  await booking.page
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  assert.equal(
    await booking.page.getByLabel("Full name", { exact: true }).inputValue(),
    "  Jordan Cruz  ",
  );
  await booking.context.close();
  reports.push(
    "Booking: four steps, server IDs/payload, trimmed contact, duplicate POST lock, 409 recovery, preserved contact.",
  );
  // Late authentication fills untouched fields while preserving an edited name.
  let releaseSession;
  const sessionGate = new Promise((resolve) => {
    releaseSession = resolve;
  });
  const lateSession = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/auth/me") {
        await sessionGate;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ user }),
        });
        return true;
      }
    },
  });
  await go(lateSession.page, "/book");
  await selectService(lateSession.page);
  await pickDate(lateSession.page);
  await lateSession.page
    .getByRole("button", { name: /10:00 AM until/ })
    .click();
  await lateSession.page
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await lateSession.page
    .getByLabel("Full name", { exact: true })
    .fill("Edited guest name");
  releaseSession();
  await waitFor(
    async () =>
      (await lateSession.page
        .getByLabel("Email address", { exact: true })
        .inputValue()) === user.email,
    "late session defaults",
  );
  assert.equal(
    await lateSession.page
      .getByLabel("Full name", { exact: true })
      .inputValue(),
    "Edited guest name",
  );
  await lateSession.context.close();
  reports.push(
    "Late account load prefills untouched fields without overwriting edited contact.",
  );
  // Cross-account links preserve an internal destination and preselected barber.
  const destination = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/auth/register") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            user,
            token: "qa-token",
            refreshToken: "qa-refresh",
          }),
        });
        return true;
      }
    },
  });
  await go(destination.page, "/login");
  await destination.page.evaluate(
    (from) =>
      history.replaceState({ usr: { from }, key: "qa", idx: 0 }, "", "/login"),
    "/book?barberId=" + barber.id,
  );
  await destination.page.reload();
  await destination.page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await destination.page
    .getByLabel("Full name", { exact: true })
    .fill(user.name);
  await destination.page
    .getByLabel("Phone number", { exact: true })
    .fill(user.phone);
  await destination.page
    .getByLabel("Email address", { exact: true })
    .fill(user.email);
  await destination.page
    .getByLabel("Password", { exact: true })
    .fill("example-password");
  await destination.page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await destination.page.waitForURL("**/book?barberId=*");
  await waitFor(
    async () =>
      (await destination.page
        .getByRole("button", { name: /Alex Rivera/ })
        .first()
        .getAttribute("aria-pressed")) === "true",
    "preselected barber",
  );
  await destination.context.close();
  reports.push(
    "Account switch preserves internal destination and valid preselected barber.",
  );
  // Checkout redirect is fixture-only; the management token survives returning to success.
  let checkoutPosts = 0;
  const checkout = await setup({
    handler: async (route, url) => {
      if (
        url.pathname === "/api/appointments" &&
        route.request().method() === "POST"
      ) {
        checkoutPosts += 1;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            appointment,
            checkout_url: base + "/qa-checkout",
          }),
        });
        return true;
      }
    },
  });
  await checkout.context.route("**/qa-checkout", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Fixture checkout</h1>",
    }),
  );
  await go(checkout.page, "/book");
  await toReview(checkout.page);
  await checkout.page
    .getByRole("button", { name: "Continue to PayMongo" })
    .click();
  await checkout.page.waitForURL("**/qa-checkout");
  assert.equal(checkoutPosts, 1);
  assert.equal(
    await checkout.page.evaluate(() =>
      sessionStorage.getItem("pendingBookingToken"),
    ),
    token,
  );
  await go(checkout.page, "/success");
  await checkout.page
    .getByRole("heading", { name: "Your booking is confirmed." })
    .waitFor();
  await checkout.context.close();
  reports.push(
    "Checkout redirect and stored-token return verified against a local fixture; no PayMongo request.",
  );
  // Role defaults and unsafe/looping destinations remain inside the app.
  for (const [role, requested, expected] of [
    ["admin", undefined, "/admin/dashboard"],
    ["barber", undefined, "/barber/dashboard"],
    ["user", "//outside.example", "/"],
    ["user", "/login", "/"],
  ]) {
    const routing = await setup({
      handler: async (route, url) => {
        if (url.pathname === "/api/auth/login") {
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
              user: { ...user, role },
              token: "qa-token",
              refreshToken: "qa-refresh",
            }),
          });
          return true;
        }
      },
    });
    await go(routing.page, "/login");
    if (requested) {
      await routing.page.evaluate(
        (from) =>
          history.replaceState(
            { usr: { from }, key: "qa", idx: 0 },
            "",
            "/login",
          ),
        requested,
      );
      await routing.page.reload();
    }
    await routing.page
      .getByLabel("Email or username", { exact: true })
      .fill("jordan");
    await routing.page
      .getByLabel("Password", { exact: true })
      .fill("example-password");
    await routing.page
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await routing.page.waitForURL(base + expected);
    await routing.context.close();
  }
  reports.push(
    "Admin/barber login destinations and rejection of external/looping destinations.",
  );
  // Backend unavailable: booking has retry, never demo data. Landing retains labeled fallback.
  const offline = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/catalog") {
        await route.abort("failed");
        return true;
      }
    },
  });
  await go(offline.page, "/book");
  await offline.page.getByText("Booking is taking a moment.").waitFor();
  assert.equal(await offline.page.locator(".booking-option").count(), 0);
  await offline.page.getByRole("button", { name: "Try again" }).click();
  await waitFor(
    () => offline.calls.filter((c) => c.path === "/api/catalog").length >= 2,
    "catalog retry",
  );
  await offline.page.goto(base + "/");
  await offline.page
    .getByText(/preview|illustrative|demo/i)
    .first()
    .waitFor();
  await offline.context.close();
  reports.push(
    "Offline catalog: booking retry with no synthetic IDs; landing fallback still renders.",
  );
  // Success fallback token remains visible after session cleanup; URL token wins and cancellation is never confirmed.
  const receipt = await setup();
  await receipt.context.addInitScript(
    (t) => sessionStorage.setItem("pendingBookingToken", t),
    token,
  );
  await go(receipt.page, "/success");
  await receipt.page
    .getByRole("heading", { name: "Your booking is confirmed." })
    .waitFor();
  assert.equal(
    await receipt.page.evaluate(() =>
      sessionStorage.getItem("pendingBookingToken"),
    ),
    null,
  );
  assert(await receipt.page.getByText("₱125.00", { exact: true }).isVisible());
  await receipt.context.close();
  const cancelled = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/appointments/status") {
        assert.equal(url.searchParams.get("token"), token);
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            appointment: { ...appointment, status: "cancelled" },
            payment_status: "paid",
          }),
        });
        return true;
      }
    },
  });
  await cancelled.context.addInitScript(() =>
    sessionStorage.setItem("pendingBookingToken", "older-token"),
  );
  await go(cancelled.page, "/success?token=" + token);
  await cancelled.page
    .getByRole("heading", { name: "This appointment is not confirmed." })
    .waitFor();
  await shot(cancelled.page, "success-cancelled");
  await cancelled.context.close();
  reports.push(
    "Success: stored token fallback retained after cleanup, URL token priority, actual recorded amount, paid cancellation never confirmed.",
  );
  // Bounded sequential polling: 40 reads, timeout/retry and invalid tokens.
  const polling = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/appointments/status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            appointment: { ...appointment, status: "pending" },
            payment_status: "pending",
          }),
        });
        return true;
      }
    },
  });
  await polling.page.clock.install();
  await go(polling.page, "/success?token=" + token);
  await waitFor(
    () =>
      polling.calls.filter((c) => c.path === "/api/appointments/status")
        .length >= 1,
    "first poll",
  );
  await polling.page.waitForTimeout(100);
  await polling.page.evaluate(() => {
    window.__pollTimers = 0;
    const schedule = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      if (delay === 3000) window.__pollTimers += 1;
      return schedule(callback, delay, ...args);
    };
  });
  const initialPolls = polling.calls.filter(
    (c) => c.path === "/api/appointments/status",
  ).length;
  for (let i = 2; i <= 40; i++) {
    await polling.page.clock.fastForward(3001);
    await waitFor(
      () =>
        polling.calls.filter((c) => c.path === "/api/appointments/status")
          .length ===
        initialPolls + i - 1,
      "poll " + i,
    );
    if (i < 40)
      await waitFor(
        () =>
          polling.page.evaluate(
            (expected) => window.__pollTimers === expected,
            i - 1,
          ),
        "scheduled poll " + i,
      );
  }
  await polling.page
    .getByRole("heading", { name: "Confirmation is taking longer." })
    .waitFor();
  await polling.page.clock.fastForward(20000);
  assert.equal(
    polling.calls.filter((c) => c.path === "/api/appointments/status").length,
    initialPolls + 39,
  );
  await polling.page.getByRole("button", { name: "Check again" }).click();
  await waitFor(
    () =>
      polling.calls.filter((c) => c.path === "/api/appointments/status")
        .length ===
      initialPolls + 40,
    "retry poll",
  );
  await polling.page
    .getByRole("link", { name: "Book an appointment", exact: true })
    .click();
  await polling.page.waitForURL("**/book");
  await polling.page
    .getByRole("heading", { name: "Make time for a fresh cut." })
    .waitFor();
  const readsAtUnmount = polling.calls.filter(
    (c) => c.path === "/api/appointments/status",
  ).length;
  await polling.page.clock.fastForward(20000);
  assert.equal(
    polling.calls.filter((c) => c.path === "/api/appointments/status").length,
    readsAtUnmount,
  );
  await polling.context.close();
  reports.push(
    "Success: sequential polling stops at 40 reads; explicit retry restarts.",
  );
  // Management operations: one POST and controls disabled pending; preserved amount policy.
  let cancelPosts = 0;
  const cancel = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/appointments/cancel") {
        cancelPosts++;
        await new Promise((r) => setTimeout(r, 150));
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            appointment: { ...appointment, status: "cancelled" },
          }),
        });
        return true;
      }
    },
  });
  await go(cancel.page, "/cancel-booking?token=" + token);
  const cb = cancel.page.getByRole("button", { name: "Cancel appointment" });
  await cb.waitFor();
  await cancel.page.locator("form").evaluate((f) => {
    f.requestSubmit();
    f.requestSubmit();
  });
  await cancel.page.getByRole("heading", { name: /cancelled/i }).waitFor();
  assert.equal(cancelPosts, 1);
  await cancel.context.close();
  let reschedulePosts = 0;
  const reschedule = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/appointments/reschedule") {
        reschedulePosts++;
        await new Promise((r) => setTimeout(r, 300));
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            appointment: {
              ...appointment,
              appointment_date: route.request().postDataJSON().appointment_date,
            },
          }),
        });
        return true;
      }
    },
  });
  await go(reschedule.page, "/reschedule-booking?token=" + token);
  await pickDate(reschedule.page);
  await reschedule.page.getByRole("button", { name: /10:00 AM until/ }).click();
  await reschedule.page.locator("form").evaluate((f) => {
    f.requestSubmit();
    f.requestSubmit();
  });
  assert.equal(
    await reschedule.page.locator(".rdp-day_button:not([disabled])").count(),
    0,
  );
  await reschedule.page
    .getByRole("heading", { name: "Your appointment is rescheduled." })
    .waitFor();
  assert.equal(reschedulePosts, 1);
  await reschedule.context.close();
  reports.push(
    "Manage: cancellation/reschedule one POST each, pending controls disabled, explicit downpayment policy.",
  );
  // Invalid/no-token and read failure/recovery states never expose a confirmed receipt.
  const invalid = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/appointments/status") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Booking not found" }),
        });
        return true;
      }
    },
  });
  await go(invalid.page, "/success?token=" + token);
  await invalid.page
    .getByRole("heading", { name: "We couldn’t find this booking." })
    .waitFor();
  await invalid.context.close();
  const missing = await setup();
  for (const route of ["/success", "/cancel-booking", "/reschedule-booking"]) {
    await go(missing.page, route);
    assert.equal(await missing.page.locator(".task-receipt").count(), 0);
    assert.equal(await missing.page.locator("form").count(), 0);
  }
  await missing.context.close();
  let reads = 0;
  let manageUnavailable = true;
  const readRetry = await setup({
    handler: async (route, url) => {
      if (url.pathname === "/api/appointments/manage") reads += 1;
      if (url.pathname === "/api/appointments/manage" && manageUnavailable) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Temporarily unavailable" }),
        });
        return true;
      }
    },
  });
  await go(readRetry.page, "/cancel-booking?token=" + token);
  await readRetry.page.getByRole("button", { name: "Try again" }).waitFor();
  const readsBeforeRetry = reads;
  manageUnavailable = false;
  await readRetry.page.getByRole("button", { name: "Try again" }).click();
  await readRetry.page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .waitFor();
  assert.equal(reads, readsBeforeRetry + 1);
  await readRetry.context.close();
  reports.push(
    "Invalid/no-token receipts and management routes, explicit GET error recovery.",
  );
  // Keyboard skip target and reduced-motion source in browser, 200% zoom equivalent reflow.
  const a11y = await setup();
  await go(a11y.page, "/signup");
  await a11y.page.keyboard.press("Tab");
  assert.equal(
    await a11y.page.locator(":focus").innerText(),
    "Skip to content",
  );
  await a11y.page.keyboard.press("Enter");
  assert.equal(
    await a11y.page.locator(":focus").getAttribute("id"),
    "main-content",
  );
  await a11y.page.emulateMedia({ reducedMotion: "reduce" });
  await go(a11y.page, "/book");
  await a11y.page.setViewportSize({ width: 720, height: 500 });
  assert.equal(
    await a11y.page.evaluate(() => document.documentElement.scrollWidth),
    720,
  );
  await a11y.context.close();
  reports.push(
    "Keyboard skip/main focus, reduced motion, 200% desktop-zoom equivalent reflow.",
  );
  if (out)
    fs.writeFileSync(
      path.join(out, "browser-results.json"),
      JSON.stringify({ checks: reports }, null, 2),
    );
  console.log(reports.join("\n"));
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    server?.kill("SIGTERM");
  });
