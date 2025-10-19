# 🎯 GitHub Pages 部署指南

## 完全免费 | 无需服务器 | 国内可访问

---

## ✨ 方案说明

**GitHub Pages** 是 GitHub 提供的免费静态网站托管服务。

**原理:**
- 前端JavaScript **直接连接** 融通金WebSocket
- 不需要Python后端
- 完全在浏览器中运行
- 100%免费！

**优势:**
- ✅ 完全免费
- ✅ 无需服务器
- ✅ 自动HTTPS
- ✅ 国内大部分地区可访问
- ✅ 每次push自动部署

---

## 🚀 部署步骤 (10分钟)

### 第1步: 准备文件

需要这3个文件:
- `index-github-pages.html` (改名为 `index.html`)
- `styles.css` (从 `public/` 复制)
- `script-websocket.js` (已创建)

### 第2步: GitHub Desktop 上传

#### 2.1 创建仓库

1. 打开 **GitHub Desktop**
2. `File` → `New Repository`
3. 填写:
   ```
   Name: gold-price-monitor
   Local Path: D:\API\大宗商品价格监控\github-pages
   ```
4. 勾选 `Initialize with README`
5. 点击 `Create Repository`

#### 2.2 准备文件

在 `D:\API\大宗商品价格监控\` 创建新文件夹:

```
github-pages/
├── index.html          (复制 index-github-pages.html 并改名)
├── styles.css          (复制 public/styles.css)
└── script-websocket.js (复制 public/script-websocket.js)
```

或者运行这个命令:

```bash
cd D:\API\大宗商品价格监控
mkdir github-pages
copy index-github-pages.html github-pages\index.html
copy public\styles.css github-pages\styles.css
copy public\script-websocket.js github-pages\script-websocket.js
```

#### 2.3 提交并发布

1. GitHub Desktop会自动检测到新文件
2. 左下角Summary填写: `Initial commit`
3. 点击 `Commit to main`
4. 点击 `Publish repository`
5. **不要勾选** "Keep this code private"
6. 点击 `Publish Repository`

✅ **代码已上传到GitHub!**

### 第3步: 启用GitHub Pages

#### 3.1 进入仓库设置

1. 打开浏览器,访问: https://github.com/你的用户名/gold-price-monitor
2. 点击 `Settings` (设置)
3. 在左侧菜单找到 `Pages`

#### 3.2 配置Pages

在 **Source** 下:
- Branch: 选择 `main`
- Folder: 选择 `/ (root)`
- 点击 `Save`

⏳ 等待1-2分钟...

#### 3.3 获取网站地址

页面会显示:

```
✅ Your site is live at https://你的用户名.github.io/gold-price-monitor/
```

**点击链接,访问你的网站!** 🎉

---

## 🧪 测试网站

访问: `https://你的用户名.github.io/gold-price-monitor/`

应该看到:

1. ✅ 6个价格卡片
2. ✅ 粒子背景动画
3. ✅ 黄金/白银价格自动更新 (WebSocket实时推送)
4. ✅ BTC/ETH价格显示
5. ✅ 可以切换CNY/USD
6. ✅ 联系电话横幅

**按F12打开Console,应该看到:**

```
正在连接WebSocket...
✅ WebSocket连接成功
📊 黄金(买): 971.0 CNY/g
📊 白银(买): 11.76 CNY/g
```

---

## 🌐 绑定自定义域名 (可选)

如果你有自己的域名:

### 1. 在GitHub仓库设置

1. Settings → Pages
2. Custom domain 填写: `gold.你的域名.com`
3. 点击 `Save`

### 2. 在域名商后台

添加DNS记录:

```
类型: CNAME
名称: gold
值: 你的用户名.github.io
```

### 3. 等待生效

⏳ 5-30分钟后访问你的域名

✅ **完成!**

---

## 🔄 更新网站

非常简单!

1. **修改代码** (本地修改 `github-pages/` 文件夹中的文件)
2. **GitHub Desktop** 会自动检测改动
3. 填写Summary: `更新价格显示`
4. **Commit** → **Push**
5. ⏳ 等待1-2分钟

✅ **GitHub Pages自动更新!**

---

## 📊 方案对比

| 特性 | GitHub Pages | Vercel | 自己服务器 |
|------|-------------|--------|-----------|
| 费用 | ✅ 免费 | 免费 | 60元/年 |
| 国内访问 | ✅ 可以 | ❌ 可能被墙 | ✅ 完全正常 |
| 速度 | ✅ 快 | 快 | ✅ 很快 |
| WebSocket | ✅ 前端直连 | 后端中转 | ✅ 后端持久连接 |
| 部署难度 | ⭐ 超简单 | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 自动部署 | ✅ 自动 | ✅ 自动 | ❌ 需手动 |

---

## ⚠️ 注意事项

### WebSocket限制

**GitHub Pages只能托管静态文件,不能运行后端代码。**

所以我们让前端JavaScript直接连接融通金WebSocket:

```javascript
// 前端直接连接
const ws = new WebSocket("wss://rtjwbqt.jzj9999.com:8443/gateway");
```

**优点:**
- ✅ 真正的实时价格推送
- ✅ 不需要后端服务器
- ✅ 完全免费

**缺点:**
- ⚠️ 如果融通金的WebSocket服务器有CORS限制,可能无法连接
- ⚠️ 用户关闭页面后就断开连接

### 如果WebSocket连接失败

如果浏览器Console显示CORS错误:

```
Access to WebSocket at 'wss://...' has been blocked by CORS policy
```

**解决方案:**

使用 **方案2: 自己的服务器 + server.py**

服务器端连接WebSocket没有CORS限制!

---

## 💡 推荐使用场景

### GitHub Pages 适合:
- ✅ 只是展示网站,自己或少数人访问
- ✅ 不想花钱买服务器
- ✅ 需要快速上线

### 自己服务器 适合:
- ✅ 需要24小时稳定运行
- ✅ 需要给客户或大量用户使用
- ✅ 想要完全掌控

---

## 🎯 快速决策

**测试WebSocket是否能直连:**

1. 打开 `index-github-pages.html`
2. 按F12打开Console
3. 看是否显示:
   ```
   ✅ WebSocket连接成功
   📊 黄金(买): 971.0 CNY/g
   ```

**如果成功** → 用GitHub Pages部署,完全免费!

**如果失败** → 用server.py + 云服务器部署

---

## 📞 现在开始!

### 最快验证 (1分钟):

1. 双击打开 `index-github-pages.html`
2. 按F12查看Console
3. 看WebSocket是否连接成功

**如果连接成功,就可以部署到GitHub Pages了!**

---

**需要帮你测试吗?** 🚀
