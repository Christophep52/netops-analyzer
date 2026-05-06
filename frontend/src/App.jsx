import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, Server, AlertTriangle, CheckCircle2, Shield,
  Wifi, WifiOff, Clock, TrendingUp, Zap, Globe, Cloud
} from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Mapeamento de IP para informacoes de exibicao
const IP_INFO = {
  '8.8.8.8':        { label: 'Google DNS',           color: '#3b82f6', icon: Globe },
  '8.8.4.4':        { label: 'Google DNS (Sec)',      color: '#60a5fa', icon: Globe },
  '1.1.1.1':        { label: 'Cloudflare DNS',       color: '#f59e0b', icon: Zap },
  '1.0.0.1':        { label: 'Cloudflare DNS (Sec)',  color: '#fbbf24', icon: Zap },
  '9.9.9.9':        { label: 'Quad9 DNS',            color: '#10b981', icon: Shield },
  '208.67.222.222': { label: 'OpenDNS (Cisco)',       color: '#06b6d4', icon: Server },
  '8.26.56.26':     { label: 'Comodo Secure DNS',    color: '#ec4899', icon: Shield },
  '94.140.14.14':   { label: 'AdGuard DNS',          color: '#22c55e', icon: Shield },
  '104.160.131.3':  { label: 'Riot Games (NA)',       color: '#8b5cf6', icon: Activity },
  '3.218.180.0':    { label: 'AWS us-east-1',        color: '#f97316', icon: Cloud },
};

