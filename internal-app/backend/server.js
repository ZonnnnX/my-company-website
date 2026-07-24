/**
 * Internal Application — Main Entry Point
 *
 * Express.js server with EJS templating, PostgreSQL (Sequelize),
 * JWT-based authentication, and Role-Based Access Control.
 *
 * Environment variables (see .env):
 *   PORT          - Server port (default: 3000)
 *   DB_HOST       - PostgreSQL host
 *   DB_PORT       - PostgreSQL port
 *   DB_NAME       - Database name
 *   DB_USER       - Database user
 *   DB_PASSWORD   - Database password
 *   JWT_SECRET    - Secret key for JWT signing
 *   NODE_ENV      - "development" or "production"
 */

// ---- Load environment variables first ----
require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { authenticateToken } = require("./middleware/auth");

// ---- Import Routes ----
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

// ---- Initialize Express ----
const app = express();
const PORT = process.env.PORT || 3000;

// ---- View Engine Setup (EJS) ----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---- Middleware ----
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files (CSS, images, etc.) from a "public" directory
app.use(express.static(path.join(__dirname, "public")));

// ---- Request Logger (Development) ----
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---- API Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ---- Health Check ----
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Internal app backend is running!",
    timestamp: new Date().toISOString(),
  });
});

// ---- Page Routes (Server-Rendered EJS) ----

// Auth Pages
app.get("/auth/login", (req, res) => {
  // If already logged in, redirect to dashboard
  const token = req.cookies?.token;
  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "internal-app-jwt-secret-change-in-production");
      if (decoded) {
        if (decoded.role === "Admin") return res.redirect("/admin/dashboard");
        if (decoded.role === "Manager") return res.redirect("/dashboard/manager");
        return res.redirect("/dashboard/staff");
      }
    } catch (e) {
      // Token invalid, continue to login page
    }
  }
  res.render("auth/login", {
    error: null,
    success: null,
    email: "",
  });
});

app.get("/auth/register", (req, res) => {
  res.render("auth/register", {
    error: null,
    success: null,
    username: "",
    email: "",
  });
});

// Protected Dashboard Pages
app.get("/admin/dashboard", authenticateToken, (req, res) => {
  // Only Admin role can access
  if (req.user.role !== "Admin") {
    return res.status(403).render("auth/login", {
      error: "Access denied. Admin privileges required.",
      success: null,
      email: req.user.email,
    });
  }
  res.render("admin/dashboard", { user: req.user });
});

app.get("/dashboard/user", authenticateToken, (req, res) => {
  // All approved non-admin roles can access this dashboard
  const allowedRoles = ["Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi"];
  if (!allowedRoles.includes(req.user.role) && req.user.role !== "Admin") {
    return res.status(403).render("auth/login", {
      error: "Access denied.",
      success: null,
      email: req.user.email,
    });
  }
  res.render("dashboard/user", { user: req.user });
});

app.get("/dashboard/staff", authenticateToken, (req, res) => {
  // Legacy route — redirect to /dashboard/user
  res.redirect("/dashboard/user");
});

app.get("/dashboard/manager", authenticateToken, (req, res) => {
  // Legacy route — redirect to /dashboard/user
  res.redirect("/dashboard/user");
});

// Root redirect
app.get("/", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "internal-app-jwt-secret-change-in-production");
      if (decoded.role === "Admin") return res.redirect("/admin/dashboard");
      if (decoded.role === "Manager") return res.redirect("/dashboard/manager");
      return res.redirect("/dashboard/staff");
    } catch (e) {
      return res.redirect("/auth/login");
    }
  }
  res.redirect("/auth/login");
});

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message || err);
  res.status(500).json({
    message: "Internal server error.",
    ...(process.env.NODE_ENV !== "production" && { error: err.message }),
  });
});

// ---- Start Server ----
async function startServer() {
  // Connect to PostgreSQL first (table sync is done in connectDB)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Internal App server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   PostgreSQL:  ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "internal_app"}`);
    console.log(`   Login:       http://localhost:${PORT}/auth/login`);
    console.log(`   Register:    http://localhost:${PORT}/auth/register`);
    console.log(`   Health:      http://localhost:${PORT}/api/health\n`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

