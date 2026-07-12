import aiosqlite
import os

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "metrics.db")


async def init_db():
    """Inicializa o banco de dados SQLite e cria a tabela de metricas."""
    os.makedirs(DB_DIR, exist_ok=True)
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
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_target_time ON metrics(target_ip, timestamp);"
        )
        await db.execute("""
            CREATE TABLE IF NOT EXISTS latency_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_ip TEXT NOT NULL,
                latency REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_latency_hist ON latency_history(target_ip, timestamp);"
        )
        await db.commit()


async def insert_metric(target_ip: str, latency_ms: float, status: str):
    """Insere uma nova metrica de ping no banco de dados."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO metrics (target_ip, latency_ms, status) VALUES (?, ?, ?)",
            (target_ip, latency_ms, status),
        )
        await db.commit()


async def insert_latency_history(target_ip: str, latency: float):
    """Inserts a new latency record for Time-Series tracking."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO latency_history (target_ip, latency) VALUES (?, ?)",
            (target_ip, latency),
        )
        await db.commit()


async def get_latency_history(target_ip: str, limit: int = 24):
    """Retrieves the most recent latency records for a specific IP."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT target_ip, latency, timestamp FROM latency_history WHERE target_ip = ? ORDER BY timestamp DESC LIMIT ?",
            (target_ip, limit),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in reversed(rows)]


async def get_recent_metrics(limit: int = 200):
    """Recupera as metricas mais recentes em ordem cronologica."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?", (limit,)
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
                ROUND(MAX(CASE WHEN status = 'sucesso' THEN latency_ms END), 2) as max_latency,
                ROUND(CAST(SUM(CASE WHEN latency_ms = 0 THEN 1 ELSE 0 END) AS FLOAT) * 100 / COUNT(*), 2) as packet_loss_percentage
            FROM metrics
            GROUP BY target_ip
        """)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def cleanup_old_metrics(days: int = 7):
    """Remove métricas mais antigas que o número de dias especificado para evitar crescimento ilimitado."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"DELETE FROM metrics WHERE timestamp < datetime('now', '-{int(days)} days')"
        )
        await db.commit()
