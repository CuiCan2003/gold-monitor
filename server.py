# -*- coding: utf-8 -*-
"""
Flask服务器版本 - 直接在你的服务器上运行
访问: http://你的IP:5000
"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import base64
import json
import math
import ssl
import struct
import threading
import time
from datetime import datetime, timezone, timedelta
import websocket

app = Flask(__name__, static_folder='../public', static_url_path='')
CORS(app)  # 允许跨域

WS_URL = "wss://rtjwbqt.jzj9999.com:8443/gateway"

SUBSCRIBE_FRAMES_BASE64 = [
    "CCAQACIpKicKA3J0ahIgPdX5OFO8hZACi+4KB1GxoChgPLeNG10XJssXirgw9pg=",
    "CEIQAkICe30=",
    "CEAQBEICe30=",
    "CBIQBiL5AQoHQXU5OS45OQoHQXUoVCtEKQoJSlpKX2F1X1BTCglKWkpfYXVfUEIKCUpaSl9hZ19QUwoJSlpKX2FnX1BCCglKWkpfcHRfUFMKCUpaSl9wdF9QQgoJSlpKX3BkX1BTCglKWkpfcGRfUEIKCVJIX0paTF9QUwoJUkhfSlpMX1BCCglKWkpfSVJfUFMKCUpaSl9JUl9QQgoJSlpKX1JVX1BTCglKWkpfUlVfUEIKB0FnKFQrRCkKB1B0OTkuOTUKBEdMTkMKBFBMTkMKBFBBTkMKBFNMTkMKAlJICgNYQVUKA1hBRwoDWEFQCgNYUEQKBlVTRENOSBIBAA==",
    "CBwQCCIFCgNSVEo=",
]

EXTRA_HEADERS = [
    "Origin: https://i.jzj9999.com",
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
]

SYMBOL_MAP = {
    "Au99.99": {"code": "AU9999", "cn": "黄金", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "JZJ_au_PB": {"code": "AU9999_BUY", "cn": "黄金(买)", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "JZJ_au_PS": {"code": "AU9999_SELL", "cn": "黄金(卖)", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "Ag(T+D)": {"code": "SILVER_TD", "cn": "白银T+D", "unit": "CNY/g", "rng": (3.0, 50.0)},
    "JZJ_ag_PB": {"code": "SILVER_BUY", "cn": "白银(买)", "unit": "CNY/g", "rng": (3.0, 50.0)},
    "JZJ_ag_PS": {"code": "SILVER_SELL", "cn": "白银(卖)", "unit": "CNY/g", "rng": (3.0, 50.0)},
    "XAU": {"code": "XAUUSD", "cn": "国际黄金", "unit": "USD/oz", "rng": (900.0, 4000.0)},
    "XAG": {"code": "XAGUSD", "cn": "国际白银", "unit": "USD/oz", "rng": (5.0, 100.0)},
}

CST = timezone(timedelta(hours=8))

# 全局价格缓存
price_cache = {}
last_update = None
cache_lock = threading.Lock()

def b64bytes(s: str) -> bytes:
    return base64.b64decode(s)

def beijing_now_str() -> str:
    return datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S")

def _extract_symbol(frame: bytes) -> str | None:
    i = 0
    while i < len(frame) - 2:
        if frame[i] == 0x0A:
            length = frame[i + 1]
            j = i + 2
            k = j + length
            if 0 <= length <= 40 and k <= len(frame):
                try:
                    s = frame[j:k].decode("ascii", errors="ignore")
                    if 2 <= len(s) <= 20 and all(ch.isalnum() or ch in "._+-()/" for ch in s):
                        return s
                except Exception:
                    pass
            i = k
        else:
            i += 1
    for key in SYMBOL_MAP.keys():
        if key.encode("ascii") in frame:
            return key
    return None

def _unpack_doubles_le(frame: bytes, step: int = 8) -> list[float]:
    vals = []
    for i in range(0, len(frame) - 7, step):
        try:
            v = struct.unpack_from("<d", frame, i)[0]
            if math.isfinite(v):
                vals.append(v)
        except Exception:
            pass
    return vals

def _choose_price(symbol_key: str, doubles: list[float]) -> float | None:
    info = SYMBOL_MAP.get(symbol_key)
    if not info:
        return None
    lo, hi = info["rng"]
    for v in doubles:
        if lo <= v <= hi:
            return float(v)
    return None

def decode_frame(frame: bytes) -> dict | None:
    symbol_key = _extract_symbol(frame)
    if not symbol_key or symbol_key not in SYMBOL_MAP:
        return None

    info = SYMBOL_MAP[symbol_key]
    doubles = _unpack_doubles_le(frame)
    price = _choose_price(symbol_key, doubles)

    if price is None:
        return None

    return {
        "code": info["code"],
        "name": info["cn"],
        "price": round(price, 2),
        "unit": info["unit"],
        "timestamp": beijing_now_str()
    }

class PriceMonitor:
    def __init__(self):
        self.ws = None
        self.stop_flag = False
        self.thread = None

    def start(self):
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def run(self):
        while not self.stop_flag:
            try:
                self.ws = websocket.WebSocketApp(
                    WS_URL,
                    header=EXTRA_HEADERS,
                    on_open=self.on_open,
                    on_message=self.on_message,
                    on_error=self.on_error,
                    on_close=self.on_close,
                )
                self.ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
            except Exception as e:
                print(f"WebSocket error: {e}")
            time.sleep(2)

    def on_open(self, ws):
        print(f"[{beijing_now_str()}] WebSocket连接成功")
        for b64 in SUBSCRIBE_FRAMES_BASE64:
            ws.send(b64bytes(b64), opcode=websocket.ABNF.OPCODE_BINARY)
            time.sleep(0.1)

    def on_message(self, ws, message):
        if isinstance(message, (bytes, bytearray)):
            data = decode_frame(bytes(message))
            if data:
                with cache_lock:
                    global price_cache, last_update
                    price_cache[data["code"]] = data
                    last_update = beijing_now_str()
                print(f"[{beijing_now_str()}] 更新价格: {data['name']} = {data['price']} {data['unit']}")

    def on_error(self, ws, error):
        print(f"[{beijing_now_str()}] WebSocket错误: {error}")

    def on_close(self, ws, code, reason):
        print(f"[{beijing_now_str()}] WebSocket关闭: {code} - {reason}")

# 启动价格监控
monitor = PriceMonitor()
monitor.start()

# API路由
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/prices')
def get_prices():
    with cache_lock:
        return jsonify({
            "success": True,
            "data": list(price_cache.values()),
            "last_update": last_update,
            "timestamp": beijing_now_str()
        })

@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "cached_prices": len(price_cache),
        "last_update": last_update
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 大宗商品价格监控服务器启动中...")
    print("=" * 60)
    print(f"📅 启动时间: {beijing_now_str()}")
    print(f"🌐 访问地址: http://localhost:5000")
    print(f"📊 API地址: http://localhost:5000/api/prices")
    print("=" * 60)

    # 等待WebSocket连接建立
    time.sleep(3)

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
