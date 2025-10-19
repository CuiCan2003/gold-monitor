# 🚀 大宗商品价格监控 - GitHub + Vercel 部署指南

## 📦 项目说明

这是一个实时黄金、白银、比特币、以太坊价格监控网站。

**数据来源:**
- 黄金/白银: 融通金实时WebSocket数据（你的Python代码）
- BTC/ETH: 币安API

**技术栈:**
- 前端: HTML + CSS + JavaScript
- 后端: Python (Vercel Serverless Function)
- 部署: Vercel + GitHub

---

## 📂 项目结构

```
大宗商品价格监控/
├── api/
│   └── prices.py          # Python API - 获取黄金白银价格
├── public/
│   ├── index.html         # 主页面
│   ├── styles.css         # 样式文件
│   └── script.js          # 前端逻辑
├── vercel.json            # Vercel配置
├── requirements.txt       # Python依赖
└── README.md              # 本文件
```

---

## 🎯 第一步: 准备GitHub仓库

### 1️⃣ 打开GitHub Desktop

### 2️⃣ 创建新仓库
- 点击 `File` → `New Repository`
- Repository name: `commodity-price-monitor`
- Local Path: 选择 `D:\API\大宗商品价格监控`
- 勾选 `Initialize this repository with a README`
- 点击 `Create Repository`

### 3️⃣ 准备文件

**需要上传到GitHub的文件：**
```
✅ api/prices.py
✅ public/index.html
✅ public/styles.css
✅ public/script.js
✅ vercel.json
✅ requirements.txt
✅ README.md
```

**不需要上传的文件（忽略）：**
```
❌ .claude/
❌ *.html (根目录下的测试文件)
❌ 融通金测试/
❌ node_modules/
```

### 4️⃣ 创建 .gitignore 文件

在项目根目录创建 `.gitignore` 文件：

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Node
node_modules/
npm-debug.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Claude
.claude/

