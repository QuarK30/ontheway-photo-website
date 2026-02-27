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


| 变量名                              | 必填  | 说明                                              |
| -------------------------------- | --- | ----------------------------------------------- |
| `MONGODB_URI`                    | 是   | **云端** MongoDB 连接串（不能再用本机 `127.0.0.1`）          |
| `JWT_SECRET`                     | 是   | 生产环境请改为随机长字符串（如 32 位以上）                         |
| `PORT`                           | 否   | 多数平台自动注入，可不填                                    |
| `CORS_ORIGIN`                    | 可选  | 填前端地址如 `https://xxx.vercel.app` 可限制跨域；不填则允许所有来源 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 可选  | 若要在部署后创建管理员，可设；或之后在平台 Shell 里跑脚本时再设             |


- **说明**：Render 免费版实例**无持久化磁盘**，重启后 `uploads` 目录会清空，新上传的图片会丢失。若需持久化，可后续升级 Render 持久化磁盘或改用对象存储（如 S3）。

### 前端（client）

- **构建**：`npm install` → `npm run build`（产出在 `client/dist/`）
- **环境变量**：


| 变量名            | 必填  | 说明                                               |
| -------------- | --- | ------------------------------------------------ |
| `VITE_API_URL` | 是   | 后端对外地址，如 `https://你的服务名.onrender.com`（末尾不要加 `/`） |


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
3. **配置 SSH 公钥（首次推送必做）**
  使用 SSH 推送前，需把本机公钥添加到 GitHub：
  - 若还没有 SSH 密钥：在 PowerShell 执行 `ssh-keygen -t ed25519 -C "您的邮箱"`，一路回车。
  - 用记事本打开 `C:\Users\你的用户名\.ssh\id_ed25519.pub`，复制全部内容。
  - 在 GitHub 网页右上角头像 → **Settings** → 左侧 **SSH and GPG keys** → **New SSH key**，Title 随意（如「我的电脑」），Key 里粘贴公钥 → **Add SSH key**。
4. **在本机项目根目录执行**（若尚未初始化 git）：
  ```bash
   cd d:\workspace\photo-website
   git init
   git add .
   git commit -m "OnTheWay: initial commit for deployment"
   git branch -M main
   git remote add origin git@github.com:你的用户名/仓库名.git
   git push -u origin main
  ```
   若已初始化过 git，只需：
   将 `你的用户名` 和 `仓库名` 换成您实际的信息（例如：`git@github.com:QuarK30/ontheway-photo-website.git`）。
5. **若 `git push` 报错**
  - **Permission denied / 认证失败**：说明 SSH 公钥未添加或填错，请按上面第 3 步重新添加公钥。  
  - **Connection was reset**（若您改用 HTTPS 地址时出现）：多为网络访问 GitHub 不稳定，建议改回 SSH 地址再推送：  
  `git remote set-url origin git@github.com:你的用户名/仓库名.git`，然后执行 `git push -u origin main`。

---

## 8.3 部署后端（以 Render 为例）

**建议**：先完成 **8.5 步骤一、二**（在 Railway 创建 MongoDB 并复制连接串），再执行下面步骤，这样到第 4 步时可直接粘贴 `MONGODB_URI`。

