# 📡 NetOps Analyzer & Predictive Network Telemetry

<div align="center">
  <img src="dashboard.png" alt="NetOps Analyzer Dashboard" width="100%" />
</div>

<br />

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React_Query-TanStack-FF4154?style=for-the-badge&logo=react-query" alt="React Query" />
  <img src="https://img.shields.io/badge/Alembic-Migrations-red?style=for-the-badge&logo=python" alt="Alembic" />
  <img src="https://img.shields.io/badge/Structlog-JSON_Logs-blue?style=for-the-badge&logo=datadog" alt="Structlog" />
  <img src="https://img.shields.io/badge/Docker-Enterprise_Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</div>

---

## 🚀 Visão Geral
O **NetOps Analyzer** é uma plataforma corporativa de análise preditiva de latência de rede, monitoramento de conectividade ICMP e detecção de anomalias com Inteligência Artificial.

## ✨ Recursos Enterprise Implementados
- **📡 Monitoramento ICMP Seguro (DevSecOps)**: Medição de ping sem necessidade de privilégios `--privileged` via `CAP_NET_RAW`.
- **🧠 IA Preditiva de Anomalias (Scikit-learn / Isolation Forest)**: Detecção automática de degradação de rede.
- **🗄️ Governança de Banco de Dados (Alembic)**: Versionamento de banco de dados e migrações gerenciadas.
- **📊 Observabilidade JSON (Structlog & RFC-7807)**: Log estruturado e tratamento corporativo de erros.
- **⚡ Frontend Next.js + React Query**: Dashboard com animações e estado sincronizado.
- **🤖 GitHub Actions CI/CD**: Workflow automatizado de validação de código e testes.

## 🛠️ Como Rodar o Projeto

### 🐳 Via Docker Compose
```bash
docker compose up --build -d
```

### ⚡ Desenvolvimento Local
```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend-next
npm install
npm run dev
```

## 🧪 Suíte de Testes Automatizados (`pytest`)
Suíte de testes assíncronos com **100% de aprovação (10/10 testes)**:
```bash
cd backend
python -m pytest -v
```
