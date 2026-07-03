import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_recent_metrics, get_summary
from monitor import monitor_loop, TARGETS
from ml_engine import analyze_network_anomalies

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle handler: inicializa o banco e inicia o monitor."""
    print("\n" + "="*72)
    print("[FATOR DIDATICO] Restricoes de ICMP no Docker:")
    print("-" * 72)
    print("O protocolo ICMP (ping) exige Raw Sockets, que requerem")
    print("privilegios de root ou a capability CAP_NET_RAW.")
    print("Nesta arquitetura, contornamos isso de forma segura:")
    print("  1. Imagens Debian slim com binario ping setuid/dgram")
    print("  2. sysctl ping_group_range no docker-compose.yml")
    print("  3. Deteccao automatica de OS (Windows/Linux)")
    print("Assim evitamos --privileged, seguindo DevSecOps.")
    print("="*72 + "\n")

    await init_db()
    task = asyncio.create_task(monitor_loop())
    yield
    task.cancel()

app = FastAPI(
    title="NetOps Latency Analyzer API",
    description="API de monitoramento de latencia e conectividade de rede com IA Preditiva",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/targets")
async def list_targets():
    """Retorna a lista de alvos monitorados."""
    return {"targets": TARGETS}

@app.get("/api/metrics")
async def read_metrics():
    """Retorna series temporais agrupadas por IP."""
    data = await get_recent_metrics(300)

    grouped = {}
    for row in data:
        ip = row["target_ip"]
        if ip not in grouped:
            grouped[ip] = []
        grouped[ip].append({
            "timestamp": row["timestamp"],
            "latency_ms": row["latency_ms"],
            "status": row["status"]
        })

    return {"status": "ok", "data": grouped}

@app.get("/api/summary")
async def read_summary():
    """Retorna estatisticas resumidas por IP alvo com insights de Inteligência Artificial."""
    stats = await get_summary()
    data_metrics = await get_recent_metrics(300)
    
    grouped = {}
    for row in data_metrics:
        ip = row["target_ip"]
        if ip not in grouped:
            grouped[ip] = []
        grouped[ip].append(dict(row))
        
    ai_analysis = analyze_network_anomalies(stats, grouped)
    return {"status": "ok", "data": stats, "ai_insights": ai_analysis}

@app.get("/api/ai-insights")
async def read_ai_insights():
    """Retorna análise detalhada de ML Preditiva e Z-Score de latência para cada endpoint."""
    stats = await get_summary()
    data_metrics = await get_recent_metrics(300)
    
    grouped = {}
    for row in data_metrics:
        ip = row["target_ip"]
        if ip not in grouped:
            grouped[ip] = []
        grouped[ip].append(dict(row))
        
    ai_analysis = analyze_network_anomalies(stats, grouped)
    return ai_analysis

