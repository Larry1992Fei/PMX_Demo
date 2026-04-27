# PayerMax Payment Demo - 运维指南

本指南详细说明了如何维护项目以及如何从 GitHub 同步最新代码至阿里云服务器。

## 1. 本地代码更新 (Local)

在本地完成开发调试后，按以下步骤推送至 GitHub：

```bash
# 1. 暂存更改
git add .

# 2. 提交更改
git commit -m "feat: 描述你的更改内容"

# 3. 推送至 GitHub
git push origin master
```

---

## 2. 阿里云服务器同步 (Aliyun Server)

登录 SSH 后，执行以下操作：

### 基础同步
```bash
# 进入部署目录
cd /data/webapps/payermax-payment-demo

# 拉取最新代码
git pull origin master
```

### 使后端更新生效
如果修改了后端逻辑 (`server.js`, `utils/`, `config.js` 等)：
```bash
pm2 restart pmx-backend
```

### 使前端更新生效
如果修改了前端代码 (`frontend/src/` 等)：
```bash
cd frontend
# 如果新增了依赖包
npm install --registry=https://registry.npmmirror.com
# 构建静态资源
npm run build
```

---

## 3. 常用管理命令

### 后端服务管理 (PM2)
- **查看运行状态**: `pm2 status`
- **查看实时日志**: `pm2 logs pmx-backend`
- **停止服务**: `pm2 stop pmx-backend`

### Web 服务器管理 (Nginx)
- **检查配置语法**: `sudo nginx -t`
- **重新加载配置**: `sudo systemctl reload nginx`
- **重启服务**: `sudo systemctl restart nginx`

### 路径信息
- **项目根目录**: `/data/webapps/payermax-payment-demo`
- **前端静态目录**: `/data/webapps/payermax-payment-demo/frontend/dist`
- **Nginx 配置文件**: `/etc/nginx/conf.d/kfrj.conf` (SSL 版本)

---

## 4. 故障排除
1. **页面 404/无法访问**: 检查 Nginx 服务状态 (`systemctl status nginx`)。
2. **API 调用失败**: 检查后端 PM2 状态 (`pm2 status`) 并查看日志。
3. **前端构建报错**: 确保 Node 版本为 v16.x，且已降级使用 Vite 4 (`npm install vite@4.5.5`)。
