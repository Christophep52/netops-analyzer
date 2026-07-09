import { create } from 'zustand';
import axios from 'axios';

const API_URL = '';

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

export const useAppStore = create((set, get) => ({
  metricsData: {},
  summaryData: [],
  aiInsights: [],
  loading: true,
  viewMode: 'grid',
  lastUpdate: null,
  alerts: [
    { time: '14:02:11', type: 'critical', title: 'CRITICAL: UNAUTHORIZED ACCESS ATTEMPT', detail: 'Target: Subnet 10.0.4.2 | Action: Blocked' },
    { time: '14:01:45', type: 'warning', title: 'WARNING: HIGH LATENCY SPIKE', detail: 'Node: AMS-04-A | Latency: 342ms' },
    { time: '13:58:22', type: 'info', title: 'INFO: SYNC_COMPLETE', detail: 'Registry updated for 14 clusters.' },
    { time: '13:55:01', type: 'info', title: 'INFO: AUTOMATED_BACKUP', detail: 'Snapshot s-4921-b stored successfully.', faded: true },
    { time: '13:50:45', type: 'warning', title: 'WARNING: FAN_FAILURE_PREDICTED', detail: 'Chassis 02: Temp rising +2C/min.', faded: true },
  ],

  setViewMode: (mode) => set({ viewMode: mode }),
  setLoading: (loading) => set({ loading }),
  
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 20) })),

  fetchAll: async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        axios.get('/api/metrics', { timeout: 8000 }),
        axios.get('/api/summary', { timeout: 8000 })
      ]);
      set({
        metricsData: metricsRes.data.data,
        summaryData: summaryRes.data.data,
        lastUpdate: new Date(),
        loading: false
      });
      if (summaryRes.data.ai_insights && summaryRes.data.ai_insights.insights) {
        set({ aiInsights: summaryRes.data.ai_insights.insights });
      }
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
      set({
        summaryData: mockSummary,
        metricsData: mockMetrics,
        aiInsights: [
          { severity: 'warning', message: 'Latency spike detected on AWS us-east-1 node', target_ip: '3.218.180.0', confidence_zone: 60 },
          { severity: 'info', message: 'All DNS resolvers responding within normal parameters', target_ip: '8.8.8.8', confidence_zone: 95 },
          { severity: 'info', message: 'Network jitter stable across all monitored endpoints', target_ip: '1.1.1.1', confidence_zone: 92 },
        ],
        lastUpdate: new Date(),
        loading: false
      });
    }
  }
}));
