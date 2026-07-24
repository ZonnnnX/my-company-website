/**
 * Authentication Controller
 *
 * Handles user registration, login, and session management.
 * Registration automatically sets status to "Pending".
 * Login checks status and redirects based on role.
 *
 * Uses Sequelize (PostgreSQL) for database operations.
 */

const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "internal-app-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Generate a JWT token for the given user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/auth/register
 * Creates a new user account with status "Pending".
 * Body: { username, email, password }
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // ---- Validate input ----
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }

    if (typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters." });
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "A valid email address is required." });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // ---- Check for existing user ----
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase().trim() },
          { username: username.trim() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      return res.status(409).json({ message: "This username is already taken." });
    }

    // ---- Create user with Pending status ----
    // Password will be hashed by Sequelize beforeSave hook
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by the model hook
      role: "Người thực thi",
      status: "Pending",
    });

    return res.status(201).json({
      message: "Registration successful! Your account is now pending admin approval. You will be notified once your account is approved.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ message: messages.join(". ") });
    }

    // Handle unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      const fields = error.errors.map((e) => e.path).join(", ");
      return res.status(409).json({ message: `This ${fields} is already registered.` });
    }

    return res.status(500).json({ message: "Server error during registration. Please try again." });
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 * Body: { email, password }
 * Checks if account is approved before allowing login.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // ---- Validate input ----
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ---- Find user by email ----
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // ---- Verify password ----
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // ---- Check account status ----
    if (user.status === "Pending") {
      return res.status(403).json({
        message: "Tài khoản của bạn đang chờ duyệt (Pending). Vui lòng đợi quản trị viên phê duyệt.",
        status: "Pending",
      });
    }

    if (user.status === "Rejected") {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị từ chối (Rejected). Vui lòng liên hệ quản trị viên để được hỗ trợ.",
        status: "Rejected",
      });
    }

    // ---- Generate token ----
    const token = generateToken(user);

    // ---- Set cookie ----
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // ---- Determine redirect URL based on role ----
    // All non-admin roles redirect to their respective dashboards
    let redirectUrl = "/dashboard/user";
    if (user.role === "Admin") {
      redirectUrl = "/admin/dashboard";
    } else if (["Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi"].includes(user.role)) {
      redirectUrl = "/dashboard/user";
    }

    return res.json({
      message: "Login successful!",
      token,
      redirectUrl,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login. Please try again." });
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's details.
 * Requires valid JWT token.
 */
async function getCurrentUser(req, res) {
  try {
    // req.user is populated by authenticateToken middleware
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);
    return res.status(500).json({ message: "Server error." });
  }
}

/**
 * POST /api/auth/logout
 * Clears the authentication cookie.
 */
function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.json({ message: "Logged out successfully.", redirectUrl: "/auth/login" });
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};

