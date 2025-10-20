# -*- coding: utf-8 -*-
"""
简单的Flask API - 使用jzj9999 API获取价格
"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import time

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# API地址
JZJ_API_URL = 'https://i.jzj9999.com/res/quote/pq.json'

# 价格缓存
price_cache = {
    'gold': None,
    'silver': None,
    'last_update': None
}

def fetch_jzj_prices():
    """从jzj9999 API获取价格"""
    try:
        response = requests.get(JZJ_API_URL, timeout=5, headers={
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        })

        if response.status_code == 200:
            data = response.json()

            if data.get('result') == 0 and data.get('items'):
                prices = {}

                for item in data['items']:
                    code = item.get('code', '')

                    # 黄金9999 - 买价
                    if code == 'Au99.99' or code == 'JZJ_au':
                        bid_price = item.get('bidprice')
                        if bid_price:
                            prices['gold'] = float(bid_price)

                    # 白银 - 买价
                    if code == 'Ag(T+D)' or code == 'JZJ_ag':
                        bid_price = item.get('bidprice')
                        if bid_price:
                            prices['silver'] = float(bid_price)

                if prices:
                    price_cache['gold'] = prices.get('gold', price_cache['gold'])
                    price_cache['silver'] = prices.get('silver', price_cache['silver'])
                    price_cache['last_update'] = time.time()
                    print(f"✅ 价格更新: 黄金={price_cache['gold']}, 白银={price_cache['silver']}")
                    return True

        return False

    except Exception as e:
        print(f"❌ 获取价格失败: {e}")
        return False

@app.route('/')
def index():
    """主页"""
    return send_from_directory('public', 'index.html')

@app.route('/api/prices')
def get_prices():
    """获取所有价格 - 每次请求都刷新"""
    # 每次请求都获取最新价格
    fetch_jzj_prices()

    # 构建返回数据（兼容前端格式）
    result = []

    if price_cache['gold']:
        result.append({
            'symbol': 'AU9999',
            'price': price_cache['gold'],
            'name': '黄金9999'
        })

    if price_cache['silver']:
        result.append({
            'symbol': 'ASILVER_TD',
            'price': price_cache['silver'],
            'name': '白银T+D'
        })

    return jsonify({
        "success": True,
        "data": result,
        "last_update": price_cache['last_update']
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 大宗商品价格监控启动中...")
    print("=" * 60)
    print("🌐 API: http://localhost:5000/api/prices")
    print("🏠 网站: http://localhost:5000")
    print("=" * 60)

    # 启动时获取一次价格
    fetch_jzj_prices()

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
