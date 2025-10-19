// GitHub Pages版本 - 前端直接连接WebSocket
// 无需后端服务器！

const WS_URL = "wss://rtjwbqt.jzj9999.com:8443/gateway";

// WebSocket订阅帧
const SUBSCRIBE_FRAMES_BASE64 = [
    "CCAQACIpKicKA3J0ahIgPdX5OFO8hZACi+4KB1GxoChgPLeNG10XJssXirgw9pg=",
    "CEIQAkICe30=",
    "CEAQBEICe30=",
    "CBIQBiL5AQoHQXU5OS45OQoHQXUoVCtEKQoJSlpKX2F1X1BTCglKWkpfYXVfUEIKCUpaSl9hZ19QUwoJSlpKX2FnX1BCCglKWkpfcHRfUFMKCUpaSl9wdF9QQgoJSlpKX3BkX1BTCglKWkpfcGRfUEIKCVJIX0paTF9QUwoJUkhfSlpMX1BCCglKWkpfSVJfUFMKCUpaSl9JUl9QQgoJSlpKX1JVX1BTCglKWkpfUlVfUEIKB0FnKFQrRCkKB1B0OTkuOTUKBEdMTkMKBFBMTkMKBFBBTkMKBFNMTkMKAlJICgNYQVUKA1hBRwoDWEFQCgNYUEQKBlVTRENOSBIBAA==",
    "CBwQCCIFCgNSVEo=",
];

// 品种映射
const SYMBOL_MAP = {
    "Au99.99": { code: "AU9999", cn: "黄金", unit: "CNY/g", range: [100, 2000] },
    "JZJ_au_PB": { code: "AU9999_BUY", cn: "黄金(买)", unit: "CNY/g", range: [100, 2000] },
    "JZJ_au_PS": { code: "AU9999_SELL", cn: "黄金(卖)", unit: "CNY/g", range: [100, 2000] },
    "Ag(T+D)": { code: "SILVER_TD", cn: "白银T+D", unit: "CNY/g", range: [3, 50] },
    "JZJ_ag_PB": { code: "SILVER_BUY", cn: "白银(买)", unit: "CNY/g", range: [3, 50] },
    "JZJ_ag_PS": { code: "SILVER_SELL", cn: "白银(卖)", unit: "CNY/g", range: [3, 50] },
    "XAU": { code: "XAUUSD", cn: "国际黄金", unit: "USD/oz", range: [900, 4000] },
    "XAG": { code: "XAGUSD", cn: "国际白银", unit: "USD/oz", range: [5, 100] },
};

// 全局变量
const OZ_TO_GRAM = 31.1034768;
let currentCurrency = 'CNY';
let exchangeRate = 7.25;
let previousPrices = {};
let ws = null;
let reconnectTimer = null;
let priceCache = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    setupCurrencySwitch();
    fetchExchangeRate();
    connectWebSocket();
    fetchCryptoPrices();

    // 每30秒更新加密货币价格
    setInterval(fetchCryptoPrices, 30000);

    // 每小时更新汇率
    setInterval(fetchExchangeRate, 3600000);
});

// 创建粒子效果
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(particle);
    }
}

// 货币切换
function setupCurrencySwitch() {
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCurrency = btn.dataset.currency;
            updateAllDisplays();
        });
    });
}

// 获取汇率
async function fetchExchangeRate() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRate = data.rates.CNY || 7.25;
    } catch (error) {
        console.error('获取汇率失败:', error);
        exchangeRate = 7.25;
    }
}

// Base64解码
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// 解析品种名称
function extractSymbol(frame) {
    const uint8 = new Uint8Array(frame);
    let i = 0;

    while (i < uint8.length - 2) {
        if (uint8[i] === 0x0A) { // '\n'
            const length = uint8[i + 1];
            const j = i + 2;
            const k = j + length;

            if (length > 0 && length <= 40 && k <= uint8.length) {
                try {
                    const str = String.fromCharCode(...uint8.slice(j, k));
                    if (str.length >= 2 && str.length <= 20 && /^[a-zA-Z0-9._+\-()\/]+$/.test(str)) {
                        return str;
                    }
                } catch (e) {}
            }
            i = k;
        } else {
            i++;
        }
    }

    // 兜底：查找已知品种
    const frameStr = String.fromCharCode(...uint8);
    for (const key of Object.keys(SYMBOL_MAP)) {
        if (frameStr.includes(key)) {
            return key;
        }
    }

    return null;
}

// 解析double值
function unpackDoubles(frame) {
    const uint8 = new Uint8Array(frame);
    const doubles = [];
    const view = new DataView(frame);

    for (let i = 0; i <= uint8.length - 8; i++) {
        try {
            const value = view.getFloat64(i, true); // little-endian
            if (isFinite(value)) {
                doubles.push(value);
            }
        } catch (e) {}
    }

    return doubles;
}

// 选择合适的价格
function choosePrice(symbolKey, doubles) {
    const info = SYMBOL_MAP[symbolKey];
    if (!info) return null;

    const [low, high] = info.range;
    for (const value of doubles) {
        if (value >= low && value <= high) {
            return value;
        }
    }
    return null;
}

// 解析帧数据
function decodeFrame(frame) {
    const symbol = extractSymbol(frame);
    if (!symbol || !SYMBOL_MAP[symbol]) return null;

    const info = SYMBOL_MAP[symbol];
    const doubles = unpackDoubles(frame);
    const price = choosePrice(symbol, doubles);

    if (price === null) return null;

    return {
        code: info.code,
        name: info.cn,
        price: parseFloat(price.toFixed(2)),
        unit: info.unit
    };
}

