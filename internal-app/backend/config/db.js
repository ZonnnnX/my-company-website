/**
 * PostgreSQL Database Configuration
 *
 * Uses Sequelize ORM to connect to PostgreSQL.
 * Connection parameters come from environment variables (see .env).
 *
 * Required env vars:
 *   DB_HOST       - PostgreSQL host (default: localhost)
 *   DB_PORT       - PostgreSQL port (default: 5432)
 *   DB_NAME       - Database name (default: internal_app)
 *   DB_USER       - Database user (default: postgres)
 *   DB_PASSWORD   - Database password (default: postgres)
 */

const { Sequelize } = require("sequelize");

// ---- Database Configuration ----
const sequelize = new Sequelize(
  process.env.DB_NAME || "internal_app",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? false : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // For connecting to a local PostgreSQL instance
      // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    },
  }
);

/**
 * Initialize database connection and sync models.
 * Creates tables if they don't exist (without dropping existing data).
 */
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log(`✅ PostgreSQL connected: ${sequelize.config.host}:${sequelize.config.port}/${sequelize.config.database}`);

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log("✅ Database tables synced.");
  } catch (error) {
    console.error(`❌ PostgreSQL connection error: ${error.message}`);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(() => connectDB(), 5000);
  }
}

// Handle connection events
sequelize.addHook("afterDisconnect", () => {
  console.log("⚠️ PostgreSQL disconnected.");
});

module.exports = { sequelize, connectDB };

