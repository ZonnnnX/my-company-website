/**
 * User Model (Sequelize / PostgreSQL)
 *
 * Defines the User entity for the internal application.
 * Supports:
 *  - Registration with automatic "Pending" status
 *  - Role-based access control (Staff, Manager, Admin)
 *  - Account approval/rejection workflow
 *  - Password hashing via bcrypt (handled in the controller)
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: "Username is required" },
        len: {
          args: [3, 50],
          msg: "Username must be between 3 and 50 characters",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: "Email is required" },
        isEmail: { msg: "Please provide a valid email address" },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: "Password is required" },
        len: {
          args: [6, 255],
          msg: "Password must be at least 6 characters",
        },
      },
    },
    role: {
      type: DataTypes.ENUM("Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi", "Admin"),
      defaultValue: "Người thực thi",
      validate: {
        isIn: {
          args: [["Giám đốc", "IT", "Kế toán", "Leader", "Người thực thi", "Admin"]],
          msg: "Role must be one of: Giám đốc, IT, Kế toán, Leader, Người thực thi, Admin",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
      validate: {
        isIn: {
          args: [["Pending", "Approved", "Rejected"]],
          msg: "Status must be one of: Pending, Approved, Rejected",
        },
      },
    },
  },
  {
    tableName: "users",
    timestamps: true, // Adds createdAt and updatedAt
    underscored: false,
    hooks: {
      // Hash password before creating or updating
      beforeSave: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

/**
 * Instance method: Compare candidate password with stored hash
 */
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method: Check if user can login
 */
User.prototype.canLogin = function () {
  return this.status === "Approved" || this.role === "Admin";
};

/**
 * Remove password from JSON serialization
 */
User.prototype.toSafeJSON = function () {
  const values = this.toJSON();
  delete values.password;
  return values;
};

module.exports = User;

