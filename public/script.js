// 全局变量
let currentCurrency = 'CNY';
let exchangeRate = 7.25; // USD to CNY
let goldPricePerGram = 971; // 黄金价格(人民币/克)
let silverPricePerGram = 11.76; // 白银价格(人民币/克)

// 实物价格参考(人民币)
const ITEMS = [
    { name: '猪脚饭', icon: '🍱', price: 18 },
    { name: 'KFC全家桶', icon: '🍗', price: 89 },
    { name: 'iPhone 17 Pro Max', icon: '📱', price: 9999 },
    { name: 'MacBook Air', icon: '💻', price: 7999 },
    { name: '劳力士手表', icon: '⌚', price: 60000 },
    { name: '小米SU7', icon: '🚗', price: 215900 },
    { name: '保时捷帕拉梅拉', icon: '🏎️', price: 970000 },
    { name: '法拉利罗马', icon: '🏁', price: 2380000 },
    { name: '喜茶', icon: '🍵', price: 25 },
    { name: '星巴克', icon: '☕', price: 35 },
    { name: '海底捞', icon: '🍲', price: 120 },
    { name: 'AirPods Pro', icon: '🎧', price: 1999 }
];

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
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRate = data.rates.CNY || 7.25;
    } catch (error) {
        console.error('获取汇率失败:', error);
        exchangeRate = 7.25;
    }
}

// 获取所有价格
async function fetchAllPrices() {
    await Promise.all([
        fetchGoldSilverPrices(),
        fetchCryptoPrices()
    ]);
    updateConverter();
    updateLastUpdateTime();
}

// 获取黄金白银价格
async function fetchGoldSilverPrices() {
    try {
        const response = await fetch('/api/prices');
        const result = await response.json();

        if (result.success && result.data) {
            const prices = {};

            result.data.forEach(item => {
                prices[item.symbol] = item.price;
            });

            // 黄金价格（克）
            goldPricePerGram = prices['AU9999'] || prices['AU9999_BUY'] || 971;
            updatePrice('gold-g', goldPricePerGram, 0);

            // 白银价格（克）
            silverPricePerGram = prices['ASILVER_TD'] || prices['SILVER_BUY'] || 11.76;
            updatePrice('silver-g', silverPricePerGram, 0);
        }
    } catch (error) {
        console.error('获取黄金白银价格失败:', error);
        goldPricePerGram = 971;
        silverPricePerGram = 11.76;
        updatePrice('gold-g', goldPricePerGram, 0);
        updatePrice('silver-g', silverPricePerGram, 0);
    }
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

    let displayPrice = priceUSD;
    let currencySymbol = '¥';
    let unit = 'CNY';

    if (currentCurrency === 'USD') {
        // 如果是黄金白银，需要从人民币转换为美元
        if (symbol === 'gold-g' || symbol === 'silver-g') {
            displayPrice = priceUSD / exchangeRate;
            currencySymbol = '$';
            unit = 'USD';
        } else {
            // BTC/ETH 已经是美元
            currencySymbol = '$';
            unit = 'USDT';
        }
    } else {
        // CNY
        if (symbol === 'btc' || symbol === 'eth') {
            // 加密货币转换为人民币
            displayPrice = priceUSD * exchangeRate;
            currencySymbol = '¥';
            unit = 'CNY';
        } else {
            // 黄金白银已经是人民币
            currencySymbol = '¥';
            unit = 'CNY';
        }
    }

    // 格式化价格
    const formattedPrice = displayPrice < 10
        ? displayPrice.toFixed(4)
        : displayPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    if (changeElement && changePercent !== undefined && changePercent !== 0) {
        const percentElement = changeElement.querySelector('.change-percent');
        const arrowElement = changeElement.querySelector('.change-arrow');

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

// 更新等价兑换模拟器
function updateConverter() {
    const grid = document.getElementById('converterGrid');
    if (!grid) return;

    grid.innerHTML = '';

    ITEMS.forEach(item => {
        const quantity = (goldPricePerGram / item.price).toFixed(2);

        const card = document.createElement('div');
        card.className = 'converter-card';
        card.innerHTML = `
            <div class="converter-icon">${item.icon}</div>
            <div class="converter-name">${item.name}</div>
            <div class="converter-value">${quantity}</div>
            <div class="converter-unit">个</div>
        `;
        grid.appendChild(card);
    });
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
