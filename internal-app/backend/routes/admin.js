/**
 * Admin Routes
 *
 * All routes require authentication + Admin role.
 * Manages user accounts: listing, approving, rejecting, role assignment.
 */

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");
const adminController = require("../controllers/adminController");

// All admin routes require authentication + Admin role
router.use(authenticateToken, requireAdmin);

/**
 * @route   GET /api/admin/pending-users
 * @desc    Get list of users with Pending status
 * @access  Private (Admin only)
 */
router.get("/pending-users", adminController.getPendingUsers);

/**
 * @route   GET /api/admin/users
 * @desc    Get list of all users (optional filters: ?status=, ?role=)
 * @access  Private (Admin only)
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Admin creates a new user directly (auto-approved with role)
 * @access  Private (Admin only)
 * @body    { username, email, password, role }
 */
router.post("/users", adminController.createUser);

/**
 * @route   PATCH /api/admin/users/:id/approve
 * @desc    Approve a user account and optionally assign role
 * @access  Private (Admin only)
 * @body    { role?: "Staff" | "Manager" }
 */
router.patch("/users/:id/approve", adminController.approveUser);

/**
 * @route   PATCH /api/admin/users/:id/reject
 * @desc    Reject a user account
 * @access  Private (Admin only)
 */
router.patch("/users/:id/reject", adminController.rejectUser);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update a user's role
 * @access  Private (Admin only)
 * @body    { role: "Staff" | "Manager" | "Admin" }
 */
router.patch("/users/:id/role", adminController.updateUserRole);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user account
 * @access  Private (Admin only)
 */
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;

