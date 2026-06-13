module.exports = {
  apps: [
    {
      name: 'hive-hrm-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        NEXT_PUBLIC_API_URL: 'http://localhost:4003',
        NEXT_PUBLIC_APP_URL: 'http://localhost:4000',
      },
    },
  ],
};
