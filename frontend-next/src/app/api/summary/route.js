import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TARGETS = [
  "8.8.8.8",
  "8.8.4.4",
  "1.1.1.1",
  "1.0.0.1",
  "9.9.9.9",
  "208.67.222.222",
  "8.26.56.26",
  "94.140.14.14",
  "3.218.180.0",
];

// In-memory cache for historical latency tracking
global._pingHistory = global._pingHistory || {};
TARGETS.forEach((ip) => {
  if (!global._pingHistory[ip]) {
    global._pingHistory[ip] = {
      total_pings: 0,
      successful: 0,
      latencies: [],
    };
  }
});

async function pingRealIP(ip) {
  try {
    // Execute real ICMP ping (1 echo request, 1500ms timeout on Windows)
    const { stdout } = await execAsync(`ping -n 1 -w 1500 ${ip}`);

    // Parse time/tempo in ms (works in English and Portuguese Windows)
    const match = stdout.match(/(?:time|tempo)[=<](\d+)ms/i);
    let latency = match ? parseFloat(match[1]) : null;

    // If time<1ms matched
    if (!latency && stdout.match(/(?:time|tempo)<1ms/i)) {
      latency = 1;
    }

    const success =
      latency !== null &&
      !stdout.includes("Esgotado") &&
      !stdout.includes("timed out");

    return {
      ip,
      success,
      latency: success ? latency : null,
    };
  } catch (error) {
    return {
      ip,
      success: false,
      latency: null,
    };
  }
}

export async function GET() {
  const pingResults = await Promise.all(TARGETS.map(pingRealIP));

  const summaryData = pingResults.map(({ ip, success, latency }) => {
    const hist = global._pingHistory[ip];
    hist.total_pings += 1;
    if (success && latency !== null) {
      hist.successful += 1;
      hist.latencies.push(latency);
      if (hist.latencies.length > 30) hist.latencies.shift();
    }

    const avgLatency =
      hist.latencies.length > 0
        ? parseFloat(
            (
              hist.latencies.reduce((a, b) => a + b, 0) / hist.latencies.length
            ).toFixed(1),
          )
        : 0;

    const minLatency =
      hist.latencies.length > 0 ? Math.min(...hist.latencies) : 0;
    const maxLatency =
      hist.latencies.length > 0 ? Math.max(...hist.latencies) : 0;

    // Calculate jitter as standard deviation or variance between consecutive pings
    let jitter = 0;
    if (hist.latencies.length > 1) {
      let diffSum = 0;
      for (let i = 1; i < hist.latencies.length; i++) {
        diffSum += Math.abs(hist.latencies[i] - hist.latencies[i - 1]);
      }
      jitter = parseFloat((diffSum / (hist.latencies.length - 1)).toFixed(1));
    }

    return {
      target_ip: ip,
      target: ip,
      total_pings: hist.total_pings,
      successful: hist.successful,
      avg_latency: success && latency !== null ? latency : avgLatency,
      min_latency: minLatency,
      max_latency: maxLatency,
      jitter: jitter,
      last_status: success ? "success" : "timeout",
    };
  });

  // Dynamic real AI insights based on real latency
  const insights = [];
  summaryData.forEach((item) => {
    if (item.last_status === "timeout") {
      insights.push({
        severity: "critical",
        message: `Packet loss / timeout detected on ${item.target_ip} from your local connection`,
        target_ip: item.target_ip,
        confidence_zone: 99,
      });
    } else if (item.avg_latency > 100) {
      insights.push({
        severity: "warning",
        message: `High latency (${item.avg_latency}ms) observed on ${item.target_ip}`,
        target_ip: item.target_ip,
        confidence_zone: 88,
      });
    } else {
      insights.push({
        severity: "info",
        message: `Real ICMP latency stable (${item.avg_latency}ms) via local network`,
        target_ip: item.target_ip,
        confidence_zone: 96,
      });
    }
  });

  return NextResponse.json({
    data: summaryData,
    ai_insights: { insights },
    source: "REAL_LOCAL_NETWORK_PING",
  });
}
