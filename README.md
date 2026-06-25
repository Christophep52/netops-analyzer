# 🌐 NetOps Autonomous Latency Analyzer

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker_Compose-Orquestrado-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

> **Sistema NetOps conteinerizado focado em monitoramento contínuo de latência, perda de pacotes e jitter de 10 endpoints críticos. Conceitos práticos de SRE, orquestração Docker, ICMP rootless e observabilidade em tempo real.**

![Screenshot do Dashboard](dashboard.png)

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND (React 19 + Recharts)               │
│       Vite · Tailwind CSS v4 · Grid + Table View Toggle       │
└────────────────────────┬─────────────────────────────────────┘
                         │ Polling Assíncrono (5s)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI / ASGI)                       │
│  asyncio.create_subprocess_exec (Secure) · 10 Pings Paralelos  │
└──────┬───────────────────────────────────────────┬───────────┘
       ▼                                           ▼
┌────────────┐                            ┌──────────────────┐
│   SQLite   │                            │  ICMP Rootless   │
│ (aiosqlite)│                            │  10 Alvos DNS/   │
│            │                            │  Cloud/Gaming    │
└────────────┘                            └──────────────────┘
```

---

## 🎯 Alvos Monitorados

| Alvo | IP | Categoria |
|------|----|-----------| 
| Google DNS | `8.8.8.8` / `8.8.4.4` | DNS Público |
| Cloudflare DNS | `1.1.1.1` / `1.0.0.1` | DNS Público |
| Quad9 DNS | `9.9.9.9` | DNS Seguro |
| OpenDNS (Cisco) | `208.67.222.222` | DNS Corporativo |
| Comodo Secure DNS | `8.26.56.26` | DNS Seguro |
| AdGuard DNS | `94.140.14.14` | DNS com Filtro |
| Riot Games (NA) | `104.160.131.3` | Gaming Server |
| AWS us-east-1 | `3.218.180.0` | Cloud Provider |

---

## ✨ Diferenciais Técnicos

### 1. Dual View: Grid + Table
Dashboard com toggle entre **Grid de Cards** (com gráficos Recharts por nó) e **Tabela Sumário** com health bars de uptime por IP.

### 2. ICMP Rootless no Docker
Protocolo ICMP sem `--privileged` via `sysctls` (`net.ipv4.ping_group_range`) e imagens Debian slim com ping DGRAM.

### 3. Coleta Assíncrona Não-Bloqueante & Segura
Pool de subprocessos via `asyncio.create_subprocess_exec` sem uso de shell (prevenindo injeção de comando) com timeouts resilientes — 10 nós em paralelo, sem travar a API FastAPI.

### 4. Persistência Assíncrona Escalável
Uso de `aiosqlite` com `PRAGMA journal_mode=WAL;` e índices para suportar acesso altamente concorrente (leituras e gravações assíncronas simultâneas). O sistema inclui uma rotina autônoma de `cleanup` para retenção dos últimos 7 dias.

### 5. Detecção Automática de OS
Regex unificado que parseia `time=` (Linux) e `tempo=` (Windows) — portabilidade total entre dev e prod.

---

## 🚀 Como Executar

### Docker Compose
```bash
git clone https://github.com/Christophep52/netops-analyzer.git
cd netops-analyzer
docker-compose up --build -d
```

### Local
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

**Frontend:** http://localhost:5173 · **API:** http://localhost:8000/docs
