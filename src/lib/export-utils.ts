import type { ServerLocation, CloudRegion, GeoData } from "@/types/geo";
import type { PerformanceMetrics } from "./latency-updater";

/**
 * Export latency data as CSV
 */
export function exportLatencyDataAsCSV(servers: ServerLocation[]): string {
  const headers = ["Name", "Exchange", "Cloud Provider", "City", "Country", "Latency (ms)"];
  const rows = servers.map(server => [
    server.name,
    server.exchange,
    server.cloudProvider,
    server.city,
    server.country,
    server.latency.toString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return csvContent;
}

/**
 * Export performance metrics as JSON
 */
export function exportMetricsAsJSON(metrics: PerformanceMetrics): string {
  return JSON.stringify(metrics, null, 2);
}

/**
 * Export geo data as JSON
 */
export function exportGeoDataAsJSON(geoData: GeoData): string {
  return JSON.stringify(geoData, null, 2);
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export latency report (combined data)
 */
export function exportLatencyReport(
  servers: ServerLocation[],
  regions: CloudRegion[],
  metrics: PerformanceMetrics
) {
  const report = {
    generatedAt: new Date().toISOString(),
    metrics,
    servers,
    regions,
    summary: {
      totalServers: servers.length,
      totalRegions: regions.length,
      averageLatency: metrics.averageLatency,
      minLatency: metrics.minLatency,
      maxLatency: metrics.maxLatency,
    },
  };

  const content = JSON.stringify(report, null, 2);
  const filename = `latency-report-${new Date().toISOString().split("T")[0]}.json`;
  downloadFile(content, filename, "application/json");
}

