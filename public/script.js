// 全局变量
const OZ_TO_GRAM = 31.1034768;
let currentCurrency = 'CNY';
let exchangeRate = 7.25; // USD to CNY 默认汇率
let previousPrices = {};

// API配置
const API_CONFIG = {
    // 生产环境使用相对路径，开发环境可以改为 'http://localhost:3000'
    baseURL: window.location.hostname === 'localhost' ? 'http://localhost:3000' : '',
    goldPricesEndpoint: '/api/prices',
    binanceEndpoint: 'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]',
    exchangeRateEndpoint: 'https://api.exchangerate-api.com/v4/latest/USD'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    setupCurrencySwitch();
    fetchExchangeRate();
    fetchAllPrices();

    // 每秒更新一次
    setInterval(fetchAllPrices, 1000);

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
        const response = await fetch(API_CONFIG.exchangeRateEndpoint);
        const data = await response.json();
        exchangeRate = data.rates.CNY || 7.25;
    } catch (error) {
        console.error('获取汇率失败:', error);
        exchangeRate = 7.25; // 使用默认汇率
    }
}

// 获取所有价格
async function fetchAllPrices() {
    await Promise.all([
        fetchGoldSilverPrices(),
        fetchCryptoPrices()
    ]);
    updateLastUpdateTime();
}

// 获取黄金白银价格（从Python API）
async function fetchGoldSilverPrices() {
    try {
        const response = await fetch(API_CONFIG.baseURL + API_CONFIG.goldPricesEndpoint);
        const result = await response.json();

        if (result.success && result.data) {
            const prices = {};

            // 解析数据
            result.data.forEach(item => {
                prices[item.code] = item.price;
            });

            // 黄金价格（克）
            const goldGramPrice = prices['AU9999_BUY'] || prices['AU9999'] || 971;
            updatePrice('gold-g', goldGramPrice, 0);

            // 黄金价格（盎司）
            const goldOzPrice = goldGramPrice * OZ_TO_GRAM;
            updatePrice('gold-oz', goldOzPrice, 0);

            // 白银价格（克）
            const silverGramPrice = prices['SILVER_BUY'] || prices['SILVER_TD'] || 11.76;
            updatePrice('silver-g', silverGramPrice, 0);

            // 白银价格（盎司）
            const silverOzPrice = silverGramPrice * OZ_TO_GRAM;
            updatePrice('silver-oz', silverOzPrice, 0);
        }
    } catch (error) {
        console.error('获取黄金白银价格失败:', error);
        // 使用默认价格
        updatePrice('gold-g', 971, 0);
        updatePrice('gold-oz', 971 * OZ_TO_GRAM, 0);
        updatePrice('silver-g', 11.76, 0);
        updatePrice('silver-oz', 11.76 * OZ_TO_GRAM, 0);
    }
}

// 获取加密货币价格（从币安）
async function fetchCryptoPrices() {
    try {
        const response = await fetch(API_CONFIG.binanceEndpoint);
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
        // 加密货币需要转换，贵金属已经是人民币
        if (symbol === 'btc' || symbol === 'eth') {
            displayPrice = priceUSD * exchangeRate;
            currencySymbol = '¥';
            unit = 'CNY';
        } else {
            // 黄金白银已经是人民币价格
            currencySymbol = '¥';
            unit = 'CNY';
        }
    } else {
        // 如果选择美元，黄金白银需要转换
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

        // 更新单位
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
        } else {
            // 基于价格变化显示
            const priceDiff = displayPrice - oldPrice;
            if (Math.abs(priceDiff) > 0.01) {
                const sign = priceDiff > 0 ? '+' : '';
                const pct = ((priceDiff / oldPrice) * 100).toFixed(2);
                percentElement.textContent = `${sign}${pct}%`;

                changeElement.className = 'change';
                if (priceDiff > 0) {
                    changeElement.classList.add('positive');
                    arrowElement.textContent = '↗';
                } else {
                    changeElement.classList.add('negative');
                    arrowElement.textContent = '↘';
                }
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
    fetchAllPrices();
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN');
    document.getElementById('lastUpdate').textContent = timeString;
}
