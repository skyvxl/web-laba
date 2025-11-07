module.exports = {
  apps: [
    {
      name: 'laba-ssr',
      script: './dist/laba/server/server.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
