# -*- coding: utf-8 -*-
import base64
import json
import math
import ssl
import struct
import threading
import time
from datetime import datetime, timezone, timedelta

import websocket

WS_URL = "wss://rtjwbqt.jzj9999.com:8443/gateway"

# —— 你提供的 5 条 Outgoing（二进制）按顺序发出：
SUBSCRIBE_FRAMES_BASE64 = [
    "CCAQACIpKicKA3J0ahIgPdX5OFO8hZACi+4KB1GxoChgPLeNG10XJssXirgw9pg=",  # 47B
    "CEIQAkICe30=",                                                          # 8B
    "CEAQBEICe30=",                                                          # 8B
    "CBIQBiL5AQoHQXU5OS45OQoHQXUoVCtEKQoJSlpKX2F1X1BTCglKWkpfYXVfUEIKCUpaSl9hZ19QUwoJSlpKX2FnX1BCCglKWkpfcHRfUFMKCUpaSl9wdF9QQgoJSlpKX3BkX1BTCglKWkpfcGRfUEIKCVJIX0paTF9QUwoJUkhfSlpMX1BCCglKWkpfSVJfUFMKCUpaSl9JUl9QQgoJSlpKX1JVX1BTCglKWkpfUlVfUEIKB0FnKFQrRCkKB1B0OTkuOTUKBEdMTkMKBFBMTkMKBFBBTkMKBFNMTkMKAlJICgNYQVUKA1hBRwoDWEFQCgNYUEQKBlVTRENOSBIBAA==",  # 256B
    "CBwQCCIFCgNSVEo=",                                                      # 11B
]

# 头信息（如需可加 Cookie）
EXTRA_HEADERS = [
    "Origin: https://i.jzj9999.com",
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
]

