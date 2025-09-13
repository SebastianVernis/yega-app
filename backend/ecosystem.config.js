module.exports = {
  apps : [{
    name: 'yega',
    script: '/var/www/yega/backend/server.js',
    cwd: '/var/www/yega/backend',
    env_production: {
      NODE_ENV: 'production',
      NODE_PATH: '/var/www/yega/backend/node_modules',
      FRONTEND_URL: 'https://yega.com.mx'
    }
  }, {
    name: 'caddy',
    script: 'caddy',
    args: 'run',
    cwd: '/home/ec2-user',
    restart_delay: 5000,
    autorestart: true,
    watch: false
  }]
};
