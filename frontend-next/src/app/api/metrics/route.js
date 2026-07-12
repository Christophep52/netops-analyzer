import { NextResponse } from "next/server";

export async function GET() {
  const history = global._pingHistory || {};
  const metricsData = {};

  Object.keys(history).forEach((ip) => {
    const latencies = history[ip].latencies || [];
    metricsData[ip] = latencies.map((lat, i) => ({
      timestamp: new Date(
        Date.now() - (latencies.length - 1 - i) * 5000,
      ).toISOString(),
      latency_ms: lat,
      status: "success",
    }));
  });

  return NextResponse.json({
    data: metricsData,
    source: "REAL_LOCAL_NETWORK_PING",
  });
}
