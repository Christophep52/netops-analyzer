# 🌐 NetOps Analyzer (Next.js 16 + AI Network Telemetry & Anomaly Engine)

<div align="center">
  <a href="#english">🇺🇸 English</a> | <a href="#português">🇧🇷 Português</a>
</div>

<br />

<div align="center">
  <img src="dashboard.png" alt="NetOps Analyzer Dashboard" width="100%" />
</div>

<br />

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Zustand-State_Management-764ABC?style=for-the-badge&logo=react" alt="Zustand" />
  <img src="https://img.shields.io/badge/Telemetry-Real_Time-FF6C37?style=for-the-badge&logo=datadog" alt="Telemetry" />
  <img src="https://img.shields.io/badge/Docker-Enterprise_Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</div>

---

# <a id="english"></a>🇺🇸 English Documentation

## 🚀 Overview
**NetOps Analyzer** is an enterprise-class network observability and anomaly detection platform designed for continuous network performance monitoring, ICMP/SNMP telemetry analysis, and automated threat/jitter isolation.

Featuring a **Next.js 16 App Router** dashboard equipped with AI Anomaly Confidence Zones, interactive topology inspections, and instant Command Palette controls, it provides Network Operations Centers (NOCs) with sub-second insight into network degradation and bandwidth anomalies.

## ✨ Key Enterprise Features
- **🧠 Scikit-Learn IsolationForest AI Engine**: Unsupervised ML model analyzing time-series latency curves to predict packet drop trends and network instability (`global_stability_index`).
- **⚡ Asynchronous OS Subprocess ICMP Probing**: High-frequency non-blocking pings across multiple edge targets (`Google DNS`, `Cloudflare`, `AWS us-east-1`).
- **📈 Real-Time Telemetry & Confidence Zones**: Visual time-series charts with dynamic standard deviation bounds and anomaly highlighting.
- **🛠️ Command Palette (`Ctrl+K`)**: Rapid execution of network trace routes, target additions, and immediate alert triage.

## 🛠️ Quick Start & Live Demo

### ⚡ 1-Command Live Integrated Demo (Instant Test)
Want to test the Async ICMP Probes, Scikit-Learn IsolationForest Anomaly Engine & SQLite DB immediately without Docker?
```bash
cd backend
python run_demo_real.py
```

### 🐳 Full Enterprise Stack (Docker Compose)
Deploy the complete enterprise observability stack (Next.js 16 App Router frontend + FastAPI telemetry engine):
```bash
docker compose up --build -d
```

| Service | Local Endpoint | Description |
| :--- | :--- | :--- |
| **NOC Dashboard (Next.js 16)** | `http://localhost:3000` | Real-Time Latency Charts & AI Stability Index |
| **FastAPI Swagger Docs** | `http://localhost:8000/docs` | Interactive OpenAPI 3.0 API Documentation |

## 🧪 Automated Testing (`pytest`)
The project features an automated test suite (**16/16 tests passing**):
```bash
cd backend
pytest -v
```

---

# <a id="português"></a>🇧🇷 Documentação em Português

## 🚀 Visão Geral
O **NetOps Analyzer** é uma plataforma corporativa de observabilidade e detecção de anomalias de rede projetada para monitoramento contínuo de desempenho, telemetria ICMP/SNMP e isolamento automático de instabilidade de conectividade.

Com um painel **Next.js 16 App Router** equipado com Zonas de Confiança e índices preditivos de IA, oferece a Centros de Operações de Rede (NOC) visibilidade instantânea sobre degradação e variação de latência (jitter).

## ✨ Principais Funcionalidades Corporativas
- **🧠 Motor de IA Scikit-Learn IsolationForest**: Modelo não-supervisionado que analisa séries temporais de latência para prever picos anômalos e calcular o índice de estabilidade global (`global_stability_index`).
- **⚡ Provas ICMP Assíncronas de Alta Performance**: Disparo contínuo e não-bloqueante para alvos críticos (`Google DNS`, `Cloudflare`, `AWS us-east-1`).
- **📈 Telemetria em Tempo Real**: Gráficos dinâmicos com desvio padrão e detecção de picos em milissegundos.
- **🛠️ Command Palette (`Ctrl+K`)**: Comandos rápidos para gerenciamento de alvos e execução de rotinas de diagnóstico.

## 🛠️ Como Usar / Demonstração Rápida

### ⚡ Demonstração Real em 1 Comando (Sem Docker)
Deseja testar os disparos ICMP assíncronos, o motor Scikit-Learn IsolationForest e a persistência no banco de dados imediatamente?
```bash
cd backend
python run_demo_real.py
```

### 🐳 Execução Completa via Docker Compose
Para rodar todo o ecossistema NOC corporativo em contêineres:
```bash
docker compose up --build -d
```

| Serviço | Endereço Local | Descrição |
| :--- | :--- | :--- |
| **Painel NOC (Next.js 16)** | `http://localhost:3000` | Telemetria de Rede & Gráficos em Tempo Real |
| **Documentação da API (Swagger)** | `http://localhost:8000/docs` | Documentação interativa OpenAPI 3.0 |

## 🧪 Suíte de Testes Automatizados (`pytest`)
O projeto conta com suíte de testes completa (**100% de aprovação - 16/16 testes**):
```bash
cd backend
pytest -v
```

---

## 📄 Licença / License
Distribuído sob a Licença MIT. Projetado para Centros de Operações de Rede (NOC) e equipes de SRE.
