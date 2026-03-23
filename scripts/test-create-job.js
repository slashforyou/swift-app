#!/usr/bin/env node
/**
 * Test script: POST /v1/job to diagnose HTTP 500
 */
const https = require("https");

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: "altivo.fr",
      path: "/swift-app/" + path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "altivo.fr",
      path: "/swift-app/" + path,
      method: "GET",
      headers: token ? { Authorization: "Bearer " + token } : {},
    };
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("=== Testing POST /v1/job (diagnostic) ===");

  // Step 1: Login
  console.log("\n1. Login...");
  const login = await post("auth/login", {
    mail: "admin.test@nerd-test.com",
    password: "NerdTest2026!",
    device: { platform: "android", deviceId: "e2e-test", name: "E2E Test" },
    wantRefreshInBody: true,
  });
  console.log("   Status:", login.status);
  if (login.status !== 200) {
    console.error("Login failed:", login.body.substring(0, 300));
    return;
  }
  const parsed = JSON.parse(login.body);
  const token = parsed.token || parsed.sessionToken || parsed.access_token;
  if (!token) {
    console.error("No token found!");
    return;
  }
  console.log("   Token OK");
  console.log("   Login response keys:", Object.keys(parsed));
  if (parsed.user) console.log("   User:", JSON.stringify(parsed.user));

  // Step 2: Check user profile
  console.log("\n2. GET /v1/me or /v1/user/me...");
  for (const profilePath of ["v1/me", "v1/user/me", "v1/users/me", "auth/me"]) {
    const p = await get(profilePath, token);
    if (p.status === 200) {
      console.log(`   GET /${profilePath} → 200:`, p.body.substring(0, 400));
      break;
    } else {
      console.log(`   GET /${profilePath} → ${p.status}`);
    }
  }

  // Step 3: Check clients endpoint
  console.log("\n3. GET /v1/clients (check client 30)...");
  const clients = await get("v1/clients", token);
  console.log(`   Status: ${clients.status}`);
  if (clients.status === 200) {
    try {
      const list = JSON.parse(clients.body);
      const arr = Array.isArray(list) ? list : list.clients || list.data || [];
      const c30 = arr.find((c) => c.id === 30);
      console.log(`   Client 30:`, c30 ? JSON.stringify(c30) : "NOT FOUND");
      console.log(`   Total clients: ${arr.length}`);
    } catch {}
  } else {
    console.log(`   Body: ${clients.body.substring(0, 200)}`);
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 7);
  start.setHours(9, 0, 0, 0);

  const dateStr = (d) => d.toISOString();

  console.log("\n4. Testing job creation variants...");

  // Test variations
  const tests = [
    {
      label: "V1: Minimal - no null values, no extras, no addresses",
      payload: {
        client_id: 30,
        status: "pending",
        priority: "medium",
        start_window_start: dateStr(start),
        start_window_end: dateStr(new Date(start.getTime() + 2 * 3600000)),
        estimated_duration: 240,
      },
    },
    {
      label: "V2: With addresses + lat/lng",
      payload: {
        client_id: 30,
        status: "pending",
        priority: "medium",
        start_window_start: dateStr(start),
        start_window_end: dateStr(new Date(start.getTime() + 2 * 3600000)),
        end_window_start: dateStr(new Date(start.getTime() + 8 * 3600000)),
        end_window_end: dateStr(new Date(start.getTime() + 10 * 3600000)),
        estimated_duration: 240,
        addresses: [
          {
            type: "pickup",
            street: "123 Test St",
            city: "Sydney",
            state: "NSW",
            zip: "2000",
            lat: -33.8688,
            lng: 151.2093,
          },
          {
            type: "dropoff",
            street: "456 Test Ave",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            lat: -37.8136,
            lng: 144.9631,
          },
        ],
      },
    },
    {
      label: "V3: With latitude/longitude (instead of lat/lng)",
      payload: {
        client_id: 30,
        status: "pending",
        priority: "medium",
        start_window_start: dateStr(start),
        start_window_end: dateStr(new Date(start.getTime() + 2 * 3600000)),
        estimated_duration: 240,
        addresses: [
          {
            type: "pickup",
            street: "123 Test St",
            city: "Sydney",
            state: "NSW",
            zip: "2000",
            latitude: -33.8688,
            longitude: 151.2093,
          },
          {
            type: "dropoff",
            street: "456 Test Ave",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8136,
            longitude: 144.9631,
          },
        ],
      },
    },
    {
      label: "V4: With timezone at top level",
      payload: {
        client_id: 30,
        status: "pending",
        priority: "medium",
        timezone: "Australia/Sydney",
        start_window_start: dateStr(start),
        start_window_end: dateStr(new Date(start.getTime() + 2 * 3600000)),
        estimated_duration: 240,
        addresses: [
          {
            type: "pickup",
            street: "123 Test St",
            city: "Sydney",
            state: "NSW",
            zip: "2000",
          },
          {
            type: "dropoff",
            street: "456 Test Ave",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
          },
        ],
      },
    },
    {
      label: "V5: Different client_id (1)",
      payload: {
        client_id: 1,
        status: "pending",
        priority: "medium",
        start_window_start: dateStr(start),
        start_window_end: dateStr(new Date(start.getTime() + 2 * 3600000)),
        estimated_duration: 240,
        timezone: "Australia/Sydney",
        addresses: [
          {
            type: "pickup",
            street: "123 Test St",
            city: "Sydney",
            state: "NSW",
            zip: "2000",
            lat: -33.8688,
            lng: 151.2093,
          },
        ],
      },
    },
    {
      label: "V6: No addresses at all",
      payload: {
        client_id: 30,
        status: "pending",
        priority: "medium",
        start_window_start: dateStr(start),
        start_window_end: dateStr(new Date(start.getTime() + 2 * 3600000)),
        estimated_duration: 240,
        timezone: "Australia/Sydney",
      },
    },
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.label} ---`);
    const r = await post("v1/job", test.payload, token);
    console.log(`   Status: ${r.status}`);
    console.log(`   Body: ${r.body}`); // full body
    if (r.status === 201 || r.status === 200) {
      console.log("   ✅ SUCCESS!");
      break;
    }
  }
}

run().catch((e) => console.error("Error:", e));
