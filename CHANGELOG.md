# Changelog

## [2.0.0] - 2026-05-14

### 🎨 Redesign Completo
- Novo Design System "Mission Control" com tema deep blue cybernetic
- JetBrains Mono para dados técnicos e timestamps
- Cards glassmorphic com top-accent gradient lines
- Dot grid background com glow radial azul
- Animated pulse indicators (green/amber/red)

### ✨ Novas Funcionalidades
- **Toggle Grid/Tabela** — alterna entre cards de charts e tabela resumo com health bars
- **5 Stat Cards** — Latência Média, Perda de Pacotes, Uptime, Total de Pings, Nós Saudáveis
- **Uptime por Nó** — cada card exibe porcentagem individual de disponibilidade
- **Tabela Sumário** — visão consolidada de todos os nós com status, latência e health bar
- **Healthy Nodes Counter** — indicador de quantos nós estão abaixo de 5% de perda

### 🔧 Melhorias
- 4 mini stats por card (Média, Min, Max, Uptime)
- Tooltip custom com backdrop-blur e status visual
- Grid de charts com animation delay escalonado
- Header com relógio e pulse indicator live

---

## [1.0.0] - 2026-05-06

### Release Inicial
- Monitoramento ICMP de 10 endpoints com async polling
- Gráficos Recharts com séries temporais
- API FastAPI com aiosqlite
- Docker Compose com ICMP rootless