1. 打开 [https://render.com](https://render.com)，注册/登录（可用 GitHub 登录）。
2. **New → Web Service**，连接 GitHub，选择刚推送的 `photo-website` 仓库。
3. **配置**：
  - **Name**：`ontheway-server`（或任意）
  - **Root Directory**：填 `server`（重要：后端代码在 server 目录）
  - **Runtime**：Node
  - **Build Command**：`npm install && npm run build`
  - **Start Command**：`npm start`
4. **Environment** 中添加变量：
  **请先按下面 8.5 在 Railway 创建 MongoDB 并拿到连接串**，再回到此处在 Render 的 **Environment** 里点 **Add Environment Variable**，逐条添加：

  | Key           | Value                                                                                                                                                  |
  | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `MONGODB_URI` | 从 8.5 复制的 **Railway MongoDB 连接串**（整段粘贴）                                                                                                                |
  | `JWT_SECRET`  | 生产用随机长字符串，按下面「JWT_SECRET 如何生成」生成后粘贴                                                                                                                    |
  | `CORS_ORIGIN` | 可选。可不填或稍后补填：**无先后要求**，可先完成第 5 步 Create Web Service，等 8.4 部署完前端拿到地址后，再进 Render 该服务的 **Environment** 里添加 `CORS_ORIGIN` 并保存（会触发重新部署）。填上前端地址可限制仅你的站点能跨域请求。 |

   **JWT_SECRET 如何生成**（任选一种方式，得到一串随机字符后复制到 Value 即可）：
  - **本机已装 Node.js**：在 PowerShell 或终端执行下面一行，会输出一串随机字符，复制整行结果作为 Value：
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - **PowerShell（无需 Node）**：在 PowerShell 执行下面一行，会输出一串随机字符，复制作为 Value：
    ```powershell
    [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
    ```
  - **不想用命令**：可用任意「随机字符串生成」网页生成 32 位以上字母+数字串，或自己编一段不公开的长字符串（至少 32 位），填进 Value。**切勿使用文档里的示例（如 your-secret-key-change-in-production）**。
5. 点击 **Create Web Service**。部署完成后会得到一个 URL，例如：
  `https://ontheway-server.onrender.com`  
   **请复制保存**，前端环境变量 `VITE_API_URL` 要填这个地址（末尾不要 `/`）。
6. **创建管理员**（若部署前未在 Railway/Atlas 等库中创建过）：
  Render **免费版不支持 Shell**（点 Shell 会提示升级到 Starter），可用下面**本机运行**方式，在**同一套云端数据库**里创建管理员，无需付费。
   **推荐：在本机用云端连接串跑一次 create-admin**
  - 在您本机打开项目，进入 `server` 目录。
  - 临时建一个只用于本次的 `.env.admin`（或直接用现有 `.env` 临时改）：在 `server` 目录下保证有这三项（**MONGODB_URI 填 8.5 里复制的 Railway 连接串**，和 Render 用的是同一库）：
    ```
    MONGODB_URI=你的Railway_MongoDB连接串
    ADMIN_EMAIL=你的管理员邮箱
    ADMIN_PASSWORD=你要设的密码
    ```
  - 在 `server` 目录下执行（若用 `.env.admin` 需先重命名为 `.env` 或见下条）：
    ```bash
    npm run create-admin
    ```
    若不想改现有 `.env`，可在 PowerShell 里一行搞定（把三处替换成你的实际值）：
    ```powershell
    $env:MONGODB_URI="你的Railway连接串"; $env:ADMIN_EMAIL="你的邮箱"; $env:ADMIN_PASSWORD="你的密码"; npm run create-admin
    ```
  - 看到「管理员账号创建成功」即完成。之后用该邮箱和密码在**已部署的前端**登录后台即可。
   **若使用 Render 付费版（Starter）**：可在该服务的 **Shell**（左侧或顶部进入）里先设 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 环境变量，再执行 `npm run create-admin`。

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

### 访问管理员后台

管理员入口是前端的 **/admin** 路径，在浏览器中这样打开：

- **登录页**：`你的前端地址/admin/login`  
例如：`https://photo-website-xxx.vercel.app/admin/login`
- **后台首页**（未登录会先跳到登录）：`你的前端地址/admin` 或 `你的前端地址/admin/photos`

**操作步骤**：在地址栏输入「你的 Vercel 前端域名 + `/admin/login`」，回车 → 用 8.3 第 6 步创建的管理员邮箱和密码登录 → 登录成功后会进入照片管理（/admin/photos），可再点「留言管理」进入 /admin/comments。

---

## 8.5 云端 MongoDB：Railway MongoDB（推荐）

您阶段二用的是**本地 MongoDB**；上线必须改为**云端数据库**。建议**在 8.3 填 Render 环境变量之前**先完成本节，拿到连接串后再去 Render 第 4 步粘贴。

### 步骤一：在 Railway 创建项目并添加 MongoDB

1. 打开 [https://railway.app](https://railway.app)，用 **GitHub 账号登录**。
2. 点击 **New Project**（新建项目）。
3. 出现 **「What would you like to create?」** 界面（上方有搜索框，下面是一排选项）时：
  - 在列表中点击 **Database**（三个圆柱体图标的选项，**不要**选 GitHub Repository、Template 等）。
4. 若接下来让选择数据库类型，选 **MongoDB**；若直接开始创建，则等待几秒。
5. 创建完成后，当前项目里会出现一个 **MongoDB** 服务卡片（名称里带 MongoDB）。

### 步骤二：在 Railway 里查看变量并复制连接串

1. 点进 **MongoDB** 服务 → **Variables**（或 Connect），复制 **MONGO_PUBLIC_URL**（公网连接串，给 Render 和本机用）。若没有该项，见下条。
2. 若只有 **MONGO_URL** 且串里是 `mongodb.railway.internal`，需先开公网：
  - 该服务 **Settings** → **Networking** → **TCP Proxy** → 添加，端口填 **27017**。
  - Railway 会给出公网域名和端口。Variables 里若有 **MONGO_PUBLIC_URL** 直接复制；否则自己拼：`mongodb://mongo:密码@公网域名:公网端口`（密码从 **MONGOPASSWORD** 抄）。
3. 用这条**公网连接串**填到 Render 的 `MONGODB_URI`，本机 create-admin 也用这条。

### 步骤三：把连接串填到 Render 的 Environment

1. 打开 **Render** 上您创建的后端服务（8.3 里建的 Web Service）。
2. 左侧或顶部进入 **Environment**。
3. 点击 **Add Environment Variable**（或 **Add Variable**）：
  - **Key** 填：`MONGODB_URI`  
  - **Value** 填：粘贴步骤二复制的**完整连接串**
4. 保存（Save）。若服务已部署过，Render 会自动重新部署；若尚未部署，继续 8.3 第 5 步点击 **Create Web Service**。
5. 部署完成后在 **Logs** 里应能看到 `MongoDB connected`，表示连接成功。

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

## 九、遗留问题与解决方案

以下两个问题当前方案未完全覆盖，记录在此供后续优化参考。

### 9.1 国内访问不稳定或超时

**现象**：访客在中国大陆通过浏览器打开前端（Vercel）或请求后端（Render）时，出现「无法访问此网站」「响应时间过长」或 `ERR_CONNECTION_TIMED_OUT`，页面打不开或加载很慢。

**原因**：Vercel、Render 等服务的节点在海外，从国内访问需跨境，部分网络或运营商会限制、干扰或延迟，导致连接超时。

**解决方案**（可选，按需实施）：

- **访客侧**：换网络（如手机热点）、换设备或使用可访问国际站的网络环境后再试。
- **站点侧**：若主要受众在国内，可将前端与后端迁至国内可访问的托管与云服务：
  - **前端**：部署到国内云（如阿里云、腾讯云）的静态网站 / 对象存储 + CDN，或使用支持国内访问的托管。
  - **后端**：部署到国内云（如阿里云 ECS、腾讯云等），数据库可继续用 MongoDB（如云数据库或自建）。
  - 需自行备案与配置域名解析，并修改前端中的 API 地址等配置。

### 9.2 图片文件不持久：Render 免费版无持久化磁盘

**现象**：一段时间无人访问后 Render 服务休眠，或手动重启/重新部署后，之前上传的图片无法显示（列表或详情为空、图片 404）。数据库中的照片记录仍在，但图片文件已丢失。

**原因**：Render 免费版使用**临时磁盘**，实例休眠或重启后磁盘会清空，`server/uploads/` 下保存的图片文件不会保留。

**解决方案**（可选，按需实施）：

- **方案 A：Render 付费 + 持久化磁盘**  
  升级到 Render 的 Starter 等支持 **Persistent Disk** 的套餐，将 `uploads` 目录挂载到持久化磁盘，重启后文件仍保留。具体见 Render 文档中 Persistent Disks 的配置说明。

- **方案 B：使用云存储（推荐）**  
  上传时不再写入 Render 本机，改为上传到**对象存储**（如 Cloudinary、Vercel Blob、阿里云 OSS、腾讯云 COS 等），将返回的**图片 URL** 存入 MongoDB。这样 Render 休眠或重启都不会影响已上传图片。  
  实现要点：后端接受到上传文件后，调用所选云存储的 API 上传并获取公网 URL，将 URL 写入 Photo 的 `imageUrl` 字段；前端展示逻辑无需改动，仍使用 `imageUrl` 显示图片。

---

## 小结

- **本地**：继续用 `server/.env` 里的 `MONGODB_URI=mongodb://127.0.0.1:27017/ontheway` 开发即可。  
- **上线**：按 8.5 在 **Railway** 创建 MongoDB，把连接串填到后端 `MONGODB_URI`，不能再用本机地址。  
- 完成 8.2～8.5 后，任何人通过您的前端网址即可访问 OnTheWay。

