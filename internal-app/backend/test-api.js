/**
 * Quick API Test Script
 * Run: node test-api.js
 */
const http = require("http");

const BASE = "http://localhost:3000";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log("=== API Tests ===\n");

  // 1. Health check
  console.log("1. Health Check");
  const health = await request("GET", "/api/health");
  console.log(`   Status: ${health.status}, Response:`, health.data);
  console.log();

  // 2. Register a new user
  console.log("2. Register new user (should get Pending status)");
  const register = await request("POST", "/api/auth/register", {
    username: "johndoe",
    email: "john@example.com",
    password: "password123",
  });
  console.log(`   Status: ${register.status}, Response:`, register.data);
  console.log();

  // 3. Try to login with pending user (should fail)
  console.log("3. Login with Pending account (should be denied)");
  const loginPending = await request("POST", "/api/auth/login", {
    email: "john@example.com",
    password: "password123",
  });
  console.log(`   Status: ${loginPending.status}, Response:`, loginPending.data);
  console.log();

  // 4. Login as admin (the seeded admin)
  console.log('4. Login as Admin (admin@company.com / Admin123!)');
  const loginAdmin = await request("POST", "/api/auth/login", {
    email: "admin@company.com",
    password: "Admin123!",
  });
  console.log(`   Status: ${loginAdmin.status}, Response:`, {
    message: loginAdmin.data.message,
    redirectUrl: loginAdmin.data.redirectUrl,
    user: loginAdmin.data.user,
    token: loginAdmin.data.token ? loginAdmin.data.token.substring(0, 20) + "..." : null,
  });
  console.log();

  if (loginAdmin.status === 200) {
    const adminToken = loginAdmin.data.token;

    // 5. Get pending users
    console.log("5. Get pending users (admin)");
    const pending = await request("GET", "/api/admin/pending-users", null, adminToken);
    console.log(`   Status: ${pending.status}, Count:`, pending.data.count);
    console.log();

    // 6. Approve the pending user
const pendingUser = pending.data.users?.[0];
    if (pendingUser) {
      console.log(`6. Approve user "${pendingUser.username}" with role Staff`);
      const approve = await request("PATCH", `/api/admin/users/${pendingUser.id}/approve`, { role: "Staff" }, adminToken);
      console.log(`   Status: ${approve.status}, Response:`, approve.data.message);
      console.log();

      // 7. Login again as the approved user
      console.log("7. Login with approved user (should succeed)");
      const loginApproved = await request("POST", "/api/auth/login", {
        email: "john@example.com",
        password: "password123",
      });
      console.log(`   Status: ${loginApproved.status}, Redirect:`, loginApproved.data.redirectUrl);
      console.log();
    } else {
      console.log("6. No pending users found to approve.");
      console.log();
    }
  }

  console.log("=== Tests Complete ===");
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) {
      options.headers["Authorization"] = "Bearer " + token;
    }
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

run().catch(console.error);
