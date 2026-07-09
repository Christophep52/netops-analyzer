import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const IP_INFO = {
  '8.8.8.8':        { label: 'Google DNS',           color: '#06b6d4', icon: 'dns' },
  '8.8.4.4':        { label: 'Google DNS (Sec)',     color: '#06b6d4', icon: 'dns' },
  '1.1.1.1':        { label: 'Cloudflare DNS',       color: '#10b981', icon: 'bolt' },
  '1.0.0.1':        { label: 'Cloudflare DNS (Sec)', color: '#10b981', icon: 'bolt' },
  '9.9.9.9':        { label: 'Quad9 DNS',            color: '#06b6d4', icon: 'shield' },
  '208.67.222.222': { label: 'OpenDNS (Cisco)',      color: '#10b981', icon: 'router' },
  '8.26.56.26':     { label: 'Comodo Secure DNS',    color: '#ef4444', icon: 'security' },
  '94.140.14.14':   { label: 'AdGuard DNS',          color: '#10b981', icon: 'verified_user' },
  '3.218.180.0':    { label: 'AWS us-east-1',        color: '#06b6d4', icon: 'cloud' },
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
  const [alerts, setAlerts] = useState([
    { time: '14:02:11', type: 'critical', title: 'CRITICAL: UNAUTHORIZED ACCESS ATTEMPT', detail: 'Target: Subnet 10.0.4.2 | Action: Blocked' },
    { time: '14:01:45', type: 'warning', title: 'WARNING: HIGH LATENCY SPIKE', detail: 'Node: AMS-04-A | Latency: 342ms' },
    { time: '13:58:22', type: 'info', title: 'INFO: SYNC_COMPLETE', detail: 'Registry updated for 14 clusters.' },
    { time: '13:55:01', type: 'info', title: 'INFO: AUTOMATED_BACKUP', detail: 'Snapshot s-4921-b stored successfully.', faded: true },
    { time: '13:50:45', type: 'warning', title: 'WARNING: FAN_FAILURE_PREDICTED', detail: 'Chassis 02: Temp rising +2C/min.', faded: true },
  ]);
  const alertIntervalRef = useRef(null);

  // Fallback loading mechanism
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchAll = async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/api/metrics`, { timeout: 2000 }),
        axios.get(`${API_URL}/api/summary`, { timeout: 2000 })
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
      const mockSummary = Object.keys(IP_INFO).map(ip => ({
        target_ip: ip,
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
        { severity: 'warning', message: 'Latency spike detected on AWS us-east-1 node', target_ip: '3.218.180.0' },
        { severity: 'info', message: 'All DNS resolvers responding within normal parameters', target_ip: '8.8.8.8' },
        { severity: 'info', message: 'Network jitter stable across all monitored endpoints', target_ip: '1.1.1.1' },
      ]);
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const combinedChartData = useMemo(() => {
    if (!metricsData || Object.keys(metricsData).length === 0) return [];
    const keys = Object.keys(metricsData);
    const firstNode = metricsData[keys[0]];
    if (!firstNode) return [];
    return firstNode.map((entry, idx) => {
      let sum = 0;
      let count = 0;
      keys.forEach(k => {
        if (metricsData[k][idx]) {
          sum += metricsData[k][idx].latency_ms;
          count++;
        }
      });
      return {
        timestamp: entry.timestamp,
        latency_ms: count > 0 ? parseFloat((sum / count).toFixed(1)) : 0
      };
    });
  }, [metricsData]);

  const formatTime = (tick) => {
    try { return format(new Date(tick + 'Z'), 'HH:mm:ss'); }
    catch { return tick; }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <div className="tooltip-time">{formatTime(label)}</div>
          <div className="tooltip-val">{d.latency_ms} ms</div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">CONNECTING TO NETOPS COMMAND...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="material-symbols-outlined logo-icon">radar</span>
            NET-OPS
          </div>
          <div className="nav-tabs">
            {NAV_ITEMS.map((item, i) => (
              <button key={i} className={`nav-tab ${item.active ? 'active' : ''}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <div className="online-badge">
            <div className="online-dot" />
            ONLINE
          </div>
          <div className="last-update">
            UPDATED: {lastUpdate ? format(lastUpdate, 'HH:mm:ss') : '--'}
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          {NAV_ITEMS.map((item, i) => (
            <button key={i} className={`sidebar-item ${item.active ? 'active' : ''}`} title={item.label}>
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ))}
        </aside>

        <main className="content">
          <div className="stats-row fade-up delay-1">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Pings</span>
                <span className="material-symbols-outlined stat-icon">network_ping</span>
              </div>
              <span className="stat-value">{globalStats.totalPings.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Avg Latency</span>
                <span className="material-symbols-outlined stat-icon">speed</span>
              </div>
              <span className="stat-value primary">{globalStats.avgLatency}ms</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Packet Loss</span>
                <span className="material-symbols-outlined stat-icon">warning</span>
              </div>
              <span className="stat-value danger">{globalStats.packetLoss}%</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Uptime</span>
                <span className="material-symbols-outlined stat-icon">check_circle</span>
              </div>
              <span className="stat-value accent">{globalStats.uptime}%</span>
            </div>
          </div>

          <div className="middle-row fade-up delay-2">
            <div className="node-section">
              <div className="section-title">
                <span className="material-symbols-outlined">dns</span>
                NETWORK NODES
              </div>
              <div className="node-grid">
                {summaryData.map(s => {
                  const ip = s.target_ip || s.target;
                  const info = IP_INFO[ip] || { label: ip, color: '#06b6d4', icon: 'router' };
                  const nodeData = metricsData[ip] || [];
                  const latest = nodeData[nodeData.length - 1] || {};
                  const isSuccess = latest.status === 'sucesso' || latest.status === 'success';
                  const latency = latest.latency_ms || 0;
                  const isHealthy = isSuccess && latency < 100;
                  const statusClass = !isSuccess ? 'down' : isHealthy ? 'healthy' : 'warning';
                  const valClass = !isSuccess ? 'color-danger' : isHealthy ? 'color-healthy' : 'color-warning';
                  
                  return (
                    <div key={ip} className="node-card">
                      <div className="cyan-glow" />
                      <div className="node-header">
                        <div className="node-identity">
                          <span className="node-name">{info.label}</span>
                          <span className="node-ip">{ip}</span>
                        </div>
                        <div className="node-status">
                          <div className={`status-dot ${statusClass}`} />
                        </div>
                      </div>
                      <div className="node-metrics">
                        <div className={`latency-value ${valClass}`}>
                          {latency}<small>ms</small>
                        </div>
                        <div className="node-sub-metrics">
                          <div className="sub-metric">
                            <span className="sub-metric-label">Loss</span>
                            <span className="sub-metric-value">
                              {s.total_pings > 0 ? ((s.total_pings - (s.successful || 0)) / s.total_pings * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="sub-metric">
                            <span className="sub-metric-label">Jitter</span>
                            <span className="sub-metric-value">{s.jitter || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="node-sparkline">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={nodeData}>
                            <Area type="monotone" dataKey="latency_ms" stroke={info.color} fill="none" strokeWidth={2} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="alert-section">
              <div className="section-title">
                <span className="material-symbols-outlined">receipt_long</span>
                ALERT LOG
              </div>
              <div className="alert-container">
                <div className="alert-list">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className={`alert-item ${alert.type}`}>
                      <div className="alert-header-row">
                        <span className="alert-title">{alert.title}</span>
                        <span className="alert-time">{alert.time}</span>
                      </div>
                      <span className="alert-detail">{alert.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="chart-section fade-up delay-3">
            <div className="section-title">
              <span className="material-symbols-outlined">insights</span>
              GLOBAL LATENCY TREND
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={formatTime} tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="latency_ms" stroke="#06b6d4" strokeWidth={3} fill="url(#latencyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
