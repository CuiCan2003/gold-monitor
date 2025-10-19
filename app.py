# -*- coding: utf-8 -*-
"""
简单的Flask API - 使用你已经成功的爬虫代码
"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import threading
import time
from 融通金获取价格 import Monitor, decode_frame_to_json_line
import json

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# 全局价格缓存
price_data = {}
last_update_time = None

class PriceCollector(Monitor):
    """继承你的Monitor类，收集价格到缓存"""

    def on_message(self, ws, message):
        global price_data, last_update_time

        if isinstance(message, (bytes, bytearray)):
            lines = decode_frame_to_json_line(bytes(message))
            for line in lines:
                try:
                    data = json.loads(line)
                    # 存储到缓存
                    price_data[data['symbol']] = data
                    last_update_time = data['time']
                    print(f"[更新] {data['name_cn']}: {data['price']} {data['unit']}")
                except:
                    pass

# 全局监控实例
collector = None
monitor_thread = None

def start_monitor():
    """延迟启动监控（避免构建时连接）"""
    global collector, monitor_thread
    if collector is None:
        collector = PriceCollector()
        monitor_thread = threading.Thread(target=collector.run, daemon=True)
        monitor_thread.start()
        print("✅ WebSocket 监控已启动")

@app.route('/')
def index():
    """主页"""
    return send_from_directory('public', 'index.html')

@app.route('/api/prices')
def get_prices():
    """获取所有价格"""
    # 第一次请求时才启动监控
    start_monitor()

    return jsonify({
        "success": True,
        "data": list(price_data.values()),
        "last_update": last_update_time,
        "count": len(price_data)
    })

@app.route('/api/price/<symbol>')
def get_price(symbol):
    """获取单个价格"""
    if symbol in price_data:
        return jsonify({
            "success": True,
            "data": price_data[symbol]
        })
    else:
        return jsonify({
            "success": False,
            "error": "Symbol not found"
        }), 404

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 大宗商品价格监控启动中...")
    print("=" * 60)
    print("🌐 API: http://localhost:5000/api/prices")
    print("🏠 网站: http://localhost:5000")
    print("=" * 60)

    # 本地运行时立即启动监控
    start_monitor()
    time.sleep(2)  # 等待收集一些数据

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