function App() {
  const [metricsData, setMetricsData] = useState({});
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/api/metrics`),
        axios.get(`${API_URL}/api/summary`)
      ]);
      setMetricsData(metricsRes.data.data);
      setSummaryData(summaryRes.data.data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Erro ao buscar metricas:", err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calcular estatisticas globais
  const globalStats = useMemo(() => {
    if (!summaryData.length) return { totalPings: 0, avgLatency: 0, packetLoss: 0, uptime: 0 };
    const totalPings = summaryData.reduce((sum, s) => sum + (s.total_pings || 0), 0);
    const totalSuccess = summaryData.reduce((sum, s) => sum + (s.successful || 0), 0);
    const avgLatency = summaryData.reduce((sum, s) => sum + (s.avg_latency || 0), 0) / summaryData.length;
    const packetLoss = totalPings > 0 ? ((totalPings - totalSuccess) / totalPings * 100) : 0;
    const uptime = totalPings > 0 ? (totalSuccess / totalPings * 100) : 0;
    return {
      totalPings,
      avgLatency: avgLatency.toFixed(1),
      packetLoss: packetLoss.toFixed(1),
      uptime: uptime.toFixed(1)
    };
  }, [summaryData]);

  const formatTime = (tick) => {
    try {
      const d = new Date(tick + 'Z');
      return format(d, 'HH:mm:ss');
    } catch { return tick; }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass-card" style={{ padding: '12px 16px', border: '1px solid rgba(59,130,246,0.3)' }}>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{formatTime(label)}</p>
          <p style={{ color: payload[0].color, fontWeight: 700, fontSize: 16 }}>
            {d.latency_ms} ms
          </p>
          <p style={{ color: d.status === 'sucesso' ? '#10b981' : '#ef4444', fontSize: 11, marginTop: 2 }}>
            {d.status === 'sucesso' ? 'Resposta OK' : 'Timeout / Perda'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <p style={{ color: '#64748b', fontSize: 14 }}>Inicializando monitor de rede...</p>
      </div>
    );
  }

  return (
    <div className="bg-grid" style={{ minHeight: '100vh', padding: '32px 40px' }}>
      {/* HEADER */}
      <header className="fade-in" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(59,130,246,0.3)'
            }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <h1 className="glow-blue" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
                NetOps Latency Analyzer
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                Monitoramento autonomo de conectividade, jitter e perda de pacotes
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12 }}>
          <Clock size={14} />
          <span>Atualizado: {lastUpdate ? format(lastUpdate, 'HH:mm:ss') : '--'}</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginLeft: 4 }} className="pulse-green" />
        </div>
      </header>

      {/* STATS ROW */}
      <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="stat-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latencia Media</p>
              <p className="glow-blue" style={{ fontSize: 32, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                {globalStats.avgLatency}<span style={{ fontSize: 14, fontWeight: 400, color: '#475569', marginLeft: 4 }}>ms</span>
              </p>
            </div>
            <TrendingUp size={28} style={{ color: '#3b82f6', opacity: 0.6 }} />
          </div>
        </div>

        <div className="stat-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perda de Pacotes</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: parseFloat(globalStats.packetLoss) > 5 ? '#ef4444' : '#10b981', marginTop: 4 }}
                 className={parseFloat(globalStats.packetLoss) > 5 ? 'glow-red' : 'glow-green'}>
                {globalStats.packetLoss}<span style={{ fontSize: 14, fontWeight: 400, color: '#475569', marginLeft: 4 }}>%</span>
              </p>
            </div>
            {parseFloat(globalStats.packetLoss) > 5 ? <WifiOff size={28} style={{ color: '#ef4444', opacity: 0.6 }} /> : <Wifi size={28} style={{ color: '#10b981', opacity: 0.6 }} />}
          </div>
        </div>

        <div className="stat-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</p>
              <p className="glow-green" style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {globalStats.uptime}<span style={{ fontSize: 14, fontWeight: 400, color: '#475569', marginLeft: 4 }}>%</span>
              </p>
            </div>
            <CheckCircle2 size={28} style={{ color: '#10b981', opacity: 0.6 }} />
          </div>
        </div>

        <div className="stat-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Pings</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginTop: 4 }}>
                {globalStats.totalPings}
              </p>
            </div>
            <Server size={28} style={{ color: '#64748b', opacity: 0.6 }} />
          </div>
        </div>
      </div>

      {/* CHART CARDS */}
      <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {Object.keys(metricsData).map((ip, idx) => {
          const nodeData = metricsData[ip];
          const info = IP_INFO[ip] || { label: ip, color: '#3b82f6', icon: Server };
          const IconComp = info.icon;
          const latest = nodeData[nodeData.length - 1] || {};
          const summary = summaryData.find(s => s.target_ip === ip) || {};
          const isSuccess = latest.status === 'sucesso';
          const isStable = isSuccess && latest.latency_ms < 100;
          const statusColor = !isSuccess ? '#ef4444' : isStable ? '#10b981' : '#f59e0b';
          const statusLabel = !isSuccess ? 'Instavel' : isStable ? 'Estavel' : 'Alta Latencia';
          const pulseClass = !isSuccess ? 'pulse-red' : isStable ? 'pulse-green' : 'pulse-amber';

          return (
            <div key={ip} className="glass-card" style={{ padding: '20px 24px', animationDelay: `${idx * 50}ms` }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `linear-gradient(135deg, ${info.color}22, ${info.color}11)`,
                    border: `1px solid ${info.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <IconComp size={20} style={{ color: info.color }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{info.label}</h2>
                    <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{ip}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <div className={pulseClass} style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                    <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: statusColor, marginTop: 4 }}>
                    {latest.latency_ms || 0}<span style={{ fontSize: 12, fontWeight: 400, color: '#475569', marginLeft: 4 }}>ms</span>
                  </p>
                </div>
              </div>

              {/* Mini Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'rgba(6,182,212,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Media</p>
                  <p style={{ color: '#06b6d4', fontSize: 16, fontWeight: 700 }}>{summary.avg_latency || '--'} ms</p>
                </div>
                <div style={{ flex: 1, background: 'rgba(16,185,129,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min</p>
                  <p style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>{summary.min_latency || '--'} ms</p>
                </div>
                <div style={{ flex: 1, background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max</p>
                  <p style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>{summary.max_latency || '--'} ms</p>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 160, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={nodeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${ip}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={info.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={info.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#334155"
                      tickFormatter={formatTime}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      minTickGap={40}
                      axisLine={{ stroke: '#1e293b' }}
                    />
                    <YAxis
                      stroke="#334155"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      axisLine={{ stroke: '#1e293b' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="latency_ms"
                      stroke={info.color}
                      strokeWidth={2}
                      fill={`url(#grad-${ip})`}
                      dot={false}
                      activeDot={{ r: 5, fill: info.color, stroke: '#0c1222', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="fade-in" style={{ marginTop: 32, textAlign: 'center', color: '#334155', fontSize: 12 }}>
        <p>NetOps Latency Analyzer &middot; FastAPI + React + Docker &middot; Engenharia de Confiabilidade (SRE)</p>
      </footer>
    </div>
  );
}

export default App;
