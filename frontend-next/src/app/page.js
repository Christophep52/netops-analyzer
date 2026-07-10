"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { format } from 'date-fns';
import { 
  Radar, LayoutDashboard, Share2, Server, Terminal, 
  Activity, ActivityIcon, AlertTriangle, Info, Network,
  Shield, CheckCircle, Zap, Download, RefreshCw, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IP_INFO = {
  '8.8.8.8':        { label: 'Google DNS',           color: '#06b6d4', icon: <Network size={16} /> },
  '8.8.4.4':        { label: 'Google DNS (Sec)',     color: '#06b6d4', icon: <Network size={16} /> },
  '1.1.1.1':        { label: 'Cloudflare DNS',       color: '#10b981', icon: <Zap size={16} /> },
  '1.0.0.1':        { label: 'Cloudflare DNS (Sec)', color: '#10b981', icon: <Zap size={16} /> },
  '9.9.9.9':        { label: 'Quad9 DNS',            color: '#06b6d4', icon: <Shield size={16} /> },
  '208.67.222.222': { label: 'OpenDNS (Cisco)',      color: '#10b981', icon: <Server size={16} /> },
  '8.26.56.26':     { label: 'Comodo Secure DNS',    color: '#ef4444', icon: <Shield size={16} /> },
  '94.140.14.14':   { label: 'AdGuard DNS',          color: '#10b981', icon: <Shield size={16} /> },
  '3.218.180.0':    { label: 'AWS us-east-1',        color: '#06b6d4', icon: <Server size={16} /> },
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { id: 'topology', icon: <Share2 size={20} />, label: 'Topology' },
  { id: 'inventory', icon: <Server size={20} />, label: 'Inventory' },
  { id: 'alerts', icon: <Terminal size={20} />, label: 'Alert Logs' },
  { id: 'traffic', icon: <Activity size={20} />, label: 'Traffic' },
];

export default function NetOpsDashboard() {
  const { 
    metricsData, summaryData, topologyData, aiInsights, latencyHistoryData, loading, 
    viewMode, lastUpdate, alerts, setViewMode, fetchAll 
  } = useAppStore();

  const [isMounted, setIsMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsMounted(true);
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const globalStats = useMemo(() => {
    if (!summaryData.length) return { totalPings: 0, avgLatency: 0, packetLoss: 0, uptime: 0, healthyNodes: 0 };
    const totalPings = summaryData.reduce((sum, s) => sum + (s.total_pings || 0), 0);
    const totalSuccess = summaryData.reduce((sum, s) => sum + (s.successful || 0), 0);
    const avgLatency = summaryData.reduce((sum, s) => sum + (s.avg_latency || 0), 0) / summaryData.length;
    const packetLoss = summaryData.length > 0 ? (summaryData.reduce((sum, s) => sum + (s.packet_loss_percentage || 0), 0) / summaryData.length) : 0;
    const uptime = totalPings > 0 ? (totalSuccess / totalPings * 100) : 0;
    const healthyNodes = summaryData.filter(s => {
      const loss = s.packet_loss_percentage || 0;
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
    try { return format(new Date(tick + (tick.endsWith('Z') ? '' : 'Z')), 'HH:mm:ss'); }
    catch { return tick; }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Target IP,Label,Avg Latency (ms),Packet Loss (%),Uptime (%),Jitter\n" +
      summaryData.map(s => {
        const ip = s.target_ip || s.target;
        const info = IP_INFO[ip] || { label: ip };
        const loss = s.packet_loss_percentage !== undefined ? s.packet_loss_percentage : 0;
        const uptime = s.total_pings > 0 ? (s.successful / s.total_pings * 100).toFixed(1) : 0;
        return `"${ip}","${info.label}",${s.avg_latency || 0},${loss},${uptime},${s.jitter || 0}`;
      }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "netops_telemetry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
      const response = await fetch(`${API_URL}/api/export`);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'netops_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
    }
  };

  const triggerChaos = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
      await fetch(`${API_URL}/api/chaos`, { method: 'POST' });
      fetchAll();
    } catch (err) {
      console.error("Chaos error:", err);
    }
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

  if (!isMounted || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">CONNECTING TO NETOPS ANALYZER...</p>
      </div>
    );
  }

  const filteredNodes = summaryData.filter(s => {
    const ip = s.target_ip || s.target;
    const info = IP_INFO[ip] || { label: ip };
    return !searchQuery || ip.toLowerCase().includes(searchQuery.toLowerCase()) || info.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <Radar className="logo-icon" size={24} />
            NetOps Analyzer
          </div>
          <div className="nav-tabs">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`nav-tab ${activeNav === item.id ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={exportCSV}
            style={{
              padding: '6px 12px', background: 'rgba(6,182,212,0.15)', border: '1px solid #06b6d4',
              color: '#06b6d4', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Download size={14} /> EXPORT CSV
          </button>
          <button 
            onClick={downloadPDF}
            style={{
              padding: '6px 12px', background: 'rgba(6,182,212,0.15)', border: '1px solid #06b6d4',
              color: '#06b6d4', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Download size={14} /> EXPORT PDF
          </button>
          <button
            onClick={triggerChaos}
            style={{
              padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
              color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <AlertTriangle size={14} /> Simular Apagão de Rede
          </button>
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
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </aside>

        <main className="content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stats-row">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Pings</span>
                <ActivityIcon className="stat-icon" size={20} />
              </div>
              <span className="stat-value">{globalStats.totalPings.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Avg Latency</span>
                <ActivityIcon className="stat-icon" size={20} />
              </div>
              <span className="stat-value" style={{ color: 'var(--color-primary)' }}>{globalStats.avgLatency}ms</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Packet Loss</span>
                <AlertTriangle className="stat-icon" size={20} />
              </div>
              <span className="stat-value" style={{ color: parseFloat(globalStats.packetLoss) > 0 ? 'var(--color-warning)' : 'var(--color-healthy)' }}>{globalStats.packetLoss}%</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Uptime</span>
                <CheckCircle className="stat-icon" size={20} />
              </div>
              <span className="stat-value" style={{ color: 'var(--color-accent)' }}>{globalStats.uptime}%</span>
            </div>
          </motion.div>

          {activeNav === 'dashboard' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="middle-row">
                <div className="node-section">
                  <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={20} />
                      NETWORK NODES
                    </div>
                    <div className="view-toggle" style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setViewMode('grid')} className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`} style={{ padding: '4px 12px', background: viewMode === 'grid' ? 'rgba(6,182,212,0.2)' : 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px', transition: 'all 0.2s' }}>
                        GRID VIEW
                      </button>
                      <button onClick={() => setViewMode('table')} className={`btn-view ${viewMode === 'table' ? 'active' : ''}`} style={{ padding: '4px 12px', background: viewMode === 'table' ? 'rgba(6,182,212,0.2)' : 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px', transition: 'all 0.2s' }}>
                        TABLE VIEW
                      </button>
                    </div>
                  </div>
                  
                  {viewMode === 'grid' ? (
                    <div className="node-grid">
                      <AnimatePresence>
                        {summaryData.map(s => {
                          const ip = s.target_ip || s.target;
                          const info = IP_INFO[ip] || { label: ip, color: '#06b6d4', icon: <Server size={16}/> };
                          const nodeData = latencyHistoryData[ip] || metricsData[ip] || [];
                          const latest = (metricsData[ip] && metricsData[ip][metricsData[ip].length - 1]) || {};
                          const isSuccess = latest.status === 'sucesso' || latest.status === 'success';
                          const latency = latest.latency_ms || 0;
                          const isHealthy = isSuccess && latency < 100;
                          const statusClass = !isSuccess ? 'down' : isHealthy ? 'healthy' : 'warning';
                          const valClass = !isSuccess ? 'color-danger' : isHealthy ? 'color-healthy' : 'color-warning';
                          
                          return (
                            <motion.div key={ip} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="node-card">
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
                                    <span className="sub-metric-value" style={{ color: (s.packet_loss_percentage > 0) ? 'var(--color-warning)' : 'inherit' }}>
                                      {s.packet_loss_percentage || 0}%
                                    </span>
                                  </div>
                                  <div className="sub-metric">
                                    <span className="sub-metric-label">Uptime</span>
                                    <span className="sub-metric-value">
                                      {s.total_pings > 0 ? (s.successful / s.total_pings * 100).toFixed(1) : 0}%
                                    </span>
                                  </div>
                                  <div className="sub-metric">
                                    <span className="sub-metric-label">Jitter</span>
                                    <span className="sub-metric-value">{s.jitter || 0}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {(() => {
                                const insight = aiInsights.find(i => i.target_ip === ip);
                                if (!insight) return null;
                                const confColor = insight.confidence_zone > 80 ? 'color-healthy' : insight.confidence_zone > 50 ? 'color-warning' : 'color-danger';
                                return (
                                  <div style={{ marginTop: '8px', zIndex: 1, padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <span style={{ color: 'var(--color-text-muted)' }}>AI Confidence:</span>
                                      <span className={confColor}>{insight.confidence_zone}%</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                      {insight.message}
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="node-sparkline">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={nodeData}>
                                    <Area type="monotone" dataKey="latency" stroke={info.color} fill="none" strokeWidth={2} isAnimationActive={true} animationDuration={300} animationEasing="ease-in-out" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="node-table-container" style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <tr>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Target</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Avg Latency</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Packet Loss</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Uptime</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Jitter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.map(s => {
                            const ip = s.target_ip || s.target;
                            const info = IP_INFO[ip] || { label: ip, color: '#06b6d4', icon: <Server size={16}/> };
                            const isSuccess = s.last_status === 'success' || s.last_status === 'sucesso';
                            const uptime = s.total_pings > 0 ? (s.successful / s.total_pings * 100).toFixed(1) : 0;
                            const loss = s.packet_loss_percentage !== undefined ? s.packet_loss_percentage : 0;
                            
                            return (
                              <tr key={ip} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{info.label}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#94a3b8' }}>{ip}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div className={`status-dot ${isSuccess ? 'healthy' : 'down'}`} style={{ position: 'relative', top: 0, left: 0 }} />
                                    <span style={{ color: isSuccess ? '#10b981' : '#ef4444' }}>{isSuccess ? 'ONLINE' : 'OFFLINE'}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{s.avg_latency || 0} ms</td>
                                <td style={{ padding: '12px 16px', color: loss > 0 ? '#ef4444' : '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{loss}%</td>
                                <td style={{ padding: '12px 16px', color: uptime < 99 ? '#f59e0b' : '#10b981', fontFamily: 'var(--font-mono)' }}>{uptime}%</td>
                                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{s.jitter || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="alert-section">
                  <div className="section-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={20} />
                      ALERT LOG
                    </div>
                  </div>
                  <div className="alert-container">
                    <div className="alert-list">
                      <AnimatePresence>
                        {alerts.map((alert, idx) => (
                          <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={idx + alert.time} className={`alert-item ${alert.type}`}>
                            <div className="alert-header-row">
                              <span className="alert-title">{alert.title}</span>
                              <span className="alert-time">{alert.time}</span>
                            </div>
                            <span className="alert-detail">{alert.detail}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="chart-section">
                <div className="section-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} />
                    GLOBAL LATENCY TREND
                  </div>
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
                      <Area type="monotone" dataKey="latency_ms" stroke="#06b6d4" strokeWidth={3} fill="url(#latencyGradient)" isAnimationActive={true} animationDuration={500} animationEasing="ease-in-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </>
          )}

          {activeNav === 'topology' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Share2 size={22} color="#06b6d4" /> TOPOLOGIA E MAPEAMENTO DE REDE
              </h2>
              {(() => {
                if (!topologyData || !topologyData.nodes || topologyData.nodes.length === 0) {
                  return <div style={{ color: '#64748b' }}>Topology data loading or not available.</div>;
                }
                const { nodes, edges } = topologyData;
                const width = 800;
                const height = 500;
                const positions = {};
                
                const servers = nodes.filter(n => n.type === 'server');
                const switches = nodes.filter(n => n.type === 'switch');
                const routers = nodes.filter(n => n.type === 'router');

                routers.forEach((r, i) => { positions[r.id] = { x: width / 2, y: 50 }; });
                switches.forEach((s, i) => { positions[s.id] = { x: (width / (switches.length + 1)) * (i + 1), y: 150 }; });
                servers.forEach((s, i) => {
                  const cols = 5;
                  const row = Math.floor(i / cols);
                  const col = i % cols;
                  positions[s.id] = { x: (width / (cols + 1)) * (col + 1), y: 280 + row * 80 };
                });

                return (
                  <div style={{ width: '100%', height: '500px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                      {edges.map((e, i) => {
                        const p1 = positions[e.source];
                        const p2 = positions[e.target];
                        if (!p1 || !p2) return null;
                        return (
                          <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(6,182,212,0.4)" strokeWidth="2" />
                        );
                      })}
                      {nodes.map(n => {
                        const p = positions[n.id];
                        if (!p) return null;
                        const color = n.type === 'router' ? '#ef4444' : n.type === 'switch' ? '#f59e0b' : '#10b981';
                        return (
                          <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
                            <circle r="20" fill={color} opacity="0.2" />
                            <circle r="10" fill={color} />
                            <text y="25" fill="#e2e8f0" fontSize="11" textAnchor="middle" fontFamily="var(--font-mono)">
                              {n.label.split('\n').map((line, idx) => (
                                <tspan x="0" dy={idx === 0 ? 0 : 14} key={idx}>{line}</tspan>
                              ))}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>
          )}

          {activeNav === 'inventory' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Server size={22} color="#06b6d4" /> INVENTÁRIO DE ENDPOINTS MONITORAIS
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou IP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <tr>
                    <th style={{ padding: '14px 16px', color: '#64748b' }}>Endpoint / Rótulo</th>
                    <th style={{ padding: '14px 16px', color: '#64748b' }}>Endereço IP / DNS</th>
                    <th style={{ padding: '14px 16px', color: '#64748b' }}>Status Atual</th>
                    <th style={{ padding: '14px 16px', color: '#64748b' }}>Latência Média</th>
                    <th style={{ padding: '14px 16px', color: '#64748b' }}>Pacotes Perdidos</th>
                    <th style={{ padding: '14px 16px', color: '#64748b' }}>Conformidade SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNodes.map(s => {
                    const ip = s.target_ip || s.target;
                    const info = IP_INFO[ip] || { label: ip };
                    const isSuccess = s.last_status === 'success' || s.last_status === 'sucesso';
                    const uptime = ((s.successful || 0) / (s.total_pings || 1) * 100).toFixed(1);
                    return (
                      <tr key={ip} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#e2e8f0' }}>{info.label}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{ip}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ color: isSuccess ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {isSuccess ? '● ONLINE' : '● OFFLINE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{s.avg_latency || 0} ms</td>
                        <td style={{ padding: '14px 16px', color: (s.packet_loss_percentage > 0) ? 'var(--color-warning)' : 'inherit', fontFamily: 'var(--font-mono)' }}>{s.packet_loss_percentage || 0}%</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', background: uptime >= 99 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: uptime >= 99 ? '#10b981' : '#f59e0b', fontSize: '12px' }}>
                            {uptime >= 99 ? 'Em Conformidade (99.9%)' : 'Atenção SLA'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeNav === 'alerts' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={22} color="#ef4444" /> HISTÓRICO DE ALERTAS & ANOMALIAS IA
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Nenhum alerta crítico registrado recentemente.</div>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ color: '#fca5a5' }}>{alert.title}</strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{alert.time}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0' }}>{alert.detail}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeNav === 'traffic' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={22} color="#06b6d4" /> ANÁLISE PROFUNDA DE TRÁFEGO & LATÊNCIA (PERCENTIS P50 / P90 / P99)
              </h2>
              <div style={{ height: '360px', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="target_ip" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Legend />
                    <Bar dataKey="avg_latency" name="Latência Média (ms)" fill="#06b6d4" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                    <Bar dataKey="jitter" name="Jitter (ms)" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

