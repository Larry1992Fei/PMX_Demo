#!/bin/bash

# PayerMax Payment Demo - Aliyun Auto Deployment Script (CentOS / Alibaba Cloud Linux)
# URL: https://github.com/Larry1992Fei/PMX_Demo/master/deploy_aliyun_centos.sh

set -e

echo "🚀 Starting PayerMax Demo Deployment for CentOS..."

# 1. Install Basics (Skip system update to avoid conflicts)
sudo yum install -y git curl --skip-broken

# 2. Install Node.js (v16 for CentOS 7 compatibility)
if ! command -v node &> /dev/null
then
    echo "📦 Installing Node.js 16 (Required for CentOS 7)..."
    curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
    sudo yum install -y nodejs
fi

# 3. Install PM2 & Nginx
echo "📦 Installing PM2 and Nginx..."
sudo npm install -g pm2
sudo yum install -y nginx

# 4. Clone / Update Repository
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

# 5. Backend Setup
echo "🏗️ Setting up Backend..."
npm install
pm2 stop pmx-backend || true
pm2 start server.js --name "pmx-backend"

# 6. Frontend Setup
echo "🏗️ Building Frontend..."
cd frontend
npm install
npm run build

# 7. Nginx Configuration
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

# Ensure main nginx.conf includes conf.d (CentOS default usually does)
# Start and Enable Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "✅ Deployment Complete!"
echo "🌐 Access your app at: http://larrypay.top"
pm2 status
