/**
 * Seed Script
 *
 * Creates the initial Admin account for the internal application.
 * Run this script ONCE after setting up PostgreSQL.
 *
 * Usage: node seed.js
 *
 * Environment variables (see .env):
 *   DB_HOST         - PostgreSQL host
 *   DB_PORT         - PostgreSQL port
 *   DB_NAME         - Database name
 *   DB_USER         - Database user
 *   DB_PASSWORD     - Database password
 *   ADMIN_USERNAME  - Admin username (default: "admin")
 *   ADMIN_EMAIL     - Admin email (default: "admin@company.com")
 *   ADMIN_PASSWORD  - Admin password (default: "Admin123!")
 */

require("dotenv").config();
const { sequelize } = require("./config/db");
const User = require("./models/User");

async function seed() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@company.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  try {
    console.log("🔄 Connecting to PostgreSQL...");
    await sequelize.authenticate();
    console.log(`✅ PostgreSQL connected: ${sequelize.config.host}:${sequelize.config.port}/${sequelize.config.database}\n`);

    // Sync models — create tables if they don't exist
    await sequelize.sync({ alter: false });
    console.log("✅ Database tables synced.\n");

    // ---- Check if Admin already exists ----
    const existingAdmin = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [
          { email: adminEmail.toLowerCase() },
          { username: adminUsername },
        ],
      },
    });

    if (existingAdmin) {
      console.log(`ℹ️  Admin account already exists:`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email:    ${existingAdmin.email}`);
      console.log(`   Role:     ${existingAdmin.role}`);
      console.log(`   Status:   ${existingAdmin.status}`);
      console.log("\n   Skipping creation.\n");
    } else {
      // ---- Create Admin user ----
      const admin = await User.create({
        username: adminUsername,
        email: adminEmail.toLowerCase(),
        password: adminPassword, // Will be hashed by model hook
        role: "Admin",
        status: "Approved", // Admin is auto-approved
      });

      console.log(`🎉 Admin account created successfully!`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email:    ${admin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role:     ${admin.role}`);
      console.log(`   Status:   ${admin.status}`);
      console.log(`\n   ⚠️  IMPORTANT: Change the default password after first login!\n`);
    }

    // ---- Show summary of all users ----
    const totalCount = await User.count();
    const pendingCount = await User.count({ where: { status: "Pending" } });
    const approvedCount = await User.count({ where: { status: "Approved" } });
    const rejectedCount = await User.count({ where: { status: "Rejected" } });
    const adminCount = await User.count({ where: { role: "Admin" } });

    console.log(`📊 Database Summary:`);
    console.log(`   Total users:  ${totalCount}`);
    console.log(`   Pending:      ${pendingCount}`);
    console.log(`   Approved:     ${approvedCount}`);
    console.log(`   Rejected:     ${rejectedCount}`);
    console.log(`   Admins:       ${adminCount}\n`);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("👋 Disconnected from PostgreSQL.");
  }
}

seed();
