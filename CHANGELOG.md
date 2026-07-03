# Changelog

## [2.0.0] - 2026-05-14

### ðŸŽ¨ Redesign Completo
- Novo Design System "Mission Control" com tema deep blue cybernetic
- JetBrains Mono para dados tÃ©cnicos e timestamps
- Cards glassmorphic com top-accent gradient lines
- Dot grid background com glow radial azul
- Animated pulse indicators (green/amber/red)

### âœ¨ Novas Funcionalidades
- **Toggle Grid/Tabela** â€” alterna entre cards de charts e tabela resumo com health bars
- **5 Stat Cards** â€” LatÃªncia MÃ©dia, Perda de Pacotes, Uptime, Total de Pings, NÃ³s SaudÃ¡veis
- **Uptime por NÃ³** â€” cada card exibe porcentagem individual de disponibilidade
- **Tabela SumÃ¡rio** â€” visÃ£o consolidada de todos os nÃ³s com status, latÃªncia e health bar
- **Healthy Nodes Counter** â€” indicador de quantos nÃ³s estÃ£o abaixo de 5% de perda

### ðŸ”§ Melhorias
- 4 mini stats por card (MÃ©dia, Min, Max, Uptime)
- Tooltip custom com backdrop-blur e status visual
- Grid de charts com animation delay escalonado
- Header com relÃ³gio e pulse indicator live

---

## [1.0.0] - 2026-05-06

### Release Inicial
- Monitoramento ICMP de 9 endpoints com async polling
- GrÃ¡ficos Recharts com sÃ©ries temporais
- API FastAPI com aiosqlite
- Docker Compose com ICMP rootless
