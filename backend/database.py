import aiosqlite
import os

DB_PATH = os.getenv("DB_PATH", "./data/metrics.db")

async def init_db():
    """Inicializa o banco de dados SQLite e cria a tabela de metricas."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                target_ip TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                status TEXT NOT NULL
            )
        """)
        await db.commit()

async def insert_metric(target_ip: str, latency_ms: float, status: str):
    """Insere uma nova metrica de ping no banco de dados."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO metrics (target_ip, latency_ms, status) VALUES (?, ?, ?)",
            (target_ip, latency_ms, status)
        )
        await db.commit()

async def get_recent_metrics(limit: int = 200):
    """Recupera as metricas mais recentes em ordem cronologica."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in reversed(rows)]

async def get_summary():
    """Retorna estatisticas resumidas por IP alvo."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT
                target_ip,
                COUNT(*) as total_pings,
                SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as successful,
                ROUND(AVG(CASE WHEN status = 'sucesso' THEN latency_ms END), 2) as avg_latency,
                ROUND(MIN(CASE WHEN status = 'sucesso' THEN latency_ms END), 2) as min_latency,
                ROUND(MAX(CASE WHEN status = 'sucesso' THEN latency_ms END), 2) as max_latency
            FROM metrics
            GROUP BY target_ip
        """)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
