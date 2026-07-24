/**
 * Authentication Routes
 *
 * Handles user registration, login, logout, and session management.
 * Public routes (no authentication required):
 *   - POST /api/auth/register
 *   - POST /api/auth/login
 *
 * Protected routes (authentication required):
 *   - GET /api/auth/me
 *   - POST /api/auth/logout
 */

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const authController = require("../controllers/authController");

// ---- Public Routes ----

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account (status: Pending)
 * @access  Public
 * @body    { username, email, password }
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post("/login", authController.login);

// ---- Protected Routes ----

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's details
 * @access  Private (requires valid JWT)
 */
router.get("/me", authenticateToken, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Clear authentication cookie
 * @access  Private (requires valid JWT)
 */
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;