# 目标品种映射（服务端帧里的“品种名” -> 规范代码/中文名/单位与数值范围）
SYMBOL_MAP = {
    # 人民币/克
    "Au99.99": {"code": "AU9999", "cn": "上海黄金99.99", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "Au(T+D)": {"code": "AGOLD_TD", "cn": "黄金T+D", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "Ag(T+D)": {"code": "ASILVER_TD", "cn": "白银T+D", "unit": "CNY/g", "rng": (3.0, 50.0)},
    "Pt99.95": {"code": "PT", "cn": "铂金99.95", "unit": "CNY/g", "rng": (100.0, 1500.0)},
    # 国际金银（美元/盎司）
    "XAU": {"code": "XAUUSD", "cn": "国际黄金", "unit": "USD/oz", "rng": (900.0, 4000.0)},
    "XAG": {"code": "XAGUSD", "cn": "国际白银", "unit": "USD/oz", "rng": (5.0, 100.0)},
    # 站内自定义前缀（买/卖价帧），取中间参考价
    "JZJ_au_PS": {"code": "AU9999", "cn": "上海黄金99.99(卖)", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "JZJ_au_PB": {"code": "AU9999", "cn": "上海黄金99.99(买)", "unit": "CNY/g", "rng": (100.0, 2000.0)},
    "JZJ_ag_PS": {"code": "ASILVER_TD", "cn": "白银T+D(卖)", "unit": "CNY/g", "rng": (3.0, 50.0)},
    "JZJ_ag_PB": {"code": "ASILVER_TD", "cn": "白银T+D(买)", "unit": "CNY/g", "rng": (3.0, 50.0)},
    # 铂钯（有时也以 XAP/XPD/XPT 出现，做兼容）
    "XAP": {"code": "XPTUSD", "cn": "国际铂金", "unit": "USD/oz", "rng": (300.0, 2000.0)},
    "XPD": {"code": "XPDUSD", "cn": "国际钯金", "unit": "USD/oz", "rng": (400.0, 4000.0)},
    "Pt": {"code": "PT", "cn": "铂金", "unit": "CNY/g", "rng": (100.0, 1500.0)},
    "Pd": {"code": "PD", "cn": "钯金", "unit": "CNY/g", "rng": (100.0, 2000.0)},
}

# 只输出这些规范代码（你要的清单）
WHITELIST_CODES = {"AU9999", "ASILVER_TD", "PT", "PD", "XAUUSD", "XAGUSD", "XPTUSD", "XPDUSD"}

# 北京时间
CST = timezone(timedelta(hours=8))


def b64bytes(s: str) -> bytes:
    return base64.b64decode(s)


def beijing_now_str() -> str:
    return datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S")


def _extract_symbol(frame: bytes) -> str | None:
    """
    简单从 protobuf-like 结构里拿字符串字段：
    很多帧里出现 '\n' + <len> + <ascii symbol>
    返回捕获到的第一段可读 symbol
    """
    i = 0
    while i < len(frame) - 2:
        if frame[i] == 0x0A:  # '\n'
            length = frame[i + 1]
            j = i + 2
            k = j + length
            if 0 <= length <= 40 and k <= len(frame):
                try:
                    s = frame[j:k].decode("ascii", errors="ignore")
                    # 过滤掉太怪的串，只保留常见字符
                    if 2 <= len(s) <= 20 and all(ch.isalnum() or ch in "._+-()/" for ch in s):
                        return s
                except Exception:
                    pass
            i = k
        else:
            i += 1
    # 兜底：尝试直接在字节中寻找已知 key
    for key in SYMBOL_MAP.keys():
        if key.encode("ascii") in frame:
            return key
    return None


def _unpack_doubles_le(frame: bytes, step: int = 8) -> list[float]:
    """
    粗暴地按 8 字节小端 double 扫全帧，提取有限浮点数
    """
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
    """
    根据 symbol 的合理取值范围，从 doubles 里挑一个“看起来像价格”的数
    规则：优先选第一个落在合理区间的；选不到则返回 None
    """
    info = SYMBOL_MAP.get(symbol_key)
    if not info:
        return None
    lo, hi = info["rng"]
    for v in doubles:
        if lo <= v <= hi:
            return float(v)
    return None


def _to_canonical(symbol_key: str) -> dict | None:
    info = SYMBOL_MAP.get(symbol_key)
    if not info:
        return None
    code = info["code"]
    if code not in WHITELIST_CODES:
        return None
    return info


def decode_frame_to_json_line(frame: bytes) -> list[str]:
    """
    把一条二进制帧解析为若干条 JSON（不同品种可能在不同帧，通常一帧一个）
    返回：字符串列表（每个是 json.dumps）
    """
    res = []

    symbol_key = _extract_symbol(frame)
    if not symbol_key:
        return res

    info = _to_canonical(symbol_key)
    if not info:
        # 某些 PS/PB 只是一侧报价，仍然按映射里写的 code 输出（若在白名单内）
        # 已在 SYMBOL_MAP 里把 PS/PB 映射到了 AU9999/ASILVER_TD
        info = SYMBOL_MAP.get(symbol_key)
        if not info or info["code"] not in WHITELIST_CODES:
            return res

    doubles = _unpack_doubles_le(frame)
    price = _choose_price(symbol_key, doubles)
    if price is None:
        return res

    payload = {
        "time": beijing_now_str(),
        "symbol": info["code"],
        "name_cn": info["cn"],
        "price": round(price, 6),
        "unit": info["unit"],
        # 若你需要调试，可打开： "raw_sample": list(map(lambda x: round(x, 6), doubles[:8])),
    }
    res.append(json.dumps(payload, ensure_ascii=False))
    return res


class Monitor:
    def __init__(self):
        self.ws = None
        self.stop_flag = False

    def _send_chain(self):
        # 47 → 8 → 8 → 256 → 11
        for b64 in SUBSCRIBE_FRAMES_BASE64:
            self.ws.send(b64bytes(b64), opcode=websocket.ABNF.OPCODE_BINARY)
            time.sleep(0.10)

    def _heartbeat_loop(self):
        while not self.stop_flag and self.ws and self.ws.keep_running:
            try:
                self.ws.send("ping")  # 如需二进制心跳可换成 send(..., opcode=BINARY)
            except Exception:
                pass
            time.sleep(20)

    def on_open(self, ws):
        self._send_chain()
        t = threading.Thread(target=self._heartbeat_loop, daemon=True)
        t.start()

    def on_message(self, ws, message):
        if isinstance(message, (bytes, bytearray)):
            lines = decode_frame_to_json_line(bytes(message))
            for line in lines:
                print(line, flush=True)
        else:
            # 文本帧（可能是 pong/ack/文本JSON），忽略
            pass

    def on_error(self, ws, error):
        # 不打断，自动重连
        print(f'{"{"}"time": "%s", "level": "error", "msg": "%s"{"}"}' % (beijing_now_str(), str(error)))

    def on_close(self, ws, code, reason):
        print(f'{"{"}"time": "%s", "level": "close", "code": %s, "reason": "%s"{"}"}' % (beijing_now_str(), code, reason))

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
                # 忽略证书问题；若你环境严格可去掉
                self.ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f'{"{"}"time": "%s", "level": "fatal", "msg": "%s"{"}"}' % (beijing_now_str(), str(e)))
            time.sleep(2)


if __name__ == "__main__":
    print(f'{"{"}"time": "%s", "level": "info", "msg": "start gold monitor"{"}"}' % beijing_now_str())
    Monitor().run()
