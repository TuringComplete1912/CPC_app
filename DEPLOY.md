# 部署指南

## 构建结果 ✅
你的构建完全正常，所有页面和 API 路由都已成功生成。

## 服务器部署前准备

### 1. 环境变量配置
在服务器项目根目录创建 `.env` 文件，包含以下内容：

```bash
# 数据库连接（SQLite）
DATABASE_URL="file:./dev.db"

# NextAuth 密钥（生产环境必须设置，使用随机字符串）
NEXTAUTH_SECRET="your-random-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://your-domain.com"  # 或 http://your-server-ip:3000

# Gemini API（可选，如果使用 AI 功能）
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

**生成 NEXTAUTH_SECRET 的方法：**
```bash
openssl rand -base64 32
```

### 2. 服务器部署步骤

```bash
# 1. 上传项目文件到服务器（排除 node_modules, .next, .env）
# 可以使用 git clone 或 scp/rsync

# 2. 安装依赖
npm install --production=false  # 需要 devDependencies 用于 Prisma

# 3. 生成 Prisma 客户端
npx prisma generate

# 4. 初始化数据库（如果数据库文件不存在）
npx prisma db push

# 5. 填充初始数据（创建 admin 账号）
npx prisma db seed

# 6. 创建上传目录
mkdir -p public/uploads

# 7. 构建生产版本
npm run build

# 8. 使用 PM2 启动
pm2 start ecosystem.config.js

# 9. 设置 PM2 开机自启（可选）
pm2 save
pm2 startup
```

### 3. 目录权限
确保以下目录可写：
- `public/uploads/` - 文件上传目录
- `prisma/dev.db` - SQLite 数据库文件
- `.next/` - Next.js 构建缓存

```bash
chmod -R 755 public/uploads
```

### 4. 防火墙/端口
确保服务器开放 3000 端口（或你配置的其他端口）：
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# 或使用 nginx 反向代理（推荐生产环境）
```

### 5. 验证部署
- 访问 `http://your-server-ip:3000`
- 使用 `admin / 123456` 登录
- 测试文件上传功能

## 常见问题

### 数据库文件位置
SQLite 数据库文件会在项目根目录生成 `dev.db`，确保该文件有写入权限。

### PM2 管理命令
```bash
pm2 list              # 查看运行状态
pm2 logs party-app     # 查看日志
pm2 restart party-app # 重启应用
pm2 stop party-app    # 停止应用
pm2 delete party-app  # 删除应用
```

### 更新部署
```bash
# 1. 拉取最新代码
git pull  # 或重新上传文件

# 2. 安装新依赖（如果有）
npm install

# 3. 重新生成 Prisma 客户端（如果 schema 有变化）
npx prisma generate
npx prisma db push

# 4. 重新构建
npm run build

# 5. 重启 PM2
pm2 restart party-app
```

