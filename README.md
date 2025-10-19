# 🌍 大宗商品实时价格监控

实时监控黄金、白银、比特币、以太坊价格，专业美观的价格展示界面。

## ✨ 功能特点

- 🔄 **实时更新**: 每秒自动刷新价格数据
- 📊 **6种商品**: 黄金(克/盎司)、白银(克/盎司)、BTC、ETH
- 💱 **货币切换**: 支持人民币/美元一键切换
- 📱 **响应式设计**: 完美适配手机、平板和桌面
- 🎨 **炫酷UI**: 粒子背景、发光动画、彩色光晕
- 📈 **涨跌显示**: 实时显示价格变化百分比
- 📞 **联系横幅**: 全来宾黄金源头回收电话 17777222219

## 🎯 数据来源

### 黄金/白银价格
- **来源**: 融通金实时WebSocket数据
- **更新频率**: 实时推送
- **价格类型**: 上海黄金99.99(买)、白银T+D(买)
- **单位**: 人民币/克

**示例价格:**
- 黄金: 971元/克
- 白银: 11.76元/克

### 加密货币
- **来源**: 币安API
- **更新频率**: 每秒
- **交易对**: BTC/USDT、ETH/USDT

## 🚀 快速部署

### 第一步: 上传到GitHub

使用 **GitHub Desktop**:

1. 打开GitHub Desktop
2. `File` → `New Repository`
3. Repository name: `commodity-price-monitor`
4. Local Path: 选择此项目文件夹
5. `Create Repository`
6. `Publish repository` → `Publish Repository`

### 第二步: 部署到Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. `Add New` → `Project`
4. 选择 `commodity-price-monitor` 仓库
5. 点击 `Deploy`

✅ **完成！获取你的网站链接**

### 第三步: 绑定域名(可选)

1. Vercel项目 → `Settings` → `Domains`
2. 输入你的域名
3. 按提示在域名商后台添加DNS记录

📖 **详细部署指南**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md)

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
├── DEPLOYMENT.md          # 详细部署指南
└── README.md              # 本文件
```

## 🔌 API端点

### `/api/prices`

获取实时黄金白银价格

**响应示例:**
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

## 🛠️ 本地开发

### 安装依赖
```bash
pip install -r requirements.txt
npm install -g vercel
```

### 运行本地服务器
```bash
cd D:\API\大宗商品价格监控
vercel dev
```

访问: http://localhost:3000

## 🔄 更新网站

使用 **GitHub Desktop**:

1. 修改代码
2. 打开GitHub Desktop
3. 填写Summary(例如: "更新价格API")
4. `Commit to main`
5. `Push origin`

✅ **Vercel会自动重新部署！**

## 🎨 自定义

### 修改联系电话

编辑 `public/index.html`:

```html
<a href="tel:17777222219" class="banner-phone">17777222219</a>
```

### 修改更新频率

编辑 `public/script.js`:

```javascript
// 从1秒改为5秒
setInterval(fetchAllPrices, 5000);
```

### 修改颜色主题

编辑 `public/styles.css`:

```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🧪 测试

### 测试API
```
https://你的域名/api/prices
```

应返回JSON格式的价格数据

### 测试主页
```
https://你的域名
```

应显示所有价格卡片并每秒更新

## 📊 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **后端**: Python (Vercel Serverless Function)
- **数据源**:
  - 融通金WebSocket (黄金/白银)
  - 币安API (BTC/ETH)
- **部署**: Vercel + GitHub

## 📝 注意事项

⚠️ **价格说明**:
- 黄金/白银价格为买入价，实际回收价可能有差异
- 价格仅供参考，不构成投资建议

⚠️ **WebSocket限制**:
- Vercel Serverless Function超时限制10秒
- API会缓存3秒内的数据避免频繁连接

## 📞 联系方式

**制作人**: Alpha8-阳光男孩

**回收电话**: 17777222219

**项目地址**: https://github.com/你的用户名/commodity-price-monitor

## 📄 许可证

MIT License

---

**祝你部署成功！** 🎉
