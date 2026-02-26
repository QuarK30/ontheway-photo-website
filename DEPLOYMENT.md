# 阶段七：部署与上线

本文档对应 **DEVELOPMENT-PLAN.md** 中的「八、阶段七：部署与上线」，带您完成 GitHub 推送、后端/前端部署，以及**云端数据库**配置。

---

## 重要：关于 MongoDB

**阶段二您使用了本地 MongoDB**（`mongodb://127.0.0.1:27017/ontheway`），本地开发没问题。

**上线时后端会跑在 Render（或其它云平台）上**，无法访问您电脑上的数据库，因此**必须使用云端可访问的 MongoDB**。  

本文档以 **Railway MongoDB** 为主方案（无需 IP 白名单、连接简单）；备选为 MongoDB Atlas。

---

## 8.1 部署用配置清单

### 后端（server）

- **构建**：`npm install` → `npm run build`（产出在 `dist/`）
- **启动**：`npm start`（即 `node dist/index.js`）
- **环境变量**（部署平台需配置）：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `MONGODB_URI` | 是 | **云端** MongoDB 连接串（不能再用本机 `127.0.0.1`） |
| `JWT_SECRET` | 是 | 生产环境请改为随机长字符串（如 32 位以上） |
| `PORT` | 否 | 多数平台自动注入，可不填 |
| `CORS_ORIGIN` | 可选 | 填前端地址如 `https://xxx.vercel.app` 可限制跨域；不填则允许所有来源 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 可选 | 若要在部署后创建管理员，可设；或之后在平台 Shell 里跑脚本时再设 |

- **说明**：Render 免费版实例**无持久化磁盘**，重启后 `uploads` 目录会清空，新上传的图片会丢失。若需持久化，可后续升级 Render 持久化磁盘或改用对象存储（如 S3）。

### 前端（client）

- **构建**：`npm install` → `npm run build`（产出在 `client/dist/`）
- **环境变量**：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `VITE_API_URL` | 是 | 后端对外地址，如 `https://你的服务名.onrender.com`（末尾不要加 `/`） |

---

## 8.1.5 安装 Git（若尚未安装）

推送代码到 GitHub 需要先在本机安装 Git。**若已安装**，在终端输入 `git --version` 能看到版本号即可，直接进行 8.2。

### Windows

