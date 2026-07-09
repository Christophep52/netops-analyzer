import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/metrics_db")

async def init_db():
    """Inicializa o banco de dados PostgreSQL e cria a tabela de metricas."""
    async with asyncpg.connect(DATABASE_URL) as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                target_ip TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                status TEXT NOT NULL
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_target_time ON metrics(target_ip, timestamp);")
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

async def cleanup_old_metrics(days: int = 7):
    """Remove métricas mais antigas que o número de dias especificado para evitar crescimento ilimitado."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"DELETE FROM metrics WHERE timestamp < datetime('now', '-{int(days)} days')")
        await db.commit()
