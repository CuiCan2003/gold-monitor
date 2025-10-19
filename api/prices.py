# -*- coding: utf-8 -*-
"""
Vercel Serverless Function - 获取实时黄金白银价格
通过WebSocket获取融通金的实时数据
"""
import base64
import json
import math
import ssl
import struct
import time
from datetime import datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler
import websocket

WS_URL = "wss://rtjwbqt.jzj9999.com:8443/gateway"

# WebSocket订阅帧（Base64编码）
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

# 品种映射
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

# 全局价格缓存
price_cache = {}
last_update = None

def fetch_prices_ws():
    """通过WebSocket获取实时价格"""
    global price_cache, last_update

    collected = []

    def on_message(ws, message):
        if isinstance(message, (bytes, bytearray)):
            data = decode_frame(bytes(message))
            if data:
                collected.append(data)
                # 收集到足够数据后关闭连接
                if len(collected) >= 6:
                    ws.close()

    def on_open(ws):
        for b64 in SUBSCRIBE_FRAMES_BASE64:
            ws.send(b64bytes(b64), opcode=websocket.ABNF.OPCODE_BINARY)
            time.sleep(0.1)

    try:
        ws = websocket.WebSocketApp(
            WS_URL,
            header=EXTRA_HEADERS,
            on_open=on_open,
            on_message=on_message
        )
        ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE}, timeout=5)

        # 更新缓存
        for item in collected:
            price_cache[item["code"]] = item
        last_update = beijing_now_str()

        return collected
    except Exception as e:
        print(f"WebSocket error: {e}")
        return []

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global price_cache, last_update

        # CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        # 如果缓存超过3秒，重新获取
        if not last_update or (datetime.now(CST) - datetime.strptime(last_update, "%Y-%m-%d %H:%M:%S").replace(tzinfo=CST)).total_seconds() > 3:
            fetch_prices_ws()

        response = {
            "success": True,
            "data": list(price_cache.values()),
            "last_update": last_update,
            "timestamp": beijing_now_str()
        }

        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
