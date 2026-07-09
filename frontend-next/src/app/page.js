"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { 
  Radar, LayoutDashboard, Share2, Server, Terminal, 
  Activity, ActivityIcon, AlertTriangle, Info, Network,
  Shield, CheckCircle, Zap
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
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
  { icon: <Share2 size={20} />, label: 'Topology' },
  { icon: <Server size={20} />, label: 'Inventory' },
  { icon: <Terminal size={20} />, label: 'Alert Logs' },
  { icon: <Activity size={20} />, label: 'Traffic' },
];

export default function NetOpsDashboard() {
  const { 
    metricsData, summaryData, aiInsights, loading, 
    viewMode, lastUpdate, alerts, setViewMode, fetchAll 
  } = useAppStore();

  const [isMounted, setIsMounted] = useState(false);

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
    try { return format(new Date(tick + (tick.endsWith('Z') ? '' : 'Z')), 'HH:mm:ss'); }
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

  if (!isMounted || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">CONNECTING TO NETOPS ANALYZER...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <Radar className="logo-icon" size={24} />
            NetOps Analyzer
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
              <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{globalStats.packetLoss}%</span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Uptime</span>
                <CheckCircle className="stat-icon" size={20} />
              </div>
              <span className="stat-value" style={{ color: 'var(--color-accent)' }}>{globalStats.uptime}%</span>
            </div>
          </motion.div>

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
                      const nodeData = metricsData[ip] || [];
                      const latest = nodeData[nodeData.length - 1] || {};
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
                          
                          {/* Confidence Zone AI Injection */}
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
                                <Area type="monotone" dataKey="latency_ms" stroke={info.color} fill="none" strokeWidth={2} isAnimationActive={false} />
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
                        const loss = s.total_pings > 0 ? ((s.total_pings - s.successful) / s.total_pings * 100).toFixed(1) : 0;
                        
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
                  <Area type="monotone" dataKey="latency_ms" stroke="#06b6d4" strokeWidth={3} fill="url(#latencyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
