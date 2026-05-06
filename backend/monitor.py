import asyncio
import platform
import re
from database import insert_metric

TARGETS = [
    {"ip": "8.8.8.8",         "label": "Google DNS (Primario)"},
    {"ip": "8.8.4.4",         "label": "Google DNS (Secundario)"},
    {"ip": "1.1.1.1",         "label": "Cloudflare DNS (Primario)"},
    {"ip": "1.0.0.1",         "label": "Cloudflare DNS (Secundario)"},
    {"ip": "9.9.9.9",         "label": "Quad9 DNS"},
    {"ip": "208.67.222.222",  "label": "OpenDNS (Cisco)"},
    {"ip": "8.26.56.26",      "label": "Comodo Secure DNS"},
    {"ip": "94.140.14.14",    "label": "AdGuard DNS"},
    {"ip": "104.160.131.3",   "label": "Riot Games (NA)"},
    {"ip": "3.218.180.0",     "label": "AWS us-east-1"},
]

def _build_ping_cmd(ip: str) -> str:
    sistema = platform.system().lower()
    if sistema == "windows":
        return f"ping -n 1 -w 1000 {ip}"
    else:
        return f"ping -c 1 -W 1 {ip}"

async def ping_target(ip: str):
    cmd = _build_ping_cmd(ip)
    try:
        process = await asyncio.create_subprocess_shell(
            cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        output = stdout.decode('utf-8', errors='ignore')
        if process.returncode == 0:
            match = re.search(r"(?:time|tempo)[=<]([\d\.]+)\s*ms", output, re.IGNORECASE)
            if match:
                latency = float(match.group(1))
                await insert_metric(ip, latency, "sucesso")
                return
        await insert_metric(ip, 0.0, "timeout")
    except Exception:
        await insert_metric(ip, 0.0, "erro")

async def monitor_loop():
    while True:
        tasks = [ping_target(t["ip"]) for t in TARGETS]
        await asyncio.gather(*tasks)
        await asyncio.sleep(5)
