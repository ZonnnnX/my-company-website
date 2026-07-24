/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Provides middleware functions to restrict access to routes
 * based on the user's role. Roles available:
 *   - Admin   : Full system access
 *   - Manager : Management-level access
 *   - Staff   : Basic operational access
 */

/**
 * Middleware factory: requireRole
 * Returns middleware that checks if the authenticated user has one of the specified roles.
 * @param  {...string} roles - Allowed roles (e.g., "Admin", "Manager", "Staff")
 */
function requireRole(...roles) {
  return (req, res, next) => {
    // Ensure user is authenticated first (use after authenticateToken)
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Check if user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

/**
 * Middleware: requireAdmin
 * Convenience middleware that only allows Admin role.
 */
function requireAdmin(req, res, next) {
  return requireRole("Admin")(req, res, next);
}

/**
 * Middleware: requireManagerOrAdmin
 * Allows both Manager and Admin roles.
 */
function requireManagerOrAdmin(req, res, next) {
  return requireRole("Admin", "Manager")(req, res, next);
}

module.exports = {
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
};

