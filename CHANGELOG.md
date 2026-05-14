# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

---

## v1.0.0 — 2026-05-06

### ✨ Novas Funcionalidades

- **Monitoramento de 10 Endpoints**: Coleta simultânea de latência, jitter e perda de pacotes de 10 alvos de infraestrutura crítica (Google DNS, Cloudflare, Quad9, OpenDNS, Comodo, AdGuard, Riot Games, AWS)
- **Gráficos de Séries Temporais**: Visualização em tempo real da oscilação de latência com Recharts (AreaChart) e gradientes por nó
- **Detecção de Status**: Classificação automática de cada nó como Estável, Alta Latência ou Instável com indicadores visuais pulsantes
- **Mini Stats por Nó**: Cards compactos exibindo Média, Mín e Máx de latência para cada alvo monitorado
- **Polling Automático**: Atualização a cada 5 segundos sem necessidade de interação do usuário
- **Métricas Globais**: Dashboard agregado com Latência Média, Perda de Pacotes, Uptime e Total de Pings

### 🎨 Design & Interface

- Dark theme com grid pattern overlay e efeito de glassmorphism nos cards
- Glow text neon (azul, verde, vermelho) para destaque visual de métricas
- Indicadores pulsantes color-coded (verde/âmbar/vermelho) por estado de saúde
- Animações fade-in suaves na carga inicial
- Scrollbar estilizada e tooltips customizados nos gráficos
- Tipografia Inter com hierarquia de peso (300-800)

### 🏗️ Arquitetura

- **Backend**: FastAPI + Uvicorn (ASGI) com subprocessos assíncronos (`asyncio.create_subprocess_shell`) para 10 pings em paralelo
- **Frontend**: React 18 + Vite 8 + Tailwind CSS v4 + Recharts + Lucide Icons + date-fns
- **Banco de Dados**: SQLite via `aiosqlite` para I/O não-bloqueante
- **DevOps**: Docker Compose com sysctls para ICMP rootless (`net.ipv4.ping_group_range`)
- Detecção automática de SO (Windows/Linux/Mac) com regex unificado para parsing de ping
- Build multi-stage (Node 20 → Nginx) para o frontend containerizado

---

*Mantido conforme o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).*
