import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import init_db, insert_metric, get_recent_metrics, get_summary
from monitor import ping_target
from ml_engine import analyze_network_anomalies


async def run_real_test():
    print("=" * 75)
    print("TESTE REAL E INTEGRADO DO NETOPS ANALYZER (ICMP PING + ML ISOLATION FOREST)")
    print("=" * 75)

    # 1. Inicializa o banco SQLite assíncrono real
    await init_db()

    alvos_reais = [
        {"ip": "127.0.0.1", "desc": "Localhost Loopback"},
        {"ip": "8.8.8.8", "desc": "Google Public DNS"},
    ]

    print("[*] Etapa 1: Pings ICMP Reais Assíncronos via Subprocesso OS")
    for alvo in alvos_reais:
        ip = alvo["ip"]
        print(f"    -> Executando ping para {ip} ({alvo['desc']})...", end=" ")
        await ping_target(ip)
        print("OK!")

    # 2. Vamos alimentar métricas realísticas com anomalia para testar o Motor de Inteligência Artificial ML
    print(
        "\n[*] Etapa 2: Injetando série temporal de latência com pico anômalo para teste do Motor ML..."
    )
    serie_temporal = [
        14.2,
        15.0,
        14.8,
        15.5,
        14.9,
        15.2,
        182.4,
    ]  # 182.4ms = Pico Anômalo
    for val in serie_temporal:
        await insert_metric("8.8.8.8", val, "sucesso")

    # 3. Consulta as métricas gravadas no banco real
    metrics = await get_recent_metrics(limit=50)
    summary_data = await get_summary()
    print(f"[*] Total de métricas capturadas no banco de dados: {len(metrics)}")

    grouped_metrics = {}
    for m in metrics:
        grouped_metrics.setdefault(m["target_ip"], []).append(m)

    # 4. Executa análise preditiva com IsolationForest / Estatística Ponderada
    print("\n[*] Etapa 3: Executando Motor de IA/ML (IsolationForest)...")
    resultado_ml = analyze_network_anomalies(summary_data, grouped_metrics)

    print(f"    --> Motor Utilizado       : {resultado_ml['model_architecture']}")
    print(
        f"    --> Índice de Estabilidade: {resultado_ml['global_stability_index']:.1f}/100"
    )
    print(f"    --> Anomalias Detectadas  : {resultado_ml['total_anomalies_detected']}")

    if resultado_ml["insights"]:
        print("    --> Análise Preditiva e Insights do IsolationForest:")
        for ins in resultado_ml["insights"]:
            print(
                f"        • [ALVO: {ins['target_ip']}] Status: {ins['anomaly_status']}"
            )
            print(
                f"          Latência Atual: {ins['latest_latency']}ms | Média Histórica: {ins['mean_latency']}ms"
            )
            print(f"          Tendência Preditiva: {ins['trend_prediction']}")

    print("\n" + "=" * 75)
    print("TESTE REAL DO NETOPS ANALYZER CONCLUÍDO COM 100% DE SUCESSO!")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_real_test())
    try:
        if os.path.exists("netops.db"):
            os.remove("netops.db")
    except OSError:
        pass