# 测试文件
融通金测试/
*.html
!public/*.html

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel
```

### 5️⃣ 提交到GitHub

在GitHub Desktop中：
1. 查看所有改动
2. 在左下角Summary框中输入: `Initial commit - 大宗商品价格监控`
3. 点击 `Commit to main`
4. 点击右上角 `Publish repository`
5. 取消勾选 `Keep this code private` (如果你想公开)
6. 点击 `Publish Repository`

✅ **完成！你的代码已经上传到GitHub**

---

## 🔥 第二步: 部署到Vercel

### 1️⃣ 注册Vercel账号

访问: https://vercel.com/signup

- 选择 `Continue with GitHub`
- 授权Vercel访问你的GitHub账号

### 2️⃣ 导入GitHub项目

1. 登录Vercel后，点击 `Add New` → `Project`
2. 找到你的仓库 `commodity-price-monitor`
3. 点击 `Import`

### 3️⃣ 配置项目

**Framework Preset:** 选择 `Other`

**Build & Output Settings:**
- Build Command: 留空
- Output Directory: 留空
- Install Command: 留空

**Environment Variables:** 不需要添加

### 4️⃣ 部署

点击 `Deploy` 按钮！

⏳ 等待 1-2 分钟...

✅ **部署成功！**

你会看到类似这样的URL:
```
https://commodity-price-monitor-xxx.vercel.app
```

---

## 🌐 第三步: 绑定自定义域名

### 1️⃣ 在Vercel项目中添加域名

1. 进入你的Vercel项目
2. 点击 `Settings` → `Domains`
3. 输入你的域名，例如: `gold.yourdomain.com`
4. 点击 `Add`

### 2️⃣ 在域名商后台配置DNS

Vercel会告诉你需要添加的DNS记录，通常是：

**类型:** CNAME
**名称:** gold (或 @)
**值:** cname.vercel-dns.com

### 3️⃣ 等待DNS生效

⏳ 通常需要5-30分钟

✅ 完成后，你就可以通过自己的域名访问网站了！

---

## 🔄 第四步: 后续更新流程

### 更新代码并自动部署：

1. **修改代码** (在本地)
2. **打开GitHub Desktop**
3. **查看改动**
4. **填写Summary**: 例如 "更新价格显示逻辑"
5. **点击 `Commit to main`**
6. **点击 `Push origin`** (右上角)

✅ **Vercel会自动检测GitHub更新并重新部署！**

---

## 🧪 第五步: 测试网站

### 1️⃣ 测试API端点

访问: `https://你的域名/api/prices`

应该返回类似这样的JSON:
```json
{
  "success": true,
  "data": [
    {
      "code": "AU9999_BUY",
      "name": "黄金(买)",
      "price": 971.0,
      "unit": "CNY/g",
      "timestamp": "2025-10-20 12:00:00"
    },
    {
      "code": "SILVER_BUY",
      "name": "白银(买)",
      "price": 11.76,
      "unit": "CNY/g",
      "timestamp": "2025-10-20 12:00:00"
    }
  ],
  "last_update": "2025-10-20 12:00:00"
}
```

### 2️⃣ 测试主页

访问: `https://你的域名`

应该看到：
- ✅ 黄金价格（克和盎司）
- ✅ 白银价格（克和盎司）
- ✅ BTC和ETH价格
- ✅ 价格每秒自动更新
- ✅ 可以切换CNY/USD

### 3️⃣ 检查价格准确性

黄金(克) 应该显示约 **971元/克**
白银(克) 应该显示约 **11.76元/克**

✅ **如果价格正确，部署成功！**

---

## 🛠️ 常见问题

### Q1: API返回404错误？

**原因:** Vercel配置问题

**解决:**
1. 检查 `vercel.json` 文件是否正确
2. 确保 `api/prices.py` 文件存在
3. 重新部署: Vercel Dashboard → Deployments → 点击三个点 → Redeploy

### Q2: 黄金白银价格不更新？

**原因:** WebSocket连接失败

**解决:**
1. 检查 `api/prices.py` 文件
2. 确保 `requirements.txt` 包含 `websocket-client`
3. 查看Vercel Logs: Dashboard → Functions → 查看错误日志

### Q3: BTC/ETH价格显示正常，但黄金白银不显示？

**原因:** Python API调用失败

**解决:**
1. 单独测试API: `/api/prices`
2. 检查浏览器Console是否有CORS错误
3. 确认 `api/prices.py` 中的CORS头已设置

### Q4: 如何查看日志？

1. 进入Vercel Dashboard
2. 选择你的项目
3. 点击 `Functions` 标签
4. 点击 `prices.py`
5. 查看 `Logs`

### Q5: 本地如何测试？

**安装依赖:**
```bash
cd D:\API\大宗商品价格监控
pip install -r requirements.txt
```

**运行本地服务器:**
```bash
# 需要安装vercel CLI
npm install -g vercel
vercel dev
```

访问: http://localhost:3000

---

## 📊 监控部署状态

### Vercel Dashboard

访问: https://vercel.com/dashboard

可以看到:
- ✅ 部署状态
- ✅ 访问量统计
- ✅ 错误日志
- ✅ 函数执行时间

### 设置通知

1. Vercel Dashboard → Settings → Notifications
2. 勾选 `Deployment Failed`
3. 填写邮箱

**当部署失败时会收到邮件通知**

---

## 🎉 完成！

现在你的大宗商品价格监控网站已经：

✅ 部署到Vercel
✅ 绑定自定义域名
✅ 实时显示黄金白银价格（来自你的Python代码）
✅ 显示BTC/ETH价格
✅ 每秒自动更新
✅ 支持CNY/USD切换
✅ 显示联系电话

**下次更新只需要:**
1. 修改代码
2. GitHub Desktop → Commit → Push
3. Vercel自动部署

简单快捷！🚀

---

## 📞 技术支持

制作人: **Alpha8-阳光男孩**

如有问题，请检查：
1. Vercel Dashboard 的 Logs
2. 浏览器 Console (F12)
3. `/api/prices` 端点是否返回正确数据

---

**祝部署顺利！** 🎊
