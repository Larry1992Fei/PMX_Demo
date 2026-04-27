#!/bin/bash

# PayerMax Payment Demo - Aliyun CentOS 7 (Mirror Version)
# URL: https://github.com/Larry1992Fei/PMX_Demo/master/deploy_aliyun_centos.sh

set -e

echo "🚀 Starting PayerMax Demo Deployment (China Mirror Mode)..."

# 1. Clean up old node repositories
echo "🧹 Cleaning up old node repositories..."
sudo rm -f /etc/yum.repos.d/nodesource-*.repo
sudo yum clean all

# 2. Install Basics
echo "📦 Installing Basic dependencies..."
sudo yum install -y git curl wget tar xz --skip-broken

# 3. Install Node.js (Direct Binary from Mirror - No GitHub needed)
if ! command -v node &> /dev/null
then
    echo "📦 Downloading Node.js 16 binary... (using npmmirror for speed)"
    cd /tmp
    wget https://npmmirror.com/mirrors/node/v16.20.2/node-v16.20.2-linux-x64.tar.xz
    tar -xvf node-v16.20.2-linux-x64.tar.xz
    sudo rm -rf /usr/local/node
    sudo mv node-v16.20.2-linux-x64 /usr/local/node
    sudo ln -sf /usr/local/node/bin/node /usr/local/bin/node
    sudo ln -sf /usr/local/node/bin/npm /usr/local/bin/npm
    sudo ln -sf /usr/local/node/bin/npx /usr/local/bin/npx
fi

echo "✅ Node.js Version: $(node -v)"

# 4. Install PM2
echo "📦 Installing PM2..."
sudo /usr/local/node/bin/npm install -g pm2
sudo ln -sf /usr/local/node/bin/pm2 /usr/local/bin/pm2

# 5. Clone / Update Repository
APP_DIR="/var/www/payermax-payment-demo"
# If GitHub is slow, users might need to use Gitee mirror, but we stick to GitHub for now.
REPO_URL="https://github.com/Larry1992Fei/PMX_Demo.git"

if [ -d "$APP_DIR" ]; then
    echo "🔄 Updating existing repository..."
    cd $APP_DIR
    git pull origin master || (echo "⚠️ Git pull failed, attempting force clone..." && cd .. && sudo rm -rf $APP_DIR && git clone $REPO_URL payermax-payment-demo)
else
    echo "📂 Cloning repository..."
    sudo mkdir -p /var/www
    sudo chown $USER:$USER /var/www
    cd /var/www
    git clone $REPO_URL payermax-payment-demo || (echo "❌ Git clone failed. Please check network to GitHub." && exit 1)
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
