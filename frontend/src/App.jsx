import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const IP_INFO = {
  '8.8.8.8':        { label: 'Google DNS',           color: '#00dbe7', icon: 'dns' },
  '8.8.4.4':        { label: 'Google DNS (Sec)',      color: '#00dbe7', icon: 'dns' },
  '1.1.1.1':        { label: 'Cloudflare DNS',       color: '#00e639', icon: 'bolt' },
  '1.0.0.1':        { label: 'Cloudflare DNS (Sec)',  color: '#00e639', icon: 'bolt' },
  '9.9.9.9':        { label: 'Quad9 DNS',            color: '#00dbe7', icon: 'shield' },
  '208.67.222.222': { label: 'OpenDNS (Cisco)',       color: '#00e639', icon: 'router' },
  '8.26.56.26':     { label: 'Comodo Secure DNS',    color: '#ffb4ab', icon: 'security' },
  '94.140.14.14':   { label: 'AdGuard DNS',          color: '#00e639', icon: 'verified_user' },
  '3.218.180.0':    { label: 'AWS us-east-1',        color: '#00dbe7', icon: 'cloud' },
};

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'hub', label: 'Topology' },
  { icon: 'router', label: 'Inventory' },
  { icon: 'terminal', label: 'Alert Logs' },
  { icon: 'analytics', label: 'Traffic' },
];

