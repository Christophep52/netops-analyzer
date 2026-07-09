# Changelog

## [2.0.0] - 2026-07-09

### Arquitetura Enterprise V2 & Next.js 16
- Migração completa para Next.js 16 (App Router + Turbopack) na pasta `frontend-next/`
- Design System Mission Control com tema dark, Tailwind CSS e Framer Motion
- Motor AIOps com Scikit-Learn `IsolationForest` real para detecção não supervisionada de anomalias
- Abas de navegação no topo (Dashboard Geral, Topologia de Rede, Inventário de Dispositivos, Log de Alertas e Tráfego ao Vivo)
- Exportação de relatório em CSV das métricas e status de cada host monitorado
- Arquitetura independente desacoplada em repositório próprio

---

## [1.0.0] - 2026-05-06

### Release Inicial
- Monitoramento ICMP de endpoints com async polling
- Gráficos Recharts com séries temporais
- API FastAPI com banco de dados
- Docker Compose com monitoramento e persistência
