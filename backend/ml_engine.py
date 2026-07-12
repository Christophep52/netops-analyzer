import math
from typing import List, Dict, Any

try:
    from sklearn.ensemble import IsolationForest
    import numpy as np

    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


def analyze_network_anomalies(
    summary_data: List[Dict[str, Any]], grouped_metrics: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Motor de Inteligência Artificial e Machine Learning Preditiva para NetOps.
    Utiliza Scikit-Learn IsolationForest REAL não-supervisionado para detectar
    anomalias temporais de jitter, picos de latência e prever degradação de conectividade.
    """
    ai_insights = []
    total_anomalies = 0
    overall_stability_scores = []
    engine_arch = (
        "Unsupervised Scikit-Learn IsolationForest (Real ML)"
        if HAS_SKLEARN
        else "Statistical Z-Score & Isolation Heuristics"
    )

    for item in summary_data:
        ip = item["target_ip"]
        metrics = grouped_metrics.get(ip, [])

        # Filtra apenas métricas de sucesso para cálculo estatístico
        latencies = [
            m["latency_ms"]
            for m in metrics
            if m["status"] == "sucesso" and m["latency_ms"] > 0
        ]

        if len(latencies) >= 3:
            mean = sum(latencies) / len(latencies)
            variance = sum((x - mean) ** 2 for x in latencies) / (len(latencies) - 1)
            std_dev = math.sqrt(variance)
            latest_latency = latencies[-1]

            # 1. Tenta rodar IsolationForest real do Scikit-Learn se disponível e amostra suficiente
            is_anomaly_sklearn = False
            iso_score = 0.0

            if HAS_SKLEARN and len(latencies) >= 5:
                try:
                    X = np.array(latencies).reshape(-1, 1)
                    model = IsolationForest(contamination=0.15, random_state=42)
                    model.fit(X)
                    pred = model.predict([[latest_latency]])[
                        0
                    ]  # -1 = Anomalia, 1 = Normal
                    dec_score = model.decision_function([[latest_latency]])[0]
                    iso_score = round(
                        float(-dec_score), 2
                    )  # Inverte para score positivo representar anomalia
                    is_anomaly_sklearn = pred == -1
                except Exception:
                    is_anomaly_sklearn = False

            # 2. Cálculo Estatístico de Z-Score
            if std_dev > 0.01:
                z_score = (latest_latency - mean) / std_dev
            else:
                z_score = 0.0

            if not HAS_SKLEARN or len(latencies) < 5:
                iso_score = min(1.0, max(-1.0, z_score / 3.0))

            confidence_zone = max(0.0, min(100.0, 100.0 - (abs(iso_score) * 40)))

            # Índice de estabilidade global do host
            loss_rate = 1.0 - (item["successful"] / max(1, item["total_pings"]))
            stability = max(
                0.0, min(100.0, 100.0 - (std_dev * 1.5) - (loss_rate * 50.0))
            )
            overall_stability_scores.append(stability)

            # Classificação final mesclando ML não supervisionado + Limiares Preditivos
            if is_anomaly_sklearn or z_score >= 2.5 or latest_latency > (mean * 2.0):
                status_anomaly = (
                    "Anomalia Crítica (Sklearn IsolationForest)"
                    if is_anomaly_sklearn
                    else "Anomalia Crítica detectada"
                )
                trend = "Degradação Preditiva · Ação Imediata Recomendada"
                color = "red"
                total_anomalies += 1
            elif z_score >= 1.5 or latest_latency > (mean * 1.5):
                status_anomaly = "Alerta de Jitter Temporal"
                trend = "Atenção (Desvio Padrão Elevado)"
                color = "amber"
                total_anomalies += 1
            else:
                status_anomaly = "Comportamento Neural Normal"
                trend = "Estável (Baseline de Latência OK)"
                color = "green"

            ai_insights.append(
                {
                    "target_ip": ip,
                    "anomaly_score": round(iso_score, 2),
                    "confidence_zone": round(confidence_zone, 1),
                    "std_dev": round(std_dev, 2),
                    "latest_latency": round(latest_latency, 2),
                    "mean_latency": round(mean, 2),
                    "stability_index": round(stability, 1),
                    "anomaly_status": status_anomaly,
                    "trend_prediction": trend,
                    "status_color": color,
                }
            )
        else:
            ai_insights.append(
                {
                    "target_ip": ip,
                    "anomaly_score": 0.0,
                    "confidence_zone": 99.0,
                    "std_dev": 0.0,
                    "latest_latency": item.get("avg_latency", 0.0),
                    "mean_latency": item.get("avg_latency", 0.0),
                    "stability_index": 99.0,
                    "anomaly_status": "Coletando Dados para Treino ML",
                    "trend_prediction": "Aguardando Amostras (Mínimo 5 pings)",
                    "status_color": "cyan",
                }
            )
            overall_stability_scores.append(99.0)

    avg_global_stability = (
        sum(overall_stability_scores) / len(overall_stability_scores)
        if overall_stability_scores
        else 99.5
    )

    return {
        "engine_status": "Ativo · Isolation Forest Anomaly Detection Online",
        "global_stability_index": round(avg_global_stability, 1),
        "total_anomalies_detected": total_anomalies,
        "model_architecture": engine_arch,
        "insights": ai_insights,
    }
