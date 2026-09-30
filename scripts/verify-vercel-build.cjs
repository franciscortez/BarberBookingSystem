const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { spawnSync } = require("node:child_process");

// Verify deployment artifacts rather than resolving dependencies from the source tree.
const projectRoot = path.resolve(__dirname, "..");
const output = path.resolve(process.argv[2] || ".vercel/output");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const routing = readJson(path.join(output, "config.json"));
const frontend = path.join(output, "services/frontend");
const frontendRouting = readJson(path.join(frontend, "config.json"));
const serviceFor = (url) =>
  routing.routes.find((route) => route.src && new RegExp(route.src).test(url))
    ?.destination?.service;

for (const url of ["/api", "/api/health", "/api/catalog", "/api/auth/me"]) {
  assert.equal(serviceFor(url), "backend", `${url} must reach the backend`);
}
for (const url of [
  "/",
  "/book",
  "/login",
  "/signup",
  "/success",
  "/reschedule-booking",
  "/cancel-booking",
  "/apiary",
]) {
  assert.equal(serviceFor(url), "frontend", `${url} must reach the frontend`);
  const fallback = frontendRouting.routes.find(
    (route) => route.src && new RegExp(route.src).test(url),
  );
  assert.equal(fallback?.dest, "/index.html", `${url} needs the SPA fallback`);
}
assert.equal(frontendRouting.routes[0].handle, "filesystem");
assert.ok(fs.existsSync(path.join(frontend, "static/index.html")));
assert.ok(fs.readdirSync(path.join(frontend, "static/assets")).length > 0);
console.log("PASS: API routing, SPA deep links, and static asset priority");

const functions = path.join(output, "services/backend/functions");
const functionDirectories = fs
  .readdirSync(functions)
  .filter((name) =>
    fs.existsSync(path.join(functions, name, ".vc-config.json")),
  );
assert.equal(functionDirectories.length, 1, "Expected one Express function");
const isolated = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), "barber-function-check-")),
);
try {
  fs.cpSync(path.join(functions, functionDirectories[0]), isolated, {
    recursive: true,
    dereference: true,
  });
  const config = readJson(path.join(isolated, ".vc-config.json"));
  const handler = path.join(isolated, config.handler);
  const requireFromHandler = createRequire(handler);
  const dependencies = readJson(path.join(projectRoot, "backend/package.json"));
  for (const name of Object.keys(dependencies.dependencies)) {
    const resolved = requireFromHandler.resolve(name);
    assert.ok(
      resolved.startsWith(isolated + path.sep),
      `${name} must resolve inside the packaged function`,
    );
  }
  console.log(
    "PASS: every backend runtime dependency resolves inside the function",
  );

  const smoke = spawnSync(
    process.execPath,
    [
      "-e",
      `
      const assert = require('node:assert/strict');
      const fs = require('node:fs');
      const path = require('node:path');
      (async () => {
        const handler = process.argv[1];
        const exported = require(handler);
        const app = typeof exported === 'function' ? exported : exported.default;
        assert.equal(typeof app, 'function');
        const poolBase = path.join(path.dirname(handler), 'config/database');
        const poolFile = ['.cjs', '.js'].map(ext => poolBase + ext)
          .find(file => fs.existsSync(file));
        assert.ok(poolFile, 'Database module must be packaged');
        const databaseModule = require(poolFile);
        const pool = databaseModule.query ? databaseModule : databaseModule.default;
        assert.equal(typeof pool.query, 'function');
        const server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        const url = 'http://127.0.0.1:' + server.address().port;
        const originalError = console.error;
        try {
          let response = await fetch(url + '/');
          assert.equal(response.status, 200);
          response = await fetch(url + '/api/auth/me');
          assert.equal(response.status, 401);
          pool.query = async sql => {
            assert.equal(sql, 'SELECT 1');
            return { rows: [{ result: 1 }] };
          };
          response = await fetch(url + '/api/health');
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' });
          pool.query = async () => { throw new Error('Simulated unavailable database'); };
          console.error = () => {};
          response = await fetch(url + '/api/health');
          assert.equal(response.status, 500);
          assert.deepEqual(await response.json(), { status: 'error', database: 'disconnected' });
          console.log('PASS: isolated handler starts, auth rejects unauthenticated requests, health handles both database states');
        } finally {
          console.error = originalError;
          await new Promise(resolve => server.close(resolve));
          await pool.end();
        }
      })().catch(error => { console.error(error); process.exitCode = 1; });
      `,
      handler,
    ],
    {
      cwd: isolated,
      encoding: "utf8",
      timeout: 15000,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "test",
        VERCEL: "1",
        DOTENV_CONFIG_QUIET: "true",
        DATABASE_URL: "postgres://audit:audit@127.0.0.1:1/audit",
        JWT_SECRET: "local-artifact-check-only",
      },
    },
  );
  if (smoke.stdout) process.stdout.write(smoke.stdout);
  if (smoke.stderr) process.stderr.write(smoke.stderr);
  if (smoke.error) throw smoke.error;
  assert.equal(smoke.status, 0, "Isolated function smoke check failed");
} finally {
  fs.rmSync(isolated, { recursive: true, force: true });
}
