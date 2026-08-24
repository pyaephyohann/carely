/**
 * Carely Authentication QA Test Runner
 * Runs all AUTH-01 through AUTH-38 tests in a single process.
 * Uses http to call the local Next.js API directly.
 */

const BASE = "http://localhost:3000/api";
const results = [];

function record(id, desc, expected, actual, status, detail) {
  results.push({ id, desc, expected, actual, status, detail: detail || "" });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} ${id}: ${desc} → Expected ${expected}, Got ${actual} [${status}]`);
  if (detail) console.log(`   Detail: ${detail.substring(0, 200)}`);
}

async function req(method, path, body, cookies) {
  const url = `${BASE}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (cookies) headers["Cookie"] = cookies;

  const opts = { method, headers };
  if (body !== undefined) opts.body = typeof body === "string" ? body : JSON.stringify(body);

  const resp = await fetch(url, opts);
  const setCookie = resp.headers.get("set-cookie") || "";
  let jsonBody;
  try { jsonBody = await resp.json(); } catch { jsonBody = null; }

  return { status: resp.status, body: jsonBody, setCookie };
}

function extractCookie(setCookie, name) {
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Carely Authentication QA Test Suite");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ===========================================================================
  // REGISTRATION TESTS (AUTH-01 to AUTH-17)
  // Registration rate limit: 5 per minute
  // We must split across windows
  // ===========================================================================
  console.log("─── REGISTRATION TESTS ───\n");

  // Window 1: AUTH-01 to AUTH-05 (5 requests)
  let r;

  r = await req("POST", "/auth/register", { firstName: "Test", lastName: "Patient", email: "auth-qa-p1@test.com", password: "Test1234", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-01", "Patient registration with valid data", 201, r.status, r.status === 201 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "Test", lastName: "Doctor", email: "auth-qa-d1@test.com", password: "Test1234", confirmPassword: "Test1234", role: "DOCTOR", licenseNumber: "QA-DOC-001", consultationFee: 150 });
  record("AUTH-02", "Doctor registration with valid data", 201, r.status, r.status === 201 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "Dup", lastName: "Patient", email: "auth-qa-p1@test.com", password: "Test1234", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-03", "Duplicate email registration", 409, r.status, r.status === 409 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "Bad", lastName: "Email", email: "not-an-email", password: "Test1234", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-04", "Invalid email format", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "Weak", lastName: "Pass", email: "auth-qa-w1@test.com", password: "test1234", confirmPassword: "test1234", role: "PATIENT" });
  record("AUTH-05", "Weak password (no uppercase)", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  // Window 2: AUTH-06 to AUTH-10
  console.log("\n  [Waiting 65s for registration rate limit reset...]");
  await sleep(65000);

  r = await req("POST", "/auth/register", { firstName: "Weak", lastName: "Pass", email: "auth-qa-w2@test.com", password: "TestPassWord", confirmPassword: "TestPassWord", role: "PATIENT" });
  record("AUTH-06", "Weak password (no number)", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "No", lastName: "Match", email: "auth-qa-nm@test.com", password: "Test1234", confirmPassword: "Test5678", role: "PATIENT" });
  record("AUTH-07", "Passwords don't match", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { lastName: "NoFirst", email: "auth-qa-nf@test.com", password: "Test1234", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-08", "Missing firstName", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "No", lastName: "", email: "auth-qa-nl@test.com", password: "Test1234", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-09", "Missing lastName", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "No", lastName: "Email", password: "Test1234", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-10", "Missing email", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  // Window 3: AUTH-11 to AUTH-15
  console.log("\n  [Waiting 65s for registration rate limit reset...]");
  await sleep(65000);

  r = await req("POST", "/auth/register", { firstName: "No", lastName: "Pass", email: "auth-qa-np@test.com", confirmPassword: "Test1234", role: "PATIENT" });
  record("AUTH-11", "Missing password", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "Bad", lastName: "Role", email: "auth-qa-ar@test.com", password: "Test1234", confirmPassword: "Test1234", role: "ADMIN" });
  record("AUTH-12", "Invalid role ADMIN", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", { firstName: "Bad", lastName: "Role", email: "auth-qa-pr@test.com", password: "Test1234", confirmPassword: "Test1234", role: "PHARMACY" });
  record("AUTH-13", "Invalid role PHARMACY", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/register", {});
  record("AUTH-14", "Empty request body", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  // AUTH-15: Malformed JSON
  let r15status;
  try {
    const resp15 = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json}",
    });
    r15status = resp15.status;
  } catch (e) {
    r15status = "ERROR";
  }
  record("AUTH-15", "Malformed JSON", "400 or 500", r15status, (r15status === 400 || r15status === 500) ? "PASS" : "FAIL");

  // Window 4: AUTH-16, AUTH-17
  console.log("\n  [Waiting 65s for registration rate limit reset...]");
  await sleep(65000);

  r = await req("POST", "/auth/register", { firstName: "No", lastName: "License", email: "auth-qa-nl5@test.com", password: "Test1234", confirmPassword: "Test1234", role: "DOCTOR" });
  record("AUTH-16", "Doctor without licenseNumber", 400, r.status, r.status === 400 ? "PASS" : "FAIL", r.body ? JSON.stringify(r.body) : "");

  r = await req("POST", "/auth/register", { firstName: "Dup", lastName: "License", email: "auth-qa-dl@test.com", password: "Test1234", confirmPassword: "Test1234", role: "DOCTOR", licenseNumber: "QA-DOC-001" });
  record("AUTH-17", "Duplicate license number", 409, r.status, r.status === 409 ? "PASS" : "FAIL", r.body ? JSON.stringify(r.body) : "");

  // ===========================================================================
  // LOGIN TESTS (AUTH-18 to AUTH-26)
  // ===========================================================================
  console.log("\n─── LOGIN TESTS ───\n");

  r = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "Test1234" });
  record("AUTH-18", "Login with correct credentials", 200, r.status, r.status === 200 ? "PASS" : "FAIL");
  const patientAT = extractCookie(r.setCookie, "carely_access_token");
  const patientRT = extractCookie(r.setCookie, "carely_refresh_token");

  r = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "WrongPassword1" });
  record("AUTH-19", "Login with wrong password", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/login", { email: "nonexistent@test.com", password: "Test1234" });
  record("AUTH-20", "Login with non-existent email", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/login", { email: "suspended-patient@test.com", password: "Test1234" });
  record("AUTH-21", "Login with suspended account", 403, r.status, r.status === 403 ? "PASS" : "FAIL", r.body ? JSON.stringify(r.body) : "");

  r = await req("POST", "/auth/login", { email: "inactive-doctor@test.com", password: "Test1234" });
  record("AUTH-22", "Login with inactive account", 403, r.status, r.status === 403 ? "PASS" : "FAIL", r.body ? JSON.stringify(r.body) : "");

  r = await req("POST", "/auth/login", { email: "deleted-user@test.com", password: "Test1234" });
  record("AUTH-23", "Login with deleted account", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/login", { email: "", password: "Test1234" });
  record("AUTH-24", "Login with empty email", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  r = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "" });
  record("AUTH-25", "Login with empty password", 400, r.status, r.status === 400 ? "PASS" : "FAIL");

  // AUTH-26: Malformed JSON for login
  let r26status;
  try {
    const resp26 = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid}",
    });
    r26status = resp26.status;
  } catch (e) { r26status = "ERROR"; }
  record("AUTH-26", "Malformed JSON", "400 or 500", r26status, (r26status === 400 || r26status === 500) ? "PASS" : "FAIL");

  // ===========================================================================
  // REFRESH TOKEN TESTS (AUTH-27 to AUTH-31)
  // ===========================================================================
  console.log("\n─── REFRESH TOKEN TESTS ───\n");

  if (patientRT) {
    // AUTH-27: Valid refresh
    r = await req("POST", "/auth/refresh", undefined, `carely_access_token=${patientAT}; carely_refresh_token=${patientRT}`);
    const newRT = extractCookie(r.setCookie, "carely_refresh_token");
    const rotated = newRT && newRT !== patientRT;
    record("AUTH-27", "Valid refresh token", 200, r.status, r.status === 200 ? "PASS" : "FAIL",
      `rotation=${rotated ? "YES (new token issued)" : "NO (same token or not in set-cookie)"}`);

    // AUTH-28: Expired refresh token
    const expiredRT = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDEsInN1YiI6InRlc3QifQ.invalid";
    r = await req("POST", "/auth/refresh", undefined, `carely_refresh_token=${expiredRT}`);
    record("AUTH-28", "Expired refresh token", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

    // AUTH-29: Invalid refresh token
    r = await req("POST", "/auth/refresh", undefined, "carely_refresh_token=garbage");
    record("AUTH-29", "Invalid refresh token", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

    // AUTH-30: Missing refresh token
    r = await req("POST", "/auth/refresh");
    record("AUTH-30", "Missing refresh token", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

    // AUTH-31: Refresh after user suspended
    console.log("  [Waiting 65s for rate limit reset before AUTH-31...]");
    await sleep(65000);

    // Register temp user
    const regResp = await req("POST", "/auth/register", {
      firstName: "Suspend", lastName: "Test", email: "qa-suspend-final@test.com",
      password: "Test1234", confirmPassword: "Test1234", role: "PATIENT"
    });
    if (regResp.status === 201) {
      // Login as temp user
      const loginResp = await req("POST", "/auth/login", { email: "qa-suspend-final@test.com", password: "Test1234" });
      const tempRT = extractCookie(loginResp.setCookie, "carely_refresh_token");
      const tempAT = extractCookie(loginResp.setCookie, "carely_access_token");

      // Get admin token
      const adminLogin = await req("POST", "/auth/login", { email: "admin@test.com", password: "Test1234" });
      const adminAT = extractCookie(adminLogin.setCookie, "carely_access_token");

      if (tempRT && adminAT) {
        // Find temp user ID
        const usersResp = await req("GET", "/admin/users?search=qa-suspend-final@test.com", undefined, `carely_access_token=${adminAT}`);
        const tempUser = usersResp.body?.data?.users?.find(u => u.email === "qa-suspend-final@test.com");

        if (tempUser) {
          // Suspend user
          const suspResp = await req("PATCH", `/admin/users/${tempUser.id}/status`, { status: "SUSPENDED" }, `carely_access_token=${adminAT}`);
          console.log(`  Suspend response: ${suspResp.status}`);

          // Try refresh
          r = await req("POST", "/auth/refresh", undefined, `carely_refresh_token=${tempRT}`);
          record("AUTH-31", "Refresh after user suspended", 403, r.status, r.status === 403 ? "PASS" : "FAIL", r.body ? JSON.stringify(r.body) : "");

          // Restore user
          await req("PATCH", `/admin/users/${tempUser.id}/status`, { status: "ACTIVE" }, `carely_access_token=${adminAT}`);
        } else {
          record("AUTH-31", "Refresh after user suspended", 403, "BLOCKED", "BLOCKED", "Could not find temp user via admin API");
        }
      } else {
        record("AUTH-31", "Refresh after user suspended", 403, "BLOCKED", "BLOCKED", "Could not get temp/admin tokens");
      }
    } else {
      record("AUTH-31", "Refresh after user suspended", 403, "BLOCKED", "BLOCKED", `Registration returned ${regResp.status}`);
    }
  } else {
    record("AUTH-27", "Valid refresh token", 200, "BLOCKED", "BLOCKED", "No refresh token from login");
    record("AUTH-28", "Expired refresh token", 401, "BLOCKED", "BLOCKED", "");
    record("AUTH-29", "Invalid refresh token", 401, "BLOCKED", "BLOCKED", "");
    record("AUTH-30", "Missing refresh token", 401, "BLOCKED", "BLOCKED", "");
    record("AUTH-31", "Refresh after user suspended", 403, "BLOCKED", "BLOCKED", "");
  }

  // ===========================================================================
  // LOGOUT & ACCESS TOKEN TESTS (AUTH-32 to AUTH-35)
  // ===========================================================================
  console.log("\n─── LOGOUT & ACCESS TOKEN TESTS ───\n");

  // Fresh login
  const freshLogin = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "Test1234" });
  const freshAT = extractCookie(freshLogin.setCookie, "carely_access_token");
  const freshRT = extractCookie(freshLogin.setCookie, "carely_refresh_token");

  if (freshAT) {
    // AUTH-32: Valid logout
    r = await req("POST", "/auth/logout", undefined, `carely_access_token=${freshAT}; carely_refresh_token=${freshRT}`);
    const cookiesCleared = (r.setCookie.match(/Max-Age=0/g) || []).length;
    record("AUTH-32", "Valid logout", 200, r.status, r.status === 200 ? "PASS" : "FAIL", `cookies cleared: ${cookiesCleared}`);

    // Re-login for token tests
    const reLogin = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "Test1234" });
    const reAT = extractCookie(reLogin.setCookie, "carely_access_token");

    // AUTH-33: Expired access token
    const expiredAT = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0Iiwicm9sZSIiOiJBRE1JTiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxLCJzdWIiOiJ0ZXN0In0.invalid";
    r = await req("GET", "/patient/profile", undefined, `carely_access_token=${expiredAT}`);
    record("AUTH-33", "Expired access token", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

    // AUTH-34: No access token
    r = await req("GET", "/patient/profile");
    record("AUTH-34", "No access token", 401, r.status, r.status === 401 ? "PASS" : "FAIL");

    // AUTH-35: Malformed access token
    r = await req("GET", "/patient/profile", undefined, "carely_access_token=not-a-jwt");
    record("AUTH-35", "Malformed access token", 401, r.status, r.status === 401 ? "PASS" : "FAIL");
  } else {
    for (const id of ["AUTH-32", "AUTH-33", "AUTH-34", "AUTH-35"]) {
      record(id, "...", "...", "BLOCKED", "BLOCKED", "No access token");
    }
  }

  // ===========================================================================
  // RATE LIMITING TESTS (AUTH-36 to AUTH-38)
  // ===========================================================================
  console.log("\n─── RATE LIMITING TESTS ───\n");

  // Wait for all rate limit windows to be fresh
  console.log("  [Waiting 65s for rate limit windows to reset...]");
  await sleep(65000);

  // AUTH-36: 11th login attempt within one minute
  console.log("  Sending 10 failed login attempts...");
  for (let i = 0; i < 10; i++) {
    await req("POST", "/auth/login", { email: "patient-a@test.com", password: "WrongPass" });
  }
  r = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "WrongPass" });
  record("AUTH-36", "11th login attempt (rate limit)", 429, r.status, r.status === 429 ? "PASS" : "FAIL", r.body?.error?.message || "");

  // Wait for login rate limit to reset
  console.log("  [Waiting 65s for login rate limit reset...]");
  await sleep(65000);

  // AUTH-37: 6th registration attempt within one minute
  console.log("  Sending 5 registration attempts...");
  for (let i = 1; i <= 5; i++) {
    await req("POST", "/auth/register", {
      firstName: "Rate", lastName: "Test", email: `qa-rate-reg-${i}@test.com`,
      password: "Test1234", confirmPassword: "Test1234", role: "PATIENT"
    });
  }
  r = await req("POST", "/auth/register", {
    firstName: "Rate", lastName: "Test", email: "qa-rate-reg-6@test.com",
    password: "Test1234", confirmPassword: "Test1234", role: "PATIENT"
  });
  record("AUTH-37", "6th registration attempt (rate limit)", 429, r.status, r.status === 429 ? "PASS" : "FAIL", r.body?.error?.message || "");

  // Wait for all rate limits to reset
  console.log("  [Waiting 65s for rate limit reset before AUTH-38...]");
  await sleep(65000);

  // AUTH-38: 21st refresh attempt within one minute
  const rlLogin = await req("POST", "/auth/login", { email: "patient-a@test.com", password: "Test1234" });
  const rlRT = extractCookie(rlLogin.setCookie, "carely_refresh_token");
  const rlAT = extractCookie(rlLogin.setCookie, "carely_access_token");

  if (rlRT) {
    console.log("  Sending 20 refresh attempts...");
    for (let i = 0; i < 20; i++) {
      await req("POST", "/auth/refresh", undefined, `carely_access_token=${rlAT}; carely_refresh_token=${rlRT}`);
    }
    r = await req("POST", "/auth/refresh", undefined, `carely_access_token=${rlAT}; carely_refresh_token=${rlRT}`);
    record("AUTH-38", "21st refresh attempt (rate limit)", 429, r.status, r.status === 429 ? "PASS" : "FAIL", r.body?.error?.message || "");
  } else {
    record("AUTH-38", "21st refresh attempt (rate limit)", 429, "BLOCKED", "BLOCKED", "No refresh token");
  }

  // ===========================================================================
  // REPORT
  // ===========================================================================
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  AUTH QA REPORT");
  console.log("═══════════════════════════════════════════════════════════\n");

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const blocked = results.filter(r => r.status === "BLOCKED").length;
  const total = results.length;

  console.log(`Total: ${total} | ✅ Pass: ${passed} | ❌ Fail: ${failed} | ⚠️  Blocked: ${blocked}\n`);

  console.log("Full Results Table:");
  console.log("─".repeat(90));
  console.log(`${"ID".padEnd(10)} ${"Description".padEnd(40)} ${"Expected".padEnd(10)} ${"Actual".padEnd(10)} Status`);
  console.log("─".repeat(90));
  for (const r of results) {
    console.log(`${r.id.padEnd(10)} ${r.desc.substring(0, 38).padEnd(40)} ${String(r.expected).padEnd(10)} ${String(r.actual).padEnd(10)} ${r.status}`);
  }
  console.log("─".repeat(90));

  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    for (const r of results.filter(r => r.status === "FAIL")) {
      console.log(`  ${r.id}: ${r.desc}`);
      console.log(`    Expected: ${r.expected} | Actual: ${r.actual}`);
      if (r.detail) console.log(`    Detail: ${r.detail.substring(0, 200)}`);
    }
  }

  if (blocked > 0) {
    console.log("\n⚠️  BLOCKED TESTS:");
    for (const r of results.filter(r => r.status === "BLOCKED")) {
      console.log(`  ${r.id}: ${r.desc} — ${r.detail}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
