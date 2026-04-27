#!/bin/bash

# PayerMax Payment Demo - Aliyun Auto Deployment Script (Ubuntu)
# Usage: curl -sSL https://raw.githubusercontent.com/Larry1992Fei/PMX_Demo/master/deploy_aliyun.sh | bash

set -e

echo "🚀 Starting PayerMax Demo Deployment..."

# 1. Update System
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Node.js (v18)
if ! command -v node &> /dev/null
then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install PM2 & Nginx
echo "📦 Installing PM2 and Nginx..."
sudo npm install -g pm2
sudo apt-get install -y nginx git

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
sudo tee /etc/nginx/sites-available/payermax <<EOF
server {
    listen 80;
    server_name _; # Replace with your domain if available

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

sudo ln -sf /etc/nginx/sites-available/payermax /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment Complete!"
echo "🌐 Access your app at: http://$(curl -s ifconfig.me)"
pm2 status
