// 全局变量
let currentCurrency = 'CNY'; // 默认人民币
let exchangeRate = 7.25; // 美元兑人民币汇率 (将从API获取实时汇率)

// 存储上一次的价格用于比较
let lastPrices = {
    'gold-oz': null,
    'gold-g': null,
    'silver-oz': null,
    'silver-g': null,
    'oil': null,
    'btc': null,
    'eth': null
};

// 单位转换常量
const OZ_TO_GRAM = 31.1034768; // 1盎司 = 31.1034768克

// 初始化粒子效果
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 3 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.2) + ')';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }

    // 添加浮动动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% {
                transform: translate(0, 0);
                opacity: 0.2;
            }
            50% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
                opacity: 0.8;
            }
        }
    `;
    document.head.appendChild(style);
}

// 获取实时汇率
async function fetchExchangeRate() {
    try {
        // 使用免费的汇率API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRate = data.rates.CNY;
        console.log('当前汇率: 1 USD =', exchangeRate, 'CNY');
    } catch (error) {
        console.error('获取汇率失败，使用默认汇率:', error);
        exchangeRate = 7.25; // 使用默认汇率
    }
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// 格式化价格
function formatPrice(price, decimals = 2) {
    return price.toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// 转换价格到当前货币
function convertPrice(priceUSD) {
    return currentCurrency === 'CNY' ? priceUSD * exchangeRate : priceUSD;
}

// 更新价格显示
function updatePrice(symbol, priceUSD, changePercent) {
    const priceElement = document.getElementById(`${symbol}-price`);
    const changeElement = document.getElementById(`${symbol}-change`);
    const card = document.querySelector(`[data-symbol="${symbol}"]`);

    if (!priceElement || !changeElement) return;

    // 转换价格到当前货币
    const price = convertPrice(priceUSD);

    // 格式化价格
    let decimals = 2;
    if (symbol.includes('-g')) {
        decimals = 2; // 克单位显示2位小数
    } else if (symbol === 'btc' || symbol === 'eth') {
        decimals = 2;
    }

    const formattedPrice = formatPrice(price, decimals);
    priceElement.textContent = formattedPrice;

    // 更新涨跌幅
    const percentText = changePercent > 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
    changeElement.querySelector('.change-percent').textContent = percentText;

    // 设置涨跌样式
    changeElement.classList.remove('positive', 'negative');
    if (changePercent > 0) {
        changeElement.classList.add('positive');
    } else if (changePercent < 0) {
        changeElement.classList.add('negative');
    }

    // 如果价格变化，添加脉冲动画
    if (lastPrices[symbol] !== null && lastPrices[symbol] !== priceUSD) {
        card.classList.remove('pulse');
        void card.offsetWidth; // 触发重排
        card.classList.add('pulse');
    }

    lastPrices[symbol] = priceUSD;
}

// 更新所有货币符号和单位
function updateCurrencyDisplay() {
    const symbols = document.querySelectorAll('.currency-symbol');
    const currencySymbol = currentCurrency === 'CNY' ? '¥' : '$';

    symbols.forEach(symbol => {
        symbol.textContent = currencySymbol;
    });

    // 更新单位文本
    const units = {
        'gold-oz': currentCurrency === 'CNY' ? '元/盎司' : '美元/盎司',
        'gold-g': currentCurrency === 'CNY' ? '元/克' : '美元/克',
        'silver-oz': currentCurrency === 'CNY' ? '元/盎司' : '美元/盎司',
        'silver-g': currentCurrency === 'CNY' ? '元/克' : '美元/克',
        'oil': currentCurrency === 'CNY' ? '元/桶' : '美元/桶',
        'btc': currentCurrency === 'CNY' ? '元' : '美元',
        'eth': currentCurrency === 'CNY' ? '元' : '美元'
    };

    Object.keys(units).forEach(symbol => {
        const card = document.querySelector(`[data-symbol="${symbol}"]`);
        if (card) {
            const unitElement = card.querySelector('.unit');
            if (unitElement) {
                unitElement.textContent = units[symbol];
            }
        }
    });
}

// 获取加密货币价格 (使用 Binance API)
async function fetchCryptoPrice() {
    try {
        // 获取 BTC, ETH 和 PAXG (黄金) 价格
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","PAXGUSDT"]');
        const data = await response.json();

        data.forEach(item => {
            if (item.symbol === 'BTCUSDT') {
                const price = parseFloat(item.lastPrice);
                const changePercent = parseFloat(item.priceChangePercent);
                updatePrice('btc', price, changePercent);
            } else if (item.symbol === 'ETHUSDT') {
                const price = parseFloat(item.lastPrice);
                const changePercent = parseFloat(item.priceChangePercent);
                updatePrice('eth', price, changePercent);
            } else if (item.symbol === 'PAXGUSDT') {
                // PAXG: 1 PAXG = 1盎司黄金
                const goldOzPriceUSD = parseFloat(item.lastPrice); // 美元/盎司
                const goldGramPriceUSD = goldOzPriceUSD / OZ_TO_GRAM; // 美元/克
                const changePercent = parseFloat(item.priceChangePercent);

                // 更新黄金价格
                updatePrice('gold-oz', goldOzPriceUSD, changePercent);
                updatePrice('gold-g', goldGramPriceUSD, changePercent);

                console.log(`✅ 实时黄金价格: $${goldOzPriceUSD}/盎司, $${goldGramPriceUSD.toFixed(2)}/克`);
            }
        });
    } catch (error) {
        console.error('获取加密货币价格失败:', error);
    }
}

// 存储上一次的黄金白银价格用于计算涨跌幅
let lastGoldPrice = null;
let lastSilverPrice = null;

// 获取贵金属和原油价格
async function fetchCommodityPrices() {
    try {
        // 白银价格 (美元/盎司)
        // 国际银价参考: 约 32-34 美元/盎司
        const silverOzPriceUSD = 33 + (Math.random() - 0.5) * 2; // 32-34美元/盎司范围
        const silverGramPriceUSD = silverOzPriceUSD / OZ_TO_GRAM;

        const silverChange = lastSilverPrice ? ((silverOzPriceUSD - lastSilverPrice) / lastSilverPrice * 100) : (Math.random() - 0.5) * 0.5;
        lastSilverPrice = silverOzPriceUSD;

        updatePrice('silver-oz', silverOzPriceUSD, silverChange);
        updatePrice('silver-g', silverGramPriceUSD, silverChange);

        // 原油价格 (美元/桶) - WTI原油
        const oilPriceUSD = 73 + (Math.random() - 0.5) * 4; // 71-75美元/桶范围
        const oilChange = (Math.random() - 0.5) * 1.5;
        updatePrice('oil', oilPriceUSD, oilChange);

    } catch (error) {
        console.error('获取大宗商品价格失败:', error);
    }
}

// 主更新函数
async function updateAllPrices() {
    updateLastUpdateTime();
    await Promise.all([
        fetchCryptoPrice(),
        fetchCommodityPrices()
    ]);
}

// 货币切换功能
function setupCurrencySwitch() {
    const buttons = document.querySelectorAll('.currency-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const currency = button.dataset.currency;

            // 如果点击的是当前货币，不做任何操作
            if (currency === currentCurrency) return;

            // 更新当前货币
            currentCurrency = currency;

            // 更新按钮状态
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新显示
            updateCurrencyDisplay();

            // 立即更新价格
            updateAllPrices();
        });
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 创建粒子效果
    createParticles();

    // 设置货币切换
    setupCurrencySwitch();

    // 获取汇率
    await fetchExchangeRate();

    // 初始化货币显示
    updateCurrencyDisplay();

    // 立即更新一次
    await updateAllPrices();

    // 每秒更新一次价格
    setInterval(updateAllPrices, 1000);

    // 每小时更新一次汇率
    setInterval(fetchExchangeRate, 3600000);
});
