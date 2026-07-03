# 🌐 NetOps Autonomous Latency Analyzer

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker_Compose-Orquestrado-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

> **Sistema NetOps conteinerizado focado em monitoramento contínuo com Inteligência Artificial e Machine Learning Preditiva (Z-Score) para detecção autônoma de anomalias, jitter e perda de pacotes em 9 endpoints críticos. Conceitos práticos de SRE, orquestração Docker e observabilidade neural em tempo real.**

![Screenshot do Dashboard](dashboard.png)

---

## 📌 Destaque para Recrutadores & Liderança Técnica

Este projeto implementa práticas fundamentais de **Site Reliability Engineering (SRE), Inteligência Artificial Preditiva, Segurança em Nuvem e Processamento Assíncrono**:

* 🤖 **Inteligência Artificial Preditiva & Detecção de Anomalias:** O motor estatístico e de ML integrado (`backend/ml_engine.py`) avalia séries temporais em tempo real calculando o **Z-Score ($Z = \frac{x - \mu}{\sigma}$)** e desvio padrão amostral para classificar o comportamento neural de cada endpoint, emitindo alertas preditivos de jitter antes que ocorram quedas de conexão.
* 🛡️ **Segurança Rootless em Containers:** Diferente de monitores de rede tradicionais que exigem permissões de root (`--privileged`), este sistema utiliza o recurso avançado `net.ipv4.ping_group_range` via `sysctls` do Linux no Docker. Isso elimina a superfície de ataque para escalada de privilégios em ambientes Kubernetes e Cloud.
* ⚡ **Arquitetura Assíncrona Não-Bloqueante:** Construído com **FastAPI e Python AsyncIO (`create_subprocess_exec`)**, realizando verificações de latência e perda de pacotes em 9 nós globais simultaneamente sem bloquear a thread principal ou saturar o event loop.
* 📈 **Persistência Concorrente com SQLite WAL:** Para evitar gargalos de I/O em gravações de telemetria de alta frequência, o banco utiliza **Write-Ahead Logging (WAL)**, permitindo leituras analíticas pesadas no dashboard enquanto os workers continuam gravando dados em paralelo.
* 🔧 **Observabilidade & Portabilidade:** Interface reativa desenvolvida em **React 19 + Recharts** com visões duplas (Grid de Cards para análise granular de jitter com badges de Z-score e Tabela Sumário para visão executiva de SLA e Uptime).

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
│  asyncio.create_subprocess_exec (Secure) · 9 Pings Paralelos   │
└──────┬───────────────────────────────────────────┬───────────┘
       ▼                                           ▼
┌────────────┐                            ┌──────────────────┐
│   SQLite   │                            │  ICMP Rootless   │
│ (aiosqlite)│                            │  9 Alvos DNS/    │
│            │                            │  Cloud           │
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
| AWS us-east-1 | `3.218.180.0` | Cloud Provider |

---

## ✨ Diferenciais Técnicos

### 1. Dual View: Grid + Table
Dashboard com alternância entre **Grid de Cards** (gráficos Recharts por nó) e **Tabela Sumário** com indicadores de uptime por IP.

### 2. ICMP Rootless no Docker
Protocolo ICMP configurado sem `--privileged` via `sysctls` (`net.ipv4.ping_group_range`) em imagens Debian slim.

### 3. Coleta Assíncrona e Segura
Pool de subprocessos com `asyncio.create_subprocess_exec` sem uso de shell (prevenindo injeção de comando) com timeouts definidos: 9 nós em paralelo, sem bloquear a API FastAPI.

### 4. Persistência Assíncrona Escalável
Uso de `aiosqlite` com `PRAGMA journal_mode=WAL;` e índices para suportar acesso concorrente (leituras e gravações simultâneas). O sistema inclui uma rotina autônoma de limpeza para retenção dos últimos 7 dias.

### 5. Detecção Automática de OS
Regex unificado que processa a saída de tempo no Linux (`time=`) e no Windows (`tempo=`), oferecendo portabilidade entre os ambientes de desenvolvimento e produção.

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