1. **下载**  
   打开 [https://git-scm.com/download/win](https://git-scm.com/download/win)，浏览器会自动下载 64 位安装包（或按页面提示选 32 位）。

2. **安装**  
   - 双击下载的 `.exe`，一路 **Next**。  
   - 默认选项即可；若遇到「Choosing the default editor」，可保持 **Use Visual Studio Code** 或选 **Notepad++**。  
   - 「Adjusting your PATH environment」建议选 **Git from the command line and also from 3rd-party software**，这样在 PowerShell 和 CMD 里都能用 `git`。  
   - 最后 **Install**，完成后 **Finish**。

3. **验证**  
   - 关闭并重新打开 **PowerShell** 或 **命令提示符**（重要：必须新开窗口才能识别到 `git`）。  
   - 输入：`git --version`  
   - 若显示类似 `git version 2.xx.x` 即表示安装成功。

4. **设置用户身份（首次使用必做）**  
   Git 提交时需要记录「谁提交的」，请在本机执行下面两行（把邮箱和名字换成您的，**邮箱建议与 GitHub 账号一致**）：

   ```bash
   git config --global user.email "您的邮箱@example.com"
   git config --global user.name "您的名字或 GitHub 用户名"
   ```

   例如：`git config --global user.email "hcy@gmail.com"`、`git config --global user.name "hcy"`。  
   设置完成后，再执行 8.2 里的 `git commit` 就不会再提示 "Author identity unknown"。

### macOS

- **方式一**：打开终端，执行 `xcode-select --install`，按提示安装「命令行开发者工具」（内含 Git）。  
- **方式二**：到 [https://git-scm.com/download/mac](https://git-scm.com/download/mac) 下载安装包并安装。  
- 安装后新开终端，执行 `git --version` 确认。

### Linux（Ubuntu / Debian）

- 终端执行：`sudo apt update && sudo apt install git -y`  
- 安装后执行：`git --version` 确认。

---

## 8.2 在 GitHub 创建仓库并推送代码

**前提**：已按 8.1.5 安装 Git，且终端里执行 `git --version` 能显示版本号。

1. **确认不提交敏感与本地文件**  
   项目根目录已提供 `.gitignore`，会排除：
   - `node_modules/`、`.env`、`server/.env`
   - `server/uploads/`、`dist/`、`client/dist/`

2. **在 GitHub 建仓**  
   - 打开 [https://github.com/new](https://github.com/new)  
   - Repository name 填：`photo-website`（或您喜欢的名字）  
   - 选 Public 或 Private → 点击 **Create repository**  
   - **不要**勾选 "Add a README"（您本地已有代码）

3. **在本机项目根目录执行**（若尚未初始化 git）：

   ```bash
   cd d:\workspace\photo-website
   git init
   git add .
   git commit -m "OnTheWay: initial commit for deployment"
   git branch -M main
   git remote add origin https://github.com/你的用户名/photo-website.git
   git push -u origin main
   ```

   若已初始化过 git，只需：

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git remote add origin https://github.com/你的用户名/photo-website.git
   git push -u origin main
   ```

   将 `你的用户名` 和仓库名换成您实际的信息。

---

## 8.3 部署后端（以 Render 为例）

1. 打开 [https://render.com](https://render.com)，注册/登录（可用 GitHub 登录）。

2. **New → Web Service**，连接 GitHub，选择刚推送的 `photo-website` 仓库。

3. **配置**：
   - **Name**：`ontheway-server`（或任意）
   - **Root Directory**：填 `server`（重要：后端代码在 server 目录）
   - **Runtime**：Node
   - **Build Command**：`npm install && npm run build`
   - **Start Command**：`npm start`

4. **Environment** 中添加变量：

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | 从 8.5 **Railway MongoDB** 复制的连接串 |
   | `JWT_SECRET` | 生产用随机长字符串（可自己生成一段 32 位以上字符） |
   | `CORS_ORIGIN` | 可选，前端地址如 `https://xxx.vercel.app`（部署完前端后再填） |

5. 点击 **Create Web Service**。部署完成后会得到一个 URL，例如：  
   `https://ontheway-server.onrender.com`  
   **请复制保存**，前端环境变量 `VITE_API_URL` 要填这个地址（末尾不要 `/`）。

6. **创建管理员**（若部署前未在 Railway/Atlas 等库中创建过）：  
   - 在 Render 该服务的 **Shell** 里执行：  
     `npm run create-admin`  
   - 执行前在 **Environment** 中临时加上 `ADMIN_EMAIL`、`ADMIN_PASSWORD`，执行完可删或保留。

---

## 8.4 部署前端（以 Vercel 为例）

1. 打开 [https://vercel.com](https://vercel.com)，用 GitHub 登录。

2. **Add New → Project**，导入 `photo-website` 仓库。

3. **配置**：
   - **Root Directory**：点击 **Edit**，改为 `client`
   - **Framework Preset**：Vite（一般会自动识别）
   - **Build Command**：`npm run build`（默认即可）
   - **Output Directory**：`dist`（Vite 默认）

4. **Environment Variables** 添加：
   - **Key**：`VITE_API_URL`  
   - **Value**：`https://ontheway-server.onrender.com`（换成您 8.3 得到的后端地址，**不要**末尾斜杠）

5. 点击 **Deploy**。部署完成后会得到前端访问地址，如：  
   `https://photo-website-xxx.vercel.app`

---

## 8.5 云端 MongoDB：Railway MongoDB（推荐）

您阶段二用的是**本地 MongoDB**；上线必须改为**云端数据库**。以下按 **Railway MongoDB** 操作即可，无需 IP 白名单。

### 步骤一：在 Railway 创建 MongoDB

1. 打开 [https://railway.app](https://railway.app)，用 **GitHub 账号登录**。
2. 点击 **New Project**（新建项目）。
3. 在「Add a plugin」或「Deploy from GitHub」的界面中，选择 **Provision MongoDB**（或 **Add Plugin** → 在插件列表里选 **MongoDB**）。
4. 创建完成后，项目里会出现一个 **MongoDB** 服务（卡片上写 MongoDB）。

### 步骤二：拿到连接串

1. 点击该 **MongoDB** 服务卡片进入详情。
2. 打开 **Variables**（变量）或 **Connect** 标签页。
3. 找到 **MONGO_URL** 或 **MONGODB_URI** 或 **DATABASE_URL**（名称因 Railway 版本可能略有不同），点击 **Copy** 或复制其**值**。  
   - 连接串形如：`mongodb://mongo:密码@主机:端口/railway` 或 `mongodb+srv://...`
4. **建议在连接串里指定数据库名**（若没有 `/数据库名`）：  
   - 若串末尾是 `.../railway` 或 `.../` 带库名，可沿用，或改成 `/ontheway` 与本地一致。  
   - 若串里没有库名，在 `?` 前加上 `/ontheway`，例如：  
     `...mongodb.net/ontheway?retryWrites=...`

### 步骤三：填到后端环境变量

- 在 **Render**（或您部署后端的平台）该服务的 **Environment** 里，添加变量：  
  - **Key**：`MONGODB_URI`  
  - **Value**：粘贴刚才复制的 **完整连接串**  
- 保存后，重新部署一次后端（或等自动部署），日志里应出现 `MongoDB connected`。

### 可选：后端也部署在 Railway

若希望**后端和数据库都在 Railway**（不单独用 Render）：

1. 在同一 Railway 项目里点击 **New** → **GitHub Repo**，选择 `photo-website` 仓库。
2. 进入该 Service → **Settings** → **Root Directory** 填 `server`。
3. **Variables** 里添加：`MONGODB_URI`（可点击 MongoDB 服务右侧 **Connect**，选择「Reference variables」引用该 MongoDB 的 `MONGO_URL`）、`JWT_SECRET`、以及可选 `CORS_ORIGIN`（前端地址）。
4. **Build Command**：`npm install && npm run build`；**Start Command**：`npm start`。
5. **Deploy** 后，在 **Settings** 里为该 Service 生成 **Public URL**，前端 `VITE_API_URL` 填这个地址即可。

---

### 备选：MongoDB Atlas

若改用 Atlas：打开 [cloud.mongodb.com](https://cloud.mongodb.com) → 建集群 → Database Access 建用户 → Network Access 添加 `0.0.0.0/0` → Connect 选 Drivers 复制连接串，将 `<password>` 换成实际密码，并在 `?` 前加上 `/ontheway`，最后把该串填到后端 `MONGODB_URI`。连接失败时检查白名单、密码特殊字符 URL 编码、连接串里数据库名是否正确。

---

## 8.6 上线后自测清单

部署完成后，请按下面逐项自测（**全部在线上环境**进行）：

1. **首页**：打开前端地址，能打开、无报错。
2. **地图与红点**：有照片数据时能看到地图和红点；滚轮缩放、拖拽正常。
3. **红点 → 详情**：点击红点，直接进入该地点某张图片详情页（不经过列表）。
4. **同地点多图**：若该地点有多张图，详情页有左/右箭头，能切换且不返回地图。
5. **留言**：在详情页设昵称、发一条留言，列表立即显示；刷新后仍存在。
6. **管理员登录**：访问 `/admin/login`，用管理员账号登录，能进入后台。
7. **照片管理**：上传一张新照片，列表中出现；编辑、删除功能正常。
8. **留言管理**：在后台能看到留言、按图片筛选、隐藏/删除正常。

若某一步异常，请记下：**操作步骤、页面地址、现象（或报错信息）**，便于排查。

---

## 小结

- **本地**：继续用 `server/.env` 里的 `MONGODB_URI=mongodb://127.0.0.1:27017/ontheway` 开发即可。  
- **上线**：按 8.5 在 **Railway** 创建 MongoDB，把连接串填到后端 `MONGODB_URI`，不能再用本机地址。  
- 完成 8.2～8.5 后，任何人通过您的前端网址即可访问 OnTheWay。
