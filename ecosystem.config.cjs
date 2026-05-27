module.exports = {
  apps: [
    {
      name: 'daily-reflect-backend',
      cwd: './server',
      script: 'uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        PYTHONUNBUFFERED: '1',
      },
    },
    {
      name: 'daily-reflect-frontend',
      script: 'serve-frontend.js',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