function App() {
  const [metricsData, setMetricsData] = useState({});
  const [summaryData, setSummaryData] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedView, setSelectedView] = useState('grid');
  const [alerts, setAlerts] = useState([
    { time: '14:02:11', type: 'critical', title: 'CRITICAL: UNAUTHORIZED ACCESS ATTEMPT', detail: 'Target: Subnet 10.0.4.2 | Action: Blocked' },
    { time: '14:01:45', type: 'warning', title: 'WARNING: HIGH LATENCY SPIKE', detail: 'Node: AMS-04-A | Latency: 342ms' },
    { time: '13:58:22', type: 'info', title: 'INFO: SYNC_COMPLETE', detail: 'Registry updated for 14 clusters.' },
    { time: '13:55:01', type: 'info', title: 'INFO: AUTOMATED_BACKUP', detail: 'Snapshot s-4921-b stored successfully.', faded: true },
    { time: '13:50:45', type: 'warning', title: 'WARNING: FAN_FAILURE_PREDICTED', detail: 'Chassis 02: Temp rising +2C/min.', faded: true },
  ]);
  const alertIntervalRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/api/metrics`),
        axios.get(`${API_URL}/api/summary`)
      ]);
      setMetricsData(metricsRes.data.data);
      setSummaryData(summaryRes.data.data);
      if (summaryRes.data.ai_insights && summaryRes.data.ai_insights.insights) {
        setAiInsights(summaryRes.data.ai_insights.insights);
      }
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      // Mock data fallback when backend is unavailable
      if (loading) {
        const mockSummary = Object.keys(IP_INFO).map(ip => ({
          target: ip,
          total_pings: Math.floor(Math.random() * 500) + 200,
          successful: Math.floor(Math.random() * 450) + 180,
          avg_latency: parseFloat((Math.random() * 80 + 10).toFixed(1)),
          min_latency: parseFloat((Math.random() * 20 + 2).toFixed(1)),
          max_latency: parseFloat((Math.random() * 200 + 50).toFixed(1)),
          jitter: parseFloat((Math.random() * 15 + 1).toFixed(1)),
          last_status: Math.random() > 0.1 ? 'success' : 'timeout',
        }));
        const mockMetrics = {};
        Object.keys(IP_INFO).forEach(ip => {
          mockMetrics[ip] = Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - (20 - i) * 5000).toISOString(),
            latency_ms: parseFloat((Math.random() * 60 + 8).toFixed(1)),
            status: 'success',
          }));
        });
        setSummaryData(mockSummary);
        setMetricsData(mockMetrics);
        setAiInsights([
          { severity: 'warning', message: 'Latency spike detected on AWS us-east-1 node', target: '3.218.180.0' },
          { severity: 'info', message: 'All DNS resolvers responding within normal parameters', target: '8.8.8.8' },
          { severity: 'info', message: 'Network jitter stable across all monitored endpoints', target: '1.1.1.1' },
        ]);
        setLoading(false);
        setLastUpdate(new Date());
      }
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Periodic alert generation
  useEffect(() => {
    alertIntervalRef.current = setInterval(() => {
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                      now.getMinutes().toString().padStart(2, '0') + ':' +
                      now.getSeconds().toString().padStart(2, '0');
      const newAlert = {
        time: timeStr,
        type: 'info',
        title: `INFO: PING_ACK_NODE_${Math.floor(Math.random() * 100)}`,
        detail: 'Verification sequence complete.'
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 20));
    }, 8000);
    return () => clearInterval(alertIntervalRef.current);
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
        <div className="bg-surface-container-high border border-outline-variant p-3" style={{ backdropFilter: 'blur(12px)' }}>
          <p className="font-data-mono text-on-surface-variant" style={{ fontSize: 10 }}>{formatTime(label)}</p>
          <p className="font-data-mono font-bold text-primary-fixed-dim" style={{ fontSize: 18 }}>{d.latency_ms} ms</p>
          <p className="font-code-sm" style={{ fontSize: 10, color: d.status === 'sucesso' ? '#00e639' : '#ffb4ab' }}>
            {d.status === 'sucesso' ? '● Response OK' : '● Timeout / Loss'}
          </p>
        </div>
      );
    }
    return null;
  };

  const alertBorderColor = (type) => {
    if (type === 'critical') return 'border-on-tertiary-container';
    if (type === 'warning') return 'border-secondary-fixed';
    return 'border-primary-fixed-dim';
  };

  const alertTextColor = (type) => {
    if (type === 'critical') return 'text-on-tertiary-container';
    if (type === 'warning') return 'text-secondary-fixed';
    return 'text-primary-fixed-dim';
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="spinner" />
        <p className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          INITIALIZING NET-OPS COMMAND SYSTEMS...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface min-h-screen overflow-hidden relative scanlines" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* ===== TOP NAV BAR ===== */}
      <header className="fixed top-0 w-full bg-surface/60 flex items-center justify-between px-6 h-16 z-50"
              style={{ backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(58, 73, 75, 0.3)' }}>
        <div className="flex items-center gap-4">
          <span className="text-primary-container font-extrabold tracking-tighter"
                style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(0,242,255,0.5))' }}>
            NET-OPS COMMAND
          </span>
          <div className="hidden md:flex gap-4 items-center ml-8" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
            <a className="text-primary border-b-2 border-primary-fixed-dim py-1 cursor-pointer">System Status</a>
            <a className="text-on-surface-variant hover:text-primary transition-all px-2 py-1 cursor-pointer">Breadcrumbs</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              className="bg-surface-container border-b border-outline-variant px-3 py-1 focus:outline-none focus:border-primary transition-colors text-on-surface"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              placeholder="QUERY_SYS..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-2 top-1.5 text-on-surface-variant" style={{ fontSize: 16 }}>search</span>
          </div>
          <button className="bg-primary/10 border border-primary/40 text-primary px-4 py-1 hover:bg-primary/20 active:scale-95 transition-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
            ADMIN_ACCESS
          </button>
          <div className="flex gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary">settings</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary">notifications</span>
            <div className="w-8 h-8 bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>person</span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== SIDE NAV ===== */}
      <nav className="fixed left-0 top-16 w-64 bg-surface-container-lowest/80 border-r border-outline-variant/20 hidden md:flex flex-col py-4 z-40"
           style={{ height: 'calc(100vh - 64px - 32px)', backdropFilter: 'blur(8px)' }}>
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 breathing-glow" style={{ background: '#00e639', boxShadow: '0 0 8px rgba(0,230,57,0.5)' }} />
            <div>
              <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }} className="text-secondary">
                NODE_01
              </h3>
              <p className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>V.2.4.0-STABLE</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                item.active
                  ? 'bg-secondary-container/20 text-secondary-fixed border-l-4 border-secondary-fixed'
                  : 'text-on-surface-variant opacity-70 hover:bg-surface-variant/40 hover:text-primary border-l-4 border-transparent'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, boxShadow: item.active ? '0 0 10px rgba(0,230,57,0.3)' : 'none' }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
        <div className="px-4 pt-4">
          <button
            className="w-full py-3 border border-secondary-fixed-dim text-secondary-fixed-dim hover:bg-secondary-fixed-dim/10 transition-all active:scale-95"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}
          >
            INITIATE_SCAN
          </button>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="mt-16 ml-0 md:ml-64 p-4 overflow-y-auto no-scrollbar pb-12"
            style={{ height: 'calc(100vh - 64px - 32px)' }}>
        <div className="grid grid-cols-12 gap-4">

          {/* --- 4 Health Cards --- */}
          {[
            { label: 'CPU_LOAD', value: `${globalStats.avgLatency}ms`, icon: 'memory', color: 'primary', sparkColor: '#00dbe7',
              path: 'M0 25 L10 20 L20 22 L30 10 L40 15 L50 5 L60 18 L70 12 L80 15 L90 2 L100 8' },
            { label: 'RAM_USAGE', value: `${globalStats.packetLoss}%`, icon: 'reorder', color: 'secondary', sparkColor: '#00e639',
              path: 'M0 15 L15 18 L30 14 L45 16 L60 12 L75 14 L90 10 L100 12' },
            { label: 'BANDWIDTH', value: `${globalStats.uptime}%`, icon: 'speed', color: 'primary', sparkColor: '#00dbe7',
              path: 'M0 20 L20 18 L40 22 L60 8 L80 12 L100 10' },
            { label: 'LATENCY', value: `${globalStats.healthyNodes}/${summaryData.length}`, icon: 'timer', color: 'tertiary', sparkColor: '#ffb4ab',
              path: 'M0 10 L20 12 L40 8 L60 10 L80 12 L100 8' },
          ].map((card, i) => {
            const hoverBorder = card.color === 'primary' ? 'hover:border-primary-fixed-dim'
              : card.color === 'secondary' ? 'hover:border-secondary-fixed-dim'
              : 'hover:border-tertiary-fixed-dim';
            const valueColor = card.color === 'primary' ? 'text-primary-container'
              : card.color === 'secondary' ? 'text-secondary-fixed-dim'
              : 'text-tertiary-fixed-dim';
            return (
              <div key={i} className={`col-span-12 md:col-span-3 glass-panel p-4 flex flex-col justify-between group transition-all ${hoverBorder}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                      {card.label}
                    </p>
                    <h2 className={`${valueColor}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, lineHeight: 1.2, fontWeight: 600 }}>
                      {card.value}
                    </h2>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: card.sparkColor }}>{card.icon}</span>
                </div>
                <div className="h-12 w-full mt-2 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" fill="none" style={{ stroke: card.sparkColor }}>
                    <path d={card.path} strokeLinecap="round" strokeWidth="2" />
                    {i === 0 && <circle className="animate-pulse" cx="90" cy="2" r="2" fill="#00dbe7" />}
                  </svg>
                </div>
              </div>
            );
          })}

          {/* --- Topology Map --- */}
          <div className="col-span-12 md:col-span-8 glass-panel relative overflow-hidden group" style={{ height: 400 }}>
            <div className="absolute top-4 left-4 z-10">
              <h3 className="text-primary mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                NETWORK_TOPOLOGY_LIVE
              </h3>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-primary/20 text-primary-fixed-dim border border-primary/30"
                      style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>SCANNING...</span>
                <span className="px-2 py-0.5 bg-secondary-container/10 text-secondary-fixed border border-secondary-fixed/30"
                      style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>NODES_STABLE: {Object.keys(metricsData).length || 142}</span>
              </div>
            </div>
            {/* Grid background */}
            <div className="absolute inset-0 opacity-40"
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(132, 148, 149, 0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            {/* Topology nodes */}
            <div className="w-full h-full cursor-crosshair relative">
              {summaryData.slice(0, 5).map((s, idx) => {
                const info = IP_INFO[s.target_ip] || { label: s.target_ip, color: '#00dbe7', icon: 'router' };
                const positions = [
                  { top: '25%', left: '15%' },
                  { top: '50%', left: '45%' },
                  { top: '70%', left: '25%' },
                  { top: '35%', left: '70%' },
                  { top: '60%', left: '75%' },
                ];
                const pos = positions[idx] || positions[0];
                const isOnline = ((metricsData[s.target_ip] || []).slice(-1)[0] || {}).status === 'sucesso';
                const dotColor = isOnline ? info.color : '#ffb4ab';
                return (
                  <div key={s.target_ip} className="absolute group/node" style={{ top: pos.top, left: pos.left }}>
                    <div className="animate-pulse" style={{ width: idx === 1 ? 16 : 12, height: idx === 1 ? 16 : 12, background: dotColor, boxShadow: `0 0 15px ${dotColor}99` }} />
                    <div className="absolute top-4 left-4 whitespace-nowrap bg-background/80 p-1 border border-outline-variant opacity-0 group-hover/node:opacity-100 transition-opacity"
                         style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                      {info.label} [{s.target_ip}]
                    </div>
                  </div>
                );
              })}
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                <line x1="15%" y1="25%" x2="45%" y2="50%" stroke="#00dbe7" strokeDasharray="4" strokeWidth="1" />
                <line x1="45%" y1="50%" x2="25%" y2="70%" stroke="#00e639" strokeWidth="2" />
                <line x1="45%" y1="50%" x2="70%" y2="35%" stroke="#00dbe7" strokeDasharray="4" strokeWidth="1" />
                <line x1="70%" y1="35%" x2="75%" y2="60%" stroke="#00e639" strokeWidth="1" />
                <circle className="animate-ping" cx="30%" cy="37%" r="2" fill="#fff" style={{ animationDuration: '3s' }} />
              </svg>
            </div>
          </div>

          {/* --- Alert Stream --- */}
          <div className="col-span-12 md:col-span-4 glass-panel flex flex-col" style={{ height: 400 }}>
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="text-primary" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                ALERT_STREAM
              </h3>
              <span className="text-on-surface-variant animate-pulse" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                LIVE FEED
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`flex gap-3 items-start border-l-2 ${alertBorderColor(alert.type)} pl-3 py-1 ${alert.faded ? 'opacity-60' : ''}`}>
                  <div className="text-on-surface-variant pt-0.5" style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                    {alert.time}
                  </div>
                  <div className="flex-1">
                    <p className={`${alertTextColor(alert.type)} uppercase ${alert.type === 'critical' || alert.type === 'warning' ? 'font-bold' : ''}`}
                       style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                      {alert.title}
                    </p>
                    <p className="text-on-surface-variant mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                      {alert.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-outline-variant/30 text-center">
              <button className="text-primary-fixed-dim hover:underline uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                Export Logs (.raw)
              </button>
            </div>
          </div>

          {/* --- Traffic Charts (Ingress / Egress) --- */}
          <div className="col-span-12 md:col-span-6 glass-panel p-4 flex flex-col" style={{ height: 220 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                INGRESS_TRAFFIC (60M)
              </h3>
              <p className="text-primary-fixed-dim" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                AVG: {globalStats.avgLatency} ms
              </p>
            </div>
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ingressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00dbe7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 80 Q 50 70, 100 85 T 200 60 T 300 75 T 400 40 T 500 50 L 500 100 L 0 100 Z" fill="url(#ingressGradient)" />
                <path d="M0 80 Q 50 70, 100 85 T 200 60 T 300 75 T 400 40 T 500 50" fill="none" stroke="#00dbe7" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 glass-panel p-4 flex flex-col" style={{ height: 220 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                EGRESS_TRAFFIC (60M)
              </h3>
              <p className="text-secondary-fixed-dim" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                AVG: {globalStats.packetLoss}%
              </p>
            </div>
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="egressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e639" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00e639" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 90 Q 70 80, 150 95 T 250 70 T 350 85 T 450 50 T 500 60 L 500 100 L 0 100 Z" fill="url(#egressGradient)" />
                <path d="M0 90 Q 70 80, 150 95 T 250 70 T 350 85 T 450 50 T 500 60" fill="none" stroke="#00e639" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* --- Per-node detail cards (Grid View) or Table View --- */}
          {selectedView === 'grid' ? (
            <>
              <div className="col-span-12 flex items-center justify-between px-1 mt-2">
                <h3 className="text-primary" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                  NODE_DETAIL_VIEW
                </h3>
                <div className="flex" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {[{ label: 'GRID', v: 'grid' }, { label: 'TABLE', v: 'table' }].map(({ label, v }) => (
                    <button
                      key={v}
                      onClick={() => setSelectedView(v)}
                      className={`px-3 py-1 border transition-all ${
                        selectedView === v
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'text-on-surface-variant border-outline-variant hover:text-primary'
                      }`}
                      style={{ letterSpacing: '0.1em', fontWeight: 700 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {Object.keys(metricsData).map((ip, idx) => {
                const nodeData = metricsData[ip];
                const info = IP_INFO[ip] || { label: ip, color: '#00dbe7', icon: 'router' };
                const latest = nodeData[nodeData.length - 1] || {};
                const summary = summaryData.find(s => s.target_ip === ip) || {};
                const isSuccess = latest.status === 'sucesso';
                const isStable = isSuccess && latest.latency_ms < 100;
                const statusColor = !isSuccess ? '#ffb4ab' : isStable ? '#00e639' : '#00dbe7';
                const statusLabel = !isSuccess ? 'UNSTABLE' : isStable ? 'STABLE' : 'HIGH_LAT';
                const uptimePct = summary.total_pings > 0 ? ((summary.successful || 0) / summary.total_pings * 100).toFixed(1) : 0;

                const ai = aiInsights.find(a => a.target_ip === ip) || {
                  z_score: 0.12, stability_index: 99.4, anomaly_status: 'Neural Normal', trend_prediction: 'Stable', status_color: 'green'
                };
                const badgeColor = ai.status_color === 'red' ? '#ffb4ab' : ai.status_color === 'amber' ? '#00dbe7' : '#00e639';

                return (
                  <div key={ip} className="col-span-12 md:col-span-6 lg:col-span-4 glass-panel p-4 fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center border border-outline-variant"
                             style={{ background: `${info.color}10` }}>
                          <span className="material-symbols-outlined" style={{ color: info.color, fontSize: 20 }}>{info.icon}</span>
                        </div>
                        <div>
                          <h2 className="text-on-surface font-semibold" style={{ fontSize: 14 }}>{info.label}</h2>
                          <p className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{ip}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-2 h-2" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                          <span style={{ color: statusColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: 22, fontWeight: 700, color: statusColor, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                          {latest.latency_ms || 0}<span className="text-on-surface-variant" style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>ms</span>
                        </p>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {[
                        { label: 'AVG', value: `${summary.avg_latency || '--'}ms`, color: '#00dbe7' },
                        { label: 'MIN', value: `${summary.min_latency || '--'}ms`, color: '#00e639' },
                        { label: 'MAX', value: `${summary.max_latency || '--'}ms`, color: '#ffb4ab' },
                        { label: 'UP', value: `${uptimePct}%`, color: '#00dbe7' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex-1 bg-surface-container p-2" style={{ minWidth: 60 }}>
                          <p className="text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', fontWeight: 700 }}>{label}</p>
                          <p style={{ color, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* AI Z-Score Badge */}
                    <div className="mb-3 p-2 border" style={{ background: `${badgeColor}0d`, borderColor: `${badgeColor}33` }}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, fontFamily: "'JetBrains Mono', monospace" }}>
                          ⚡ AI Z-SCORE: {ai.z_score}σ
                        </span>
                        <span className="text-on-surface-variant" style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                          STAB: {ai.stability_index}%
                        </span>
                      </div>
                      <p className="text-on-surface" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                        {ai.anomaly_status} · <span className="text-on-surface-variant">{ai.trend_prediction}</span>
                      </p>
                    </div>

                    {/* Recharts Area */}
                    <div style={{ height: 120, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={nodeData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${ip}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={info.color} stopOpacity={0.25} />
                              <stop offset="100%" stopColor={info.color} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,73,75,0.4)" vertical={false} />
                          <XAxis dataKey="timestamp" stroke="#3a494b" tickFormatter={formatTime} tick={{ fontSize: 9, fill: '#849495' }} minTickGap={50} axisLine={{ stroke: '#3a494b' }} />
                          <YAxis stroke="#3a494b" tick={{ fontSize: 9, fill: '#849495' }} axisLine={{ stroke: '#3a494b' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="latency_ms" stroke={info.color} strokeWidth={2} fill={`url(#grad-${ip})`} dot={false}
                            activeDot={{ r: 4, fill: info.color, stroke: '#051424', strokeWidth: 2 }} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div className="col-span-12 flex items-center justify-between px-1 mt-2">
                <h3 className="text-primary" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
                  NODE_TABLE_VIEW
                </h3>
                <div className="flex" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {[{ label: 'GRID', v: 'grid' }, { label: 'TABLE', v: 'table' }].map(({ label, v }) => (
                    <button
                      key={v}
                      onClick={() => setSelectedView(v)}
                      className={`px-3 py-1 border transition-all ${
                        selectedView === v
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'text-on-surface-variant border-outline-variant hover:text-primary'
                      }`}
                      style={{ letterSpacing: '0.1em', fontWeight: 700 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-12 glass-panel overflow-hidden">
                <div className="p-4 border-b border-outline-variant/30 flex items-center gap-3 bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontSize: 18 }}>visibility</span>
                  <span className="text-on-surface font-semibold" style={{ fontSize: 13 }}>Node Overview</span>
                  <span className="ml-auto text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                    {summaryData.length} endpoints
                  </span>
                </div>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="summary-table" style={{ width: '100%', minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>Target</th><th>IP</th><th>Status</th><th>Current</th><th>Avg</th><th>Min</th><th>Max</th><th>Uptime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.map(s => {
                        const info = IP_INFO[s.target_ip] || { label: s.target_ip, color: '#00dbe7', icon: 'router' };
                        const latest = (metricsData[s.target_ip] || []).slice(-1)[0] || {};
                        const isOk = latest.status === 'sucesso';
                        const uptimePct = s.total_pings > 0 ? ((s.successful || 0) / s.total_pings * 100).toFixed(1) : '0';
                        return (
                          <tr key={s.target_ip}>
                            <td style={{ fontWeight: 600 }}>{info.label}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#849495' }}>{s.target_ip}</td>
                            <td>
                              <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, color: isOk ? '#00e639' : '#ffb4ab' }}>
                                <span style={{ width: 6, height: 6, display: 'inline-block', background: isOk ? '#00e639' : '#ffb4ab' }} />
                                {isOk ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: info.color, fontVariantNumeric: 'tabular-nums' }}>{latest.latency_ms || 0} ms</td>
                            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{s.avg_latency || '--'} ms</td>
                            <td style={{ color: '#00e639', fontVariantNumeric: 'tabular-nums' }}>{s.min_latency || '--'} ms</td>
                            <td style={{ color: '#ffb4ab', fontVariantNumeric: 'tabular-nums' }}>{s.max_latency || '--'} ms</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="health-bar" style={{ flex: 1 }}>
                                  <div className="health-fill" style={{ width: `${uptimePct}%`, background: parseFloat(uptimePct) > 95 ? '#00e639' : parseFloat(uptimePct) > 80 ? '#00dbe7' : '#ffb4ab' }} />
                                </div>
                                <span className="text-on-surface-variant" style={{ fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{uptimePct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===== FOOTER STATUS BAR ===== */}
      <footer className="fixed bottom-0 w-full h-8 bg-surface-container-highest/90 border-t border-primary/20 flex justify-between items-center px-6 z-50"
              style={{ backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-4">
          <span className="text-secondary-fixed animate-pulse"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
            SYSTEM_HEARTBEAT: ACTIVE
          </span>
          <div className="h-1 w-12 bg-outline-variant overflow-hidden">
            <div className="h-full bg-primary-fixed-dim" style={{ width: '33%', animation: 'slide 2s infinite linear' }} />
          </div>
        </div>
        <div className="flex items-center gap-6" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', fontWeight: 700 }}>
          <span className="text-outline">
            UPTIME: {lastUpdate ? format(lastUpdate, 'HH:mm:ss') : '--'}
          </span>
          <span className="text-outline">SESSIONS: {Object.keys(metricsData).length.toString().padStart(2, '0')}</span>
          <span className="text-on-tertiary-container font-bold px-2" style={{ background: 'rgba(194, 0, 20, 0.1)' }}>
            THREAT_LEVEL: {parseFloat(globalStats.packetLoss) > 5 ? 'HIGH' : 'LOW'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
