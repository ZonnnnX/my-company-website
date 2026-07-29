/**
 * PM2 Configuration for Company Website Backend
 * 
 * PM2 ensures the server auto-restarts if it crashes.
 * 
 * Usage:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup   (to auto-start on system boot)
 */

module.exports = {
  apps: [{
    name: 'company-website',
    cwd: './backend',
    script: 'index.js',
    
    // Auto-restart if crashes
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    
    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './server.err.log',
    out_file: './server.log',
    merge_logs: true,
    
    // Watch for file changes (disabled in production)
    watch: false,
    
    // Memory limit (restart if exceeds)
    max_memory_restart: '500M',
  }]
};

