# 视界 - 全栈视频分享平台 (Next.js + Prisma + Neon/SQLite)

这是一个基于 **Next.js (App Router)**、**Prisma ORM** 和 **SQLite/PostgreSQL** 构建的高颜值、功能完备的全栈视频分享网站。本项目完全还原了参考原型的页面与核心逻辑，采用极致的 **Vanilla CSS (CSS Modules)** 打造毛玻璃暗黑科技感视觉风格，并在国内网络环境下进行了优化。

## 🌟 核心功能一览
1. **视频播放与互动**: 高端自制播放器、无刷新视频点赞与收藏状态联动。
2. **多级评论系统**: 支持发表评论、回复他人评论、对评论进行点赞互动。
3. **视频投稿发布**: 拖拽式视频投稿，自动上传至本地，且针对云端 serverless 只读环境设置了高质 stock 视频回退机制，确保在 Vercel 部署后投稿仍能顺畅演示。
4. **个人中心**: 资料修改（头像、昵称、邮箱、密码）、我的投稿列表及审核状态追踪（包含驳回意见展示）、我的收藏视频流、我的评论历史。
5. **管理员后台**:
   - **数据看板**: 大屏展示总用户数、总视频数、播放量及点赞总量。
   - **趋势图表**: 基于 SVG 手绘的最近 7 天全站播放量走势图，极具科技美感。
   - **视频审核**: 管理用户投稿，支持“通过”或“驳回”，驳回必须填写驳回原因并即时同步给投稿用户。
   - **用户管理**: 展示全站用户状态，支持一键封禁 (禁用) 或解冻 (启用) 违规账户。
   - **分类管理**: 动态管理视频分类目录。
6. **演示账号快速登录**: 登录页面提供“一键填入”测试用普通用户和管理员账户，极大方便演示和答辩展示。

---

## 🛠️ 本地运行指南

本地开发使用 **SQLite** 数据库，无需安装任何笨重的本地 MySQL/PostgreSQL，双击文件即可完美运行。

### 1. 安装依赖
在项目根目录 `video-site` 下运行：
```bash
npm install
```

### 2. 同步数据库
创建 SQLite 本地数据库并创建表结构：
```bash
npx prisma db push
```

### 3. 生成 Prisma 客户端
```bash
npx prisma generate
```

### 4. 导入丰富的测试数据 (Seeding)
运行种子脚本，自动生成 8+ 真实可播的视频、默认分类、推荐轮播、两级嵌套评论、点赞收藏交互数据、以及演示账号：
```bash
npx tsx prisma/seed.ts
```

### 5. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

### 🔑 演示测试账号：
- **普通用户**: 账号 `user1` 密码 `User@123`
- **超级管理员**: 账号 `admin` 密码 `Admin@123`
*(登录页面提供一键填入按钮，直接点击即可！)*

---

## 🚀 部署至 Vercel (完全免费且支持国内访问)

为了让其他人通过网址直接访问，我们需要将项目部署到 Vercel，并将数据库迁至免费的云数据库 **Neon PostgreSQL**（Vercel 官方推荐）。

### 第一步：在 Neon.tech 上获取免费 PostgreSQL 数据库
1. 访问 [Neon 官网](https://neon.tech/)，使用 GitHub 账号免费注册登录。
2. 点击 **Create Project**，创建一个新项目，数据库类型选择默认的 PostgreSQL。
3. 创建成功后，你将获得一个连接字符串，类似于：
   `postgresql://neondb_owner:xxxxxx@ep-xxxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. 复制该连接字符串，这是我们接下来部署所需的 `DATABASE_URL`。

### 第二步：将项目托管至 GitHub
1. 在你的 GitHub 上创建一个新的私有或公开仓库（Repository）。
2. 在本地项目根目录 `video-site` 下运行命令（或者使用 Git Desktop 工具）：
   ```bash
   git init
   git add .
   git commit -m "feat: init video platform"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

### 第三步：在 Vercel 上导入项目并配置
1. 访问 [Vercel 官网](https://vercel.com/)，用 GitHub 账号登录。
2. 点击 **Add New** -> **Project**，导入你刚刚上传的 GitHub 仓库。
3. 在 **Environment Variables** (环境变量) 区域，添加以下变量：
   - **`DATABASE_URL`**: 填入你第一步在 Neon 获取的 PostgreSQL 连接字符串。
   - **`JWT_SECRET`**: 填入任意长字符串（如 `my_secure_random_key_2026`）用于签名加密。
4. **极其重要 (Prisma 7 构建设置)**：
   由于 Prisma 7 分离了本地驱动和生产的云连接。Vercel 在构建时会自动检测。你只需要在 Vercel 平台的 **Build Command**（构建命令）中，将默认的 `next build` 覆盖为：
   `npx prisma db push && npx prisma generate && next build`
5. 点击 **Deploy**。等待大约 1-2 分钟，即可构建成功并获得一个分配的免费二级域名（如 `xxxx.vercel.app`）！

### 🇨🇳 关于国内稳定访问 Vercel 的优化建议
Vercel 默认提供的 `*.vercel.app` 域名在中国大陆的部分地区和宽带下可能会受到防火墙拦截或访问缓慢。
**极速优化的解决方案**：
1. **绑定自定义域名**：
   在阿里云、腾讯云等平台注册一个极便宜的域名（如几块钱一年的 `.top` 或 `.xyz` 域名）。
2. **在 Vercel 中添加域名**：
   在 Vercel 项目控制台点击 **Settings** -> **Domains**，输入你的自定义域名。
3. **配置 DNS 解析**：
   按照 Vercel 提供的提示，登录你的域名控制面板，添加一条 `CNAME` 解析指向 `cname.vercel-dns.com`（若需要国内特别优化，可指向 `76.76.21.21` 的 A 记录）。
   *绑定自定义域名后，国内即可畅通无阻、秒速访问你的视频网站！*
