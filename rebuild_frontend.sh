#!/bin/bash
set -e

FRONTEND_DIR="/var/www/yega/frontend"
API_URL="https://yega.com.mx/api"

echo "--- Rebuilding the frontend application ---"

echo "Creating .env.production file..."
echo "VITE_API_URL=$API_URL" | sudo tee "$FRONTEND_DIR/.env.production" > /dev/null

echo "Installing dependencies..."
cd "$FRONTEND_DIR"
sudo npm install

echo "Building the frontend..."
sudo npm run build

echo "--- Frontend rebuild complete ---"

echo "Restarting the yega application..."
pm2 restart yega

echo "Done."