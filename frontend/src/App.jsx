import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, Server, AlertTriangle, CheckCircle2, Shield,
  Wifi, WifiOff, Clock, TrendingUp, Zap, Globe, Cloud,
  ArrowUpRight, ArrowDownRight, Radio, Eye, Gauge,
} from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const [selectedView, setSelectedView] = useState('grid');

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

  const globalStats = useMemo(() => {
    if (!summaryData.length) return { totalPings: 0, avgLatency: 0, packetLoss: 0, uptime: 0, healthyNodes: 0 };
    const totalPings = summaryData.reduce((sum, s) => sum + (s.total_pings || 0), 0);
    const totalSuccess = summaryData.reduce((sum, s) => sum + (s.successful || 0), 0);
    const avgLatency = summaryData.reduce((sum, s) => sum + (s.avg_latency || 0), 0) / summaryData.length;
    const packetLoss = totalPings > 0 ? ((totalPings - totalSuccess) / totalPings * 100) : 0;
    const uptime = totalPings > 0 ? (totalSuccess / totalPings * 100) : 0;
    const healthyNodes = summaryData.filter(s => {
      const loss = s.total_pings > 0 ? ((s.total_pings - s.successful) / s.total_pings * 100) : 100;
      return loss < 5;
    }).length;
    return { totalPings, avgLatency: avgLatency.toFixed(1), packetLoss: packetLoss.toFixed(1), uptime: uptime.toFixed(1), healthyNodes };
  }, [summaryData]);

  const formatTime = (tick) => {
    try { return format(new Date(tick + 'Z'), 'HH:mm:ss'); }
    catch { return tick; }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{ background: 'rgba(10,17,32,0.95)', backdropFilter: 'blur(12px)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <p style={{ color: '#7b8fad', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{formatTime(label)}</p>
          <p style={{ color: payload[0].color, fontWeight: 700, fontSize: 18 }}>{d.latency_ms} ms</p>
          <p style={{ color: d.status === 'sucesso' ? '#10b981' : '#ef4444', fontSize: 11, marginTop: 3 }}>
            {d.status === 'sucesso' ? '● Resposta OK' : '● Timeout / Perda'}
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
        <p style={{ color: '#4a6085', fontSize: 13, fontWeight: 500 }}>Inicializando monitor de rede...</p>
      </div>
    );
  }

  return (
    <div className="bg-grid" style={{ minHeight: '100vh', padding: '28px 36px' }}>
      {/* HEADER */}
      <header className="fade-in" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)'
            }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#e8edf5' }}>
                NetOps Latency Analyzer
              </h1>
              <p style={{ color: '#4a6085', fontSize: 12.5, marginTop: 2 }}>
                Monitoramento autônomo de conectividade, jitter e perda de pacotes · {Object.keys(metricsData).length} nós ativos
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: 'rgba(10,17,32,0.8)', border: '1px solid rgba(22,32,64,0.8)', borderRadius: 10, overflow: 'hidden' }}>
            {[{label:'Grid', v:'grid'},{label:'Tabela', v:'table'}].map(({label,v}) => (
              <button key={v} onClick={() => setSelectedView(v)} style={{
                padding: '7px 14px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: selectedView === v ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: selectedView === v ? '#3b82f6' : '#4a6085',
                transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4a6085', fontSize: 12, background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '7px 14px' }}>
            <Clock size={13} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{lastUpdate ? format(lastUpdate, 'HH:mm:ss') : '--'}</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginLeft: 4 }} className="pulse-green" />
          </div>
        </div>
      </header>

      {/* STATS ROW */}
      <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Latência Média', value: globalStats.avgLatency, unit: 'ms', icon: Gauge, color: '#3b82f6' },
          { label: 'Perda de Pacotes', value: globalStats.packetLoss, unit: '%', icon: parseFloat(globalStats.packetLoss) > 5 ? WifiOff : Wifi, color: parseFloat(globalStats.packetLoss) > 5 ? '#ef4444' : '#10b981' },
          { label: 'Uptime', value: globalStats.uptime, unit: '%', icon: CheckCircle2, color: '#10b981' },
          { label: 'Total de Pings', value: globalStats.totalPings, unit: '', icon: Radio, color: '#7b8fad' },
          { label: 'Nós Saudáveis', value: `${globalStats.healthyNodes}/${summaryData.length}`, unit: '', icon: Shield, color: '#06b6d4' },
        ].map(({ label, value, unit, icon: Ic, color }, i) => (
          <div key={i} className="stat-card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#4a6085', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {value}{unit && <span style={{ fontSize: 13, fontWeight: 400, color: '#4a6085', marginLeft: 3 }}>{unit}</span>}
                </p>
              </div>
              <Ic size={26} style={{ color, opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* CHART / TABLE VIEW */}
      {selectedView === 'grid' ? (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {Object.keys(metricsData).map((ip, idx) => {
            const nodeData = metricsData[ip];
            const info = IP_INFO[ip] || { label: ip, color: '#3b82f6', icon: Server };
            const IconComp = info.icon;
            const latest = nodeData[nodeData.length - 1] || {};
            const summary = summaryData.find(s => s.target_ip === ip) || {};
            const isSuccess = latest.status === 'sucesso';
            const isStable = isSuccess && latest.latency_ms < 100;
            const statusColor = !isSuccess ? '#ef4444' : isStable ? '#10b981' : '#f59e0b';
            const statusLabel = !isSuccess ? 'Instável' : isStable ? 'Estável' : 'Alta Latência';
            const pulseClass = !isSuccess ? 'pulse-red' : isStable ? 'pulse-green' : 'pulse-amber';
            const uptimePct = summary.total_pings > 0 ? ((summary.successful || 0) / summary.total_pings * 100).toFixed(1) : 0;

            return (
              <div key={ip} className="glass-card" style={{ padding: '20px 24px', animationDelay: `${idx * 40}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `linear-gradient(135deg, ${info.color}18, ${info.color}08)`,
                      border: `1px solid ${info.color}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <IconComp size={20} style={{ color: info.color }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5' }}>{info.label}</h2>
                      <p style={{ fontSize: 11.5, color: '#4a6085', fontFamily: "'JetBrains Mono', monospace" }}>{ip}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <div className={pulseClass} style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                      <span style={{ color: statusColor, fontSize: 11.5, fontWeight: 600 }}>{statusLabel}</span>
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 800, color: statusColor, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {latest.latency_ms || 0}<span style={{ fontSize: 12, fontWeight: 400, color: '#4a6085', marginLeft: 3 }}>ms</span>
                    </p>
                  </div>
                </div>

                {/* Mini stats row */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Média', value: `${summary.avg_latency || '--'} ms`, bg: 'rgba(6,182,212,0.06)', color: '#06b6d4' },
                    { label: 'Min', value: `${summary.min_latency || '--'} ms`, bg: 'rgba(16,185,129,0.06)', color: '#10b981' },
                    { label: 'Max', value: `${summary.max_latency || '--'} ms`, bg: 'rgba(239,68,68,0.06)', color: '#ef4444' },
                    { label: 'Uptime', value: `${uptimePct}%`, bg: 'rgba(59,130,246,0.06)', color: '#3b82f6' },
                  ].map(({ label, value, bg, color }) => (
                    <div key={label} style={{ flex: 1, background: bg, borderRadius: 8, padding: '7px 10px' }}>
                      <p style={{ color: '#4a6085', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                      <p style={{ color, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ height: 140, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={nodeData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${ip}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={info.color} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={info.color} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,32,64,0.5)" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="#1e2d55" tickFormatter={formatTime} tick={{ fontSize: 9.5, fill: '#4a6085' }} minTickGap={50} axisLine={{ stroke: '#162040' }} />
                      <YAxis stroke="#1e2d55" tick={{ fontSize: 9.5, fill: '#4a6085' }} axisLine={{ stroke: '#162040' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="latency_ms" stroke={info.color} strokeWidth={2} fill={`url(#grad-${ip})`} dot={false}
                        activeDot={{ r: 5, fill: info.color, stroke: '#050a14', strokeWidth: 2 }} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={16} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Visão Geral dos Nós</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#4a6085', fontFamily: "'JetBrains Mono', monospace" }}>{summaryData.length} endpoints</span>
          </div>
          <table className="summary-table">
            <thead><tr>
              <th>Alvo</th><th>IP</th><th>Status</th><th>Latência Atual</th><th>Média</th><th>Min</th><th>Max</th><th>Uptime</th>
            </tr></thead>
            <tbody>
              {summaryData.map(s => {
                const info = IP_INFO[s.target_ip] || { label: s.target_ip, color: '#3b82f6', icon: Server };
                const latest = (metricsData[s.target_ip] || []).slice(-1)[0] || {};
                const isOk = latest.status === 'sucesso';
                const uptimePct = s.total_pings > 0 ? ((s.successful || 0) / s.total_pings * 100).toFixed(1) : '0';
                return (
                  <tr key={s.target_ip}>
                    <td style={{ fontWeight: 600 }}>{info.label}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4a6085' }}>{s.target_ip}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: isOk ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.72rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOk ? '#10b981' : '#ef4444' }} />
                        {isOk ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: info.color, fontVariantNumeric: 'tabular-nums' }}>{latest.latency_ms || 0} ms</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{s.avg_latency || '--'} ms</td>
                    <td style={{ color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{s.min_latency || '--'} ms</td>
                    <td style={{ color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{s.max_latency || '--'} ms</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="health-bar" style={{ flex: 1 }}>
                          <div className="health-fill" style={{ width: `${uptimePct}%`, background: parseFloat(uptimePct) > 95 ? '#10b981' : parseFloat(uptimePct) > 80 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#7b8fad' }}>{uptimePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="fade-in" style={{ marginTop: 28, textAlign: 'center', color: '#1e2d55', fontSize: 11.5 }}>
        <p>NetOps Latency Analyzer · FastAPI + React + Docker · Engenharia de Confiabilidade (SRE)</p>
      </footer>
    </div>
  );
}

export default App;
