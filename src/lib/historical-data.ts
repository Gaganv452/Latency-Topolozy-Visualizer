import type {
  ServerLocation,
  HistoricalLatencyDataPoint,
  ServerPair,
  TimeRange,
} from "@/types/geo";

/**
 * Generate historical latency data for a server pair
 * This simulates realistic latency variations over time
 */
export function generateHistoricalLatencyData(
  server1: ServerLocation,
  server2: ServerLocation,
  timeRange: TimeRange
): HistoricalLatencyDataPoint[] {
  const now = Date.now();
  const rangeMs = getTimeRangeMs(timeRange);
  const startTime = now - rangeMs;
  const interval = getIntervalForTimeRange(timeRange);
  const dataPoints: HistoricalLatencyDataPoint[] = [];

  // Base latency is the average of the two servers
  const baseLatency = (server1.latency + server2.latency) / 2;

  // Generate data points
  for (let time = startTime; time <= now; time += interval) {
    // Add realistic variation (±20% with some noise)
    const variation = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2
    const noise = (Math.random() - 0.5) * 10; // -5 to +5 ms
    const trend = Math.sin((time - startTime) / rangeMs * Math.PI * 2) * 5; // Slow sine wave
    const latency = Math.max(1, baseLatency * (1 + variation) + noise + trend);

    dataPoints.push({
      timestamp: time,
      latency: Math.round(latency * 10) / 10, // Round to 1 decimal
    });
  }

  return dataPoints;
}

/**
 * Get milliseconds for a time range
 */
function getTimeRangeMs(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1h":
      return 60 * 60 * 1000; // 1 hour
    case "24h":
      return 24 * 60 * 60 * 1000; // 24 hours
    case "7d":
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    case "30d":
      return 30 * 24 * 60 * 60 * 1000; // 30 days
  }
}

/**
 * Get interval between data points for a time range
 */
function getIntervalForTimeRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1h":
      return 2 * 60 * 1000; // 2 minutes
    case "24h":
      return 30 * 60 * 1000; // 30 minutes
    case "7d":
      return 2 * 60 * 60 * 1000; // 2 hours
    case "30d":
      return 6 * 60 * 60 * 1000; // 6 hours
  }
}

/**
 * Generate all possible server pairs from server list
 */
export function generateServerPairs(
  servers: ServerLocation[]
): ServerPair[] {
  const pairs: ServerPair[] = [];

  for (let i = 0; i < servers.length; i++) {
    for (let j = i + 1; j < servers.length; j++) {
      const server1 = servers[i];
      const server2 = servers[j];
      const pairId = `${server1.id}-${server2.id}`;

      pairs.push({
        server1,
        server2,
        pairId,
      });
    }
  }

  return pairs;
}

/**
 * Calculate statistics from historical latency data
 */
export function calculateLatencyStatistics(
  data: HistoricalLatencyDataPoint[]
): {
  min: number;
  max: number;
  average: number;
} {
  if (data.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  const latencies = data.map((d) => d.latency);
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const average =
    latencies.reduce((sum, val) => sum + val, 0) / latencies.length;

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    average: Math.round(average * 10) / 10,
  };
}

