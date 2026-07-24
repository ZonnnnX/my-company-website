/**
 * Authentication Middleware
 *
 * Verifies JWT tokens from cookies or Authorization headers.
 * Also checks that the user's account status allows access
 * (must be "Approved" or role must be "Admin").
 *
 * Uses Sequelize User model (PostgreSQL).
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "internal-app-jwt-secret-change-in-production";

/**
 * Middleware: authenticateToken
 * Extracts and verifies JWT from cookie or Authorization header.
 * Attaches the user instance to req.user.
 */
async function authenticateToken(req, res, next) {
  try {
    // 1. Extract token from cookie first, then fallback to Authorization header
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required. Please log in." });
    }

    // 2. Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      return res.status(403).json({ message: "Invalid token. Please log in again." });
    }

    // 3. Fetch the full user from database to ensure they still exist & status hasn't changed
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    // 4. Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({ message: "Server error during authentication." });
  }
}

/**
 * Middleware: requireApproved
 * Ensures the authenticated user has an "Approved" status or is an Admin.
 */
function requireApproved(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  // Admin users bypass the approval check
  if (req.user.role === "Admin") {
    return next();
  }

  if (req.user.status !== "Approved") {
    if (req.user.status === "Pending") {
      return res.status(403).json({
        message: "Your account is pending approval. Please wait for an administrator to approve your account.",
      });
    }
    if (req.user.status === "Rejected") {
      return res.status(403).json({
        message: "Your account has been rejected. Please contact support for assistance.",
      });
    }
    return res.status(403).json({ message: "Account access denied." });
  }

  next();
}

/**
 * Middleware: requireStatus
 * Factory function that returns middleware checking for specific status(es).
 * @param  {...string} statuses - Allowed status values
 */
function requireStatus(...statuses) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!statuses.includes(req.user.status) && req.user.role !== "Admin") {
      return res.status(403).json({
        message: `Access denied. Your account status must be one of: ${statuses.join(", ")}.`,
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireApproved,
  requireStatus,
};

