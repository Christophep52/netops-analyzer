import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from database import init_db, get_recent_metrics, get_summary, get_latency_history, insert_metric
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

@app.get("/api/latency-history")
async def read_latency_history(ip: str):
    """Returns latency history for a specific IP."""
    data = await get_latency_history(ip, 24)
    return {"status": "ok", "data": data}

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

@app.get("/api/topology")
async def get_topology():
    """Returns network topology nodes and edges."""
    nodes = [
        {"id": "core-router", "label": "Core Router", "type": "router"},
        {"id": "switch-1", "label": "Main Switch", "type": "switch"},
        {"id": "switch-2", "label": "Secondary Switch", "type": "switch"},
    ]
    edges = [
        {"source": "core-router", "target": "switch-1"},
        {"source": "core-router", "target": "switch-2"},
    ]

    for target in TARGETS:
        node_id = f"server-{target['ip']}"
        nodes.append({"id": node_id, "label": f"{target['label']}\n{target['ip']}", "type": "server"})
        # connect to switch-1 for simplicity
        edges.append({"source": "switch-1", "target": node_id})

    return {"status": "ok", "nodes": nodes, "edges": edges}

@app.post("/api/chaos")
async def simulate_chaos():
    """Simulates a severe network outage by injecting timeout records for 10.0.0.1."""
    target_ip = "10.0.0.1"
    for _ in range(15):
        await insert_metric(target_ip, 0.0, "timeout")
    return {"status": "ok", "message": "Chaos injected: 15 timeout metrics added for 10.0.0.1"}

@app.get("/api/export")
async def export_pdf():
    """Generates a PDF report with recent network metrics."""
    stats = await get_summary()
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, "NetOps Analyzer - Network Report")
    
    p.setFont("Helvetica", 12)
    y = 710
    for s in stats:
        ip = s.get("target_ip") or s.get("target", "Unknown")
        avg_lat = s.get("avg_latency", 0)
        loss = s.get("packet_loss_percentage", 0)
        
        p.drawString(50, y, f"Target: {ip}")
        p.drawString(250, y, f"Latency: {avg_lat} ms")
        p.drawString(400, y, f"Packet Loss: {loss}%")
        
        y -= 20
        if y < 50:
            p.showPage()
            y = 750
            
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=netops_report.pdf"}
    )
