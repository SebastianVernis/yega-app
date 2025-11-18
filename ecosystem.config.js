module.exports = {
  apps: [
    {
      name: 'manda2-backend',
      script: 'server.js',
      cwd: '/home/sebastianvernis/Desarrollo/Aplicaciones_Web/yega-app/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: 'mongodb://localhost:27017/manda2'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10
    }
  ]
};
