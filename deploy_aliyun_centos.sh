#!/bin/bash

# PayerMax Payment Demo - Aliyun CentOS 7 (NVM Version)
# URL: https://github.com/Larry1992Fei/PMX_Demo/master/deploy_aliyun_centos.sh

set -e

echo "🚀 Starting PayerMax Demo Deployment (CentOS 7 Compatible)..."

# 1. Clean up old nodesource repos
echo "🧹 Cleaning up old node repositories..."
sudo rm -f /etc/yum.repos.d/nodesource-*.repo
sudo yum clean all

# 2. Install Basics
echo "📦 Installing Basic dependencies..."
sudo yum install -y git curl --skip-broken

# 3. Install NVM & Node.js 16
if [ ! -d "$HOME/.nvm" ]; then
    echo "📦 Installing NVM (Node Version Manager)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "📦 Installing Node.js 16 via NVM..."
nvm install 16
nvm use 16

# Ensure node & npm are available in subshells
ln -sf $(which node) /usr/local/bin/node
ln -sf $(which npm) /usr/local/bin/npm

# 4. Install PM2
echo "📦 Installing PM2..."
npm install -g pm2
ln -sf $(which pm2) /usr/local/bin/pm2

# 5. Clone / Update Repository
APP_DIR="/var/www/payermax-payment-demo"
REPO_URL="https://github.com/Larry1992Fei/PMX_Demo.git"

if [ -d "$APP_DIR" ]; then
    echo "🔄 Updating existing repository..."
    cd $APP_DIR
    git pull origin master
else
    echo "📂 Cloning repository..."
    sudo mkdir -p /var/www
    sudo chown $USER:$USER /var/www
    cd /var/www
    git clone $REPO_URL payermax-payment-demo
    cd payermax-payment-demo
fi

# 6. Backend Setup
echo "🏗️ Setting up Backend..."
npm install
pm2 stop pmx-backend || true
pm2 start server.js --name "pmx-backend"

# 7. Frontend Setup
echo "🏗️ Building Frontend..."
cd frontend
npm install
npm run build

# 8. Nginx Setup
echo "📦 Installing Nginx..."
sudo yum install -y nginx

echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/conf.d/payermax.conf <<EOF
server {
    listen 80;
    server_name larrypay.top www.larrypay.top;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "✅ Deployment Complete!"
echo "🌐 Access your app at: http://larrypay.top"
pm2 status
