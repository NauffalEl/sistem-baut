import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// Simple monitoring endpoint
// ─────────────────────────────────────────────

interface Metrics {
  uptime: number;
  timestamp: string;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  process: {
    pid: number;
    version: string;
    platform: string;
  };
}

export function getMetrics(): NextResponse {
  const metrics: Metrics = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
    },
  };

  return NextResponse.json(metrics);
}

export function healthCheck(): NextResponse {
  const status = process.env.NODE_ENV === "production" ? "healthy" : "dev";
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
  });
}
