# 🌐 NetOps Autonomous Latency Analyzer

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker_Compose-Orquestrado-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

> **Sistema NetOps conteinerizado focado em monitoramento contínuo de latência (ping), perda de pacotes e oscilação (jitter) de IPs críticos. Construído para demonstrar conceitos práticos de Engenharia de Confiabilidade (SRE), orquestração via Docker, resolução de permissões ICMP (rootless) e observabilidade em tempo real.**

![Screenshot do Dashboard](dashboard.png)

---

## 🏗️ Visão Geral da Arquitetura

Este projeto reflete um pipeline de métricas completo, dividindo a responsabilidade entre a coleta autônoma assíncrona, persistência leve e visualização de dados:

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18)                          │
│        Vite · Tailwind CSS v4 · Recharts · Lucide Icons          │
│                    Servido via Nginx (Porta 80)                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ Polling Assíncrono (API REST)
                       ▼ 
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI / ASGI)                      │
│        Subprocessos Assíncronos · Polling Autônomo · CORS        │
│                    Uvicorn (Porta 8000)                          │
└──────┬────────────────────────────────────────────────┬──────────┘
       │ Salva Métricas                                 │ Executa
       ▼                                                ▼
┌────────────┐                                  ┌──────────────────┐
│   SQLite   │                                  │   Subprocessos   │
│  (Volume)  │                                  │      (Ping)      │
│            │                                  │                  │
│ Séries     │                                  │  10+ Alvos ICMP  │
│ Temporais  │                                  │  (DGRAM Rootless)│
└────────────┘                                  └──────────────────┘
```

---

## 🎯 Alvos Monitorados

O sistema monitora simultaneamente **10 endpoints de infraestrutura crítica**, abrangendo resolvedores DNS públicos, CDNs globais e servidores de jogos:

| Alvo | IP | Categoria |
|------|----|-----------|
| Google DNS (Primário) | `8.8.8.8` | DNS Público |
| Google DNS (Secundário) | `8.8.4.4` | DNS Público |
| Cloudflare DNS (Primário) | `1.1.1.1` | DNS Público |
| Cloudflare DNS (Secundário) | `1.0.0.1` | DNS Público |
| Quad9 DNS | `9.9.9.9` | DNS Seguro (Malware Blocking) |
| OpenDNS (Cisco) | `208.67.222.222` | DNS Corporativo |
| Comodo Secure DNS | `8.26.56.26` | DNS Seguro |
| AdGuard DNS | `94.140.14.14` | DNS com Filtro de Anúncios |
| Riot Games (NA) | `104.160.131.3` | Gaming Server |
| AWS us-east-1 | `3.218.180.0` | Cloud Provider |

---

## ✨ Diferenciais Técnicos

### 1. Fator Didático (SRE & Docker) / Rootless ICMP
**Como o protocolo ICMP foi tratado no Docker?**
O protocolo ICMP (ping) geralmente exige permissões altas (`root` ou `CAP_NET_RAW` via Raw Sockets). Para evitar rodar os contêineres em modo `--privileged` ou expor o kernel host a ameaças (um anti-padrão crasso de DevSecOps), foram utilizadas as seguintes estratégias:
- Imagens otimizadas (Debian slim) que já vem com o binário `ping` preparado para sockets de datagrama.
- Configuração de `sysctls` via `docker-compose.yml` (`net.ipv4.ping_group_range=0 2147483647`), delegando controle atrelado a sub-redes non-root e garantindo execuções de subprocessos seguros e isolados.

### 2. Coleta Assíncrona e Não-Bloqueante
Em vez de travar a thread principal a cada ciclo para buscar os pings, o backend executa as requisições através de um pool de subprocessos (`asyncio.create_subprocess_shell`) processando **10 nós em paralelo**, alimentando o banco com base no parser em tempo real do STDERR/STDOUT, sem onerar a API do FastAPI.

### 3. Persistência Assíncrona em Disco
Utilização da biblioteca `aiosqlite` para evitar o bloqueio inerente de I/O de disco do SQLite tradicional no ecossistema Async do Python. A leitura para o Frontend (que agrega gráficos com histórico de estabilidade) recupera registros com latência de milissegundos.

### 4. Integração Visual com Tailwind v4 e Recharts
Painel frontend desenhado sob filosofia Mobile First, suportando Dark Mode estrito, componentes dinâmicos (Lucide) e motor gráfico flexível de alta performance (Recharts), traduzindo oscilações de sub-milissegundos visualmente sem engasgos de renderização (Jank).

### 5. Detecção Automática de Sistema Operacional
O monitor detecta automaticamente se está rodando em Windows (`ping -n 1 -w 1000`) ou Linux/Mac (`ping -c 1 -W 1`), com regex unificado que parseia ambos os formatos de saída (`time=` e `tempo=`), garantindo portabilidade total do código entre ambientes de desenvolvimento e produção.

---

## 🧰 Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|--------|-----------|------------|
| **Frontend** | React 18, Vite 8, Tailwind CSS v4, Recharts | SPA Dark-mode com monitoramento de séries temporais |
| **Backend** | FastAPI, Uvicorn (ASGI), Asyncio | Servidor da API REST e Engine de Polling de Rede |
| **Banco de Dados** | SQLite (via aiosqlite) | Armazenamento não-bloqueante de telemetria |
| **Monitoramento** | Binários ICMP Nativos (10 alvos) | Datagramas assíncronos configurados Rootless |
| **Infra** | Docker & Docker Compose | Orquestração & Isolação de Ambientes |

---

## 🚀 Como Executar

### Opção 1: Docker Compose (Recomendado)

Toda a infraestrutura com os *sysctls* corretos, dependências e volumes sobe com um único comando:

```bash
# Clone o repositório
git clone https://github.com/Christophep52/netops-analyzer.git
cd netops-analyzer

# Construa e inicie a infraestrutura
docker-compose up --build -d
```

> **Frontend:** http://localhost · **Documentação da API (Swagger):** http://localhost:8000/docs

### Opção 2: Desenvolvimento Local (Hot Reload)

**Backend:**
```bash
cd backend
python -m venv env
# Windows: .\env\Scripts\activate | Linux/Mac: source env/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Estrutura do Projeto

```
netops-analyzer/
├── backend/
│   ├── main.py                   # App FastAPI e Lifecycle (Startup/Engine)
│   ├── monitor.py                # Worker assíncrono: 10 alvos ICMP em paralelo
│   ├── database.py               # aiosqlite (Tabela metrics + Agregações SQL)
│   ├── requirements.txt          # Dependências Python
│   └── Dockerfile                # Imagem Debian Slim do Python 3.11
├── frontend/
│   ├── src/App.jsx               # SPA React com Recharts e Axios (Polling)
│   ├── src/index.css             # Entry point Tailwind CSS v4 (@import "tailwindcss")
│   ├── vite.config.js            # Configuração de build (@tailwindcss/vite)
│   ├── Dockerfile                # Build multi-stage Node 20 → Nginx
│   └── package.json              # Dependências de UI (Lucide, date-fns)
├── data/                         # Volume persistente do Banco de Dados SQLite
├── docker-compose.yml            # Orquestração full stack (Frontend + Backend)
└── README.md
```

---

*Projetado e construído como vitrine de proficiência em Engenharia de Redes, orquestração de contêineres e aplicações voltadas para observabilidade de infraestrutura e DevSecOps.*
