/**
 * Admin Controller
 *
 * Manages user administration: listing pending users,
 * approving/rejecting accounts, and assigning roles.
 * All routes require Admin role.
 *
 * Uses Sequelize (PostgreSQL) for database operations.
 */

const { Op } = require("sequelize");
const User = require("../models/User");

/**
 * GET /api/admin/pending-users
 * Returns a list of all users with "Pending" status.
 */
async function getPendingUsers(req, res) {
  try {
    const pendingUsers = await User.findAll({
      where: { status: "Pending" },
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    return res.json({
      count: pendingUsers.length,
      users: pendingUsers,
    });
  } catch (error) {
    console.error("Get pending users error:", error.message);
    return res.status(500).json({ message: "Server error fetching pending users." });
  }
}

/**
 * GET /api/admin/users
 * Returns a list of ALL users (for admin management overview).
 * Supports optional status/role filter via query params.
 */
async function getAllUsers(req, res) {
  try {
    const { status, role } = req.query;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    return res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error.message);
    return res.status(500).json({ message: "Server error fetching users." });
  }
}

/**
 * PATCH /api/admin/users/:id/approve
 * Approves a user's account and optionally assigns a role.
 * Body: { role: "Staff" | "Manager" }
 */
async function approveUser(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role if provided
    const validRoles = ["Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Role must be one of: ${validRoles.join(", ")}.`,
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.status === "Approved") {
      return res.status(400).json({ message: "User is already approved." });
    }

    // Update user: set status to Approved, update role if provided
    const updateData = { status: "Approved" };
    if (role) {
      updateData.role = role;
    }

    await user.update(updateData);

    return res.json({
      message: `User "${user.username}" has been approved successfully.`,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Approve user error:", error.message);
    return res.status(500).json({ message: "Server error approving user." });
  }
}

/**
 * PATCH /api/admin/users/:id/reject
 * Rejects a user's account.
 */
async function rejectUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.status === "Rejected") {
      return res.status(400).json({ message: "User is already rejected." });
    }

    // Cannot reject an Admin
    if (user.role === "Admin") {
      return res.status(400).json({ message: "Cannot reject an admin account." });
    }

    await user.update({ status: "Rejected" });

    return res.json({
      message: `User "${user.username}" has been rejected.`,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Reject user error:", error.message);
    return res.status(500).json({ message: "Server error rejecting user." });
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Updates a user's role.
 * Body: { role: "Giám đốc" | "IT" | "Kế toán" | "Leader" | "Người thực thi" | "Admin" }
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi", "Admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Role is required and must be one of: ${validRoles.join(", ")}.`,
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.update({ role });

    return res.json({
      message: `User "${user.username}" role updated to "${role}".`,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Update role error:", error.message);
    return res.status(500).json({ message: "Server error updating role." });
  }
}

/**
 * POST /api/admin/users
 * Admin creates a new user directly with a specific role and auto-Approved status.
 * Body: { username, email, password, role }
 */
async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }

    if (typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters." });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const validRoles = ["Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi"];
    const finalRole = role && validRoles.includes(role) ? role : "Người thực thi";

    // Check existing
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase().trim() },
          { username: username.trim() },
        ],
      },
    });
    if (existing) {
      if (existing.email === email.toLowerCase().trim()) {
        return res.status(409).json({ message: "Email already exists." });
      }
      return res.status(409).json({ message: "Username already exists." });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: finalRole,
      status: "Approved",
    });

    return res.status(201).json({
      message: `User "${user.username}" created with role "${finalRole}" and auto-approved.`,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Create user error:", error.message);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Username or email already exists." });
    }
    return res.status(500).json({ message: "Server error creating user." });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Deletes a user account (Admin only).
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prevent deleting the last admin
    if (user.role === "Admin") {
      const adminCount = await User.count({ where: { role: "Admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last admin account.",
        });
      }
    }

    await user.destroy();

    return res.json({
      message: `User "${user.username}" has been deleted.`,
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({ message: "Server error deleting user." });
  }
}

module.exports = {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  createUser,
  deleteUser,
};

