import type { ServerLocation } from "@/types/geo";

/**
 * Simulates real-time latency updates
 * In production, this would fetch from an actual API
 */
export function updateLatencyValues(servers: ServerLocation[]): ServerLocation[] {
  return servers.map((server) => {
    // Simulate realistic latency variations (±10% with some noise)
    const baseLatency = server.latency;
    const variation = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1 (10%)
    const noise = (Math.random() - 0.5) * 5; // -2.5 to +2.5 ms
    const newLatency = Math.max(1, Math.round(baseLatency * (1 + variation) + noise));
    
    return {
      ...server,
      latency: newLatency,
    };
  });
}

/**
 * Get system performance metrics
 */
export interface PerformanceMetrics {
  totalServers: number;
  activeConnections: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  lastUpdate: Date;
  systemStatus: 'healthy' | 'degraded' | 'critical';
}

export function calculatePerformanceMetrics(servers: ServerLocation[]): PerformanceMetrics {
  if (servers.length === 0) {
    return {
      totalServers: 0,
      activeConnections: 0,
      averageLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      lastUpdate: new Date(),
      systemStatus: 'healthy',
    };
  }

  const latencies = servers.map(s => s.latency);
  const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  
  // Calculate active connections (each server pair = 1 connection)
  const activeConnections = servers.length > 1 
    ? (servers.length * (servers.length - 1)) / 2 
    : 0;

  // Determine system status
  let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (averageLatency > 150) {
    systemStatus = 'critical';
  } else if (averageLatency > 100) {
    systemStatus = 'degraded';
  }

  return {
    totalServers: servers.length,
    activeConnections,
    averageLatency: Math.round(averageLatency * 10) / 10,
    minLatency,
    maxLatency,
    lastUpdate: new Date(),
    systemStatus,
  };
}

