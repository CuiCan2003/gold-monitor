# 🚀 Zeabur部署指南（国内可访问）

## Zeabur 是什么？
- 类似Vercel，但国内可以访问！
- 支持Python
- 免费额度充足
- 自动部署

---

## 📦 准备文件

需要这些文件（已经帮你准备好了）：

```
大宗商品价格监控/
├── app.py                    # Flask服务器
├── 融通金获取价格.py           # 你的爬虫
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── requirements.txt           # Python依赖
└── vercel.json               # 配置文件
```

---

## 🚀 部署步骤

### 第1步: 注册Zeabur

访问: https://zeabur.com

- 用GitHub账号登录
- 免费注册

### 第2步: 上传代码到GitHub

1. 打开GitHub Desktop
2. 创建仓库 `gold-price-monitor`
3. 把所有文件提交
4. Publish到GitHub

### 第3步: 在Zeabur导入项目

1. 登录Zeabur
2. 点击 "Create Project"
3. 选择 "Deploy from GitHub"
4. 选择你的仓库 `gold-price-monitor`
5. Zeabur会自动检测到Python项目
6. 点击 "Deploy"

⏳ 等待2-3分钟...

✅ 部署完成！

### 第4步: 获取网址

Zeabur会给你一个域名:
```
https://gold-price-monitor-xxx.zeabur.app
```

**全球可访问，国内速度快！**

---

## 🌐 绑定自定义域名

1. Zeabur项目 → Settings → Domains
2. 添加你的域名
3. 在域名商添加CNAME记录

---

## 💰 费用

**免费额度:**
- 每月免费额度够用
- 超出后按使用量付费（很便宜）

---

## 🔄 自动更新

以后修改代码：
1. GitHub Desktop → Commit → Push
2. Zeabur自动重新部署

---

## ⚡ 立即开始

1. 访问 https://zeabur.com
2. GitHub登录
3. Create Project
4. 选择你的仓库
5. Deploy

**5分钟搞定！**
