import asyncio
import platform
import re
import logging
from database import insert_metric, cleanup_old_metrics, insert_latency_history

logger = logging.getLogger(__name__)

TARGETS = [
    {"ip": "8.8.8.8",         "label": "Google DNS (Primario)"},
    {"ip": "8.8.4.4",         "label": "Google DNS (Secundario)"},
    {"ip": "1.1.1.1",         "label": "Cloudflare DNS (Primario)"},
    {"ip": "1.0.0.1",         "label": "Cloudflare DNS (Secundario)"},
    {"ip": "9.9.9.9",         "label": "Quad9 DNS"},
    {"ip": "208.67.222.222",  "label": "OpenDNS (Cisco)"},
    {"ip": "8.26.56.26",      "label": "Comodo Secure DNS"},
    {"ip": "94.140.14.14",    "label": "AdGuard DNS"},
    {"ip": "3.218.180.0",     "label": "AWS us-east-1"},
]

def _build_ping_args(ip: str) -> list[str]:
    """Constructs ping command arguments depending on the operating system."""
    sistema = platform.system().lower()
    if sistema == "windows":
        return ["ping", "-n", "1", "-w", "1000", ip]
    else:
        return ["ping", "-c", "1", "-W", "1", ip]

async def ping_target(ip: str):
    """
    Pings a target IP asynchronously and stores the result.
    Handles timeouts securely and suppresses verbose stack traces.
    """
    args = _build_ping_args(ip)
    try:
        process = await asyncio.create_subprocess_exec(
            *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=3.0)
        except asyncio.TimeoutError:
            try:
                process.kill()
            except Exception:
                pass
            await insert_metric(ip, 0.0, "timeout")
            await insert_latency_history(ip, 0.0)
            return

        output = stdout.decode('utf-8', errors='ignore')
        if process.returncode == 0:
            match = re.search(r"(?:time|tempo)[=<]([\d\.]+)\s*ms", output, re.IGNORECASE)
            if match:
                latency = float(match.group(1))
                await insert_metric(ip, latency, "sucesso")
                await insert_latency_history(ip, latency)
                return
        await insert_metric(ip, 0.0, "timeout")
        await insert_latency_history(ip, 0.0)
    except Exception as e:
        logger.error(f"Error pinging {ip}: {str(e)}")
        await insert_metric(ip, 0.0, "erro")
        await insert_latency_history(ip, 0.0)

async def monitor_loop():
    """
    Main loop for monitoring targets.
    Periodically cleans up old metrics to prevent database bloat.
    """
    loop_count = 0
    while True:
        try:
            tasks = [ping_target(t["ip"]) for t in TARGETS]
            await asyncio.gather(*tasks)
            loop_count += 1
            if loop_count >= 120:  # Roughly every 10 minutes
                try:
                    await cleanup_old_metrics(days=7)
                except Exception as e:
                    logger.error(f"Error during cleanup: {str(e)}")
                loop_count = 0
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Error in monitor loop: {str(e)}")
            await asyncio.sleep(5)