// 连接WebSocket
function connectWebSocket() {
    console.log('正在连接WebSocket...');

    try {
        ws = new WebSocket(WS_URL);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log('✅ WebSocket连接成功');

            // 发送订阅帧
            SUBSCRIBE_FRAMES_BASE64.forEach((b64, index) => {
                setTimeout(() => {
                    ws.send(base64ToArrayBuffer(b64));
                }, index * 100);
            });
        };

        ws.onmessage = (event) => {
            if (event.data instanceof ArrayBuffer) {
                const data = decodeFrame(event.data);
                if (data) {
                    console.log(`📊 ${data.name}: ${data.price} ${data.unit}`);
                    priceCache[data.code] = data;
                    updateGoldSilverPrices();
                }
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket错误:', error);
        };

        ws.onclose = () => {
            console.log('⚠️ WebSocket连接关闭，5秒后重连...');
            reconnectTimer = setTimeout(connectWebSocket, 5000);
        };

    } catch (error) {
        console.error('连接失败:', error);
        reconnectTimer = setTimeout(connectWebSocket, 5000);
    }
}

// 更新黄金白银价格
function updateGoldSilverPrices() {
    // 黄金(克)
    const goldGramPrice = priceCache['AU9999_BUY']?.price || priceCache['AU9999']?.price || 971;
    updatePrice('gold-g', goldGramPrice, 0);

    // 黄金(盎司)
    const goldOzPrice = goldGramPrice * OZ_TO_GRAM;
    updatePrice('gold-oz', goldOzPrice, 0);

    // 白银(克)
    const silverGramPrice = priceCache['SILVER_BUY']?.price || priceCache['SILVER_TD']?.price || 11.76;
    updatePrice('silver-g', silverGramPrice, 0);

    // 白银(盎司)
    const silverOzPrice = silverGramPrice * OZ_TO_GRAM;
    updatePrice('silver-oz', silverOzPrice, 0);

    updateLastUpdateTime();
}

// 获取加密货币价格
async function fetchCryptoPrices() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]');
        const data = await response.json();

        data.forEach(item => {
            const symbol = item.symbol;
            const price = parseFloat(item.lastPrice);
            const changePercent = parseFloat(item.priceChangePercent);

            if (symbol === 'BTCUSDT') {
                updatePrice('btc', price, changePercent);
            } else if (symbol === 'ETHUSDT') {
                updatePrice('eth', price, changePercent);
            }
        });
    } catch (error) {
        console.error('获取加密货币价格失败:', error);
    }
}

// 更新单个价格
function updatePrice(symbol, priceUSD, changePercent) {
    const priceElement = document.getElementById(`${symbol}-price`);
    const changeElement = document.getElementById(`${symbol}-change`);

    if (!priceElement) return;

    // 根据当前货币显示价格
    let displayPrice = priceUSD;
    let currencySymbol = '$';
    let unit = 'USD';

    if (currentCurrency === 'CNY') {
        if (symbol === 'btc' || symbol === 'eth') {
            displayPrice = priceUSD * exchangeRate;
            currencySymbol = '¥';
            unit = 'CNY';
        } else {
            currencySymbol = '¥';
            unit = 'CNY';
        }
    } else {
        if (symbol.includes('gold') || symbol.includes('silver')) {
            displayPrice = priceUSD / exchangeRate;
            currencySymbol = '$';
            unit = 'USD';
        }
    }

    // 存储原始价格用于比较
    const oldPrice = previousPrices[symbol] || displayPrice;
    previousPrices[symbol] = displayPrice;

    // 格式化价格
    const formattedPrice = displayPrice < 10
        ? displayPrice.toFixed(4)
        : displayPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 更新价格
    priceElement.textContent = formattedPrice;

    // 更新货币符号
    const card = priceElement.closest('.price-card');
    if (card) {
        const currencySymbolElement = card.querySelector('.currency-symbol');
        if (currencySymbolElement) {
            currencySymbolElement.textContent = currencySymbol;
        }

        const unitElement = card.querySelector('.unit');
        if (unitElement && (symbol === 'btc' || symbol === 'eth')) {
            unitElement.textContent = unit;
        }
    }

    // 更新涨跌幅
    if (changeElement) {
        const percentElement = changeElement.querySelector('.change-percent');
        const arrowElement = changeElement.querySelector('.change-arrow');

        if (changePercent !== undefined && changePercent !== 0) {
            const sign = changePercent > 0 ? '+' : '';
            percentElement.textContent = `${sign}${changePercent.toFixed(2)}%`;

            changeElement.className = 'change';
            if (changePercent > 0) {
                changeElement.classList.add('positive');
                arrowElement.textContent = '↗';
            } else {
                changeElement.classList.add('negative');
                arrowElement.textContent = '↘';
            }
        }
    }

    // 价格变化动画
    if (Math.abs(displayPrice - oldPrice) > 0.01) {
        priceElement.classList.add('price-flash');
        setTimeout(() => priceElement.classList.remove('price-flash'), 500);
    }
}

// 更新所有显示
function updateAllDisplays() {
    updateGoldSilverPrices();
    fetchCryptoPrices();
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN');
    document.getElementById('lastUpdate').textContent = timeString;
}

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
});
