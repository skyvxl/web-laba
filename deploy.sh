#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Загружаем переменные окружения
export PATH="$HOME/.nvm/versions/node/$(nvm current)/bin:$PATH" 2>/dev/null || true
export PATH="/usr/local/bin:/usr/bin:$PATH"

# Переходим в директорию проекта
cd "$(dirname "$0")"

echo "📦 Pulling latest changes..."
git fetch origin
git reset --hard origin/main

echo "📥 Installing dependencies..."
bun install

echo "🏗️  Building production bundle..."
bun run build:prod

echo "🔄 Restarting PM2..."
pm2 delete laba-ssr 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "✅ Deployment completed successfully!"
pm2 status
