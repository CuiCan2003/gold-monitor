# 融通金网站 API 接口分析指南

## 📋 手动抓包步骤

由于该网站使用了前端框架(可能是Vue.js),价格数据通过异步API加载,需要使用浏览器开发者工具进行抓包:

### 方法一: Chrome 开发者工具 (推荐)

1. **打开网站**
   - 访问: https://i.jzj9999.com/quoteh5/?ivk_sa=1025883i

2. **打开开发者工具**
   - 按 `F12` 或右键 → 检查

3. **切换到 Network (网络) 标签**
   - 点击顶部的 "Network" 标签

4. **过滤请求**
   - 在过滤框中输入: `XHR` 或 `Fetch`
   - 或者搜索关键词: `quote`, `price`, `gold`, `api`

5. **刷新页面**
   - 按 `Ctrl+R` 或 `F5` 刷新

6. **查找API请求**
   - 查看请求列表,找到返回JSON数据的请求
   - 点击请求,查看 "Response" (响应) 标签页
   - 如果看到黄金、白银价格数据,就找到了!

7. **复制API地址**
   - 右键点击请求 → Copy → Copy URL

---

## 🔍 常见API模式

基于类似网站的经验,可能的接口格式:

```
https://i.jzj9999.com/api/quote
https://i.jzj9999.com/api/quotation
https://i.jzj9999.com/api/price/latest
https://api.jzj9999.com/v1/quote
https://www.jzj9999.com/api/gold/price
```

---

## 💡 快速测试方法

### 使用 curl 命令测试 (Windows PowerShell)

```powershell
# 测试可能的接口1
Invoke-WebRequest -Uri "https://i.jzj9999.com/api/quote" | Select-Object -Expand Content

# 测试可能的接口2
Invoke-WebRequest -Uri "https://api.jzj9999.com/quote" | Select-Object -Expand Content
```

### 使用浏览器直接访问

在浏览器地址栏尝试访问:
- https://i.jzj9999.com/api/quote
- https://i.jzj9999.com/api/price
- https://i.jzj9999.com/api/gold

如果返回JSON数据,就找到了!

---

## 📱 移动端抓包工具

如果网站有反爬虫机制,可以使用:

1. **Fiddler** - Windows抓包工具
2. **Charles Proxy** - Mac/Windows抓包工具
3. **Wireshark** - 专业网络分析工具

---

## 🎯 分析要点

找到API后,注意观察:

1. **请求方法**: GET 还是 POST
2. **请求头**: 是否需要特殊的 headers (如 token, user-agent)
3. **参数**: URL参数或请求体参数
4. **响应格式**: JSON数据结构
5. **更新频率**: 数据多久更新一次

---

## 📝 示例API响应格式

通常贵金属价格API返回类似这样的数据:

```json
{
  "code": 200,
  "data": {
    "gold": {
      "price": 951.20,
      "unit": "元/克",
      "change": "+2.5%"
    },
    "silver": {
      "price": 10.50,
      "unit": "元/克",
      "change": "-0.8%"
    }
  },
  "timestamp": 1736812800
}
```

---

## 🚀 找到接口后怎么办?

1. **记录完整的URL**
2. **测试是否需要认证**
3. **查看CORS策略** (是否允许跨域访问)
4. **集成到你的网站**

---

## ⚠️ 注意事项

1. **尊重网站的robots.txt和服务条款**
2. **控制请求频率,避免给服务器造成压力**
3. **某些API可能需要API密钥或认证**
4. **数据可能有版权,请合理使用**

---

## 🔧 集成示例

找到API后,可以这样集成到你的代码:

```javascript
async function fetchGoldPrice() {
    try {
        const response = await fetch('API_URL_HERE');
        const data = await response.json();

        // 根据实际的数据结构提取价格
        const goldPrice = data.data.gold.price;
        const silverPrice = data.data.silver.price;

        updatePrice('gold-g', goldPrice, 0);
        updatePrice('silver-g', silverPrice, 0);
    } catch (error) {
        console.error('获取价格失败:', error);
    }
}
```

---

需要我帮你分析吗?请把你在开发者工具中找到的API URL发给我!
