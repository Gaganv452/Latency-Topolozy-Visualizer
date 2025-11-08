"use client";

import type { FC } from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import geoData from "@/data/data.json";
import type { ServerLocation } from "@/types/geo";
import { Header } from "@/components/header";
import { ControlPanel, type Filters } from "@/components/control-panel";
import { MapContainer } from "@/components/map-container";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import MarketDashboard from "@/components/MarketDashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { updateLatencyValues } from "@/lib/latency-updater";
import { exportLatencyReport } from "@/lib/export-utils";
import { calculatePerformanceMetrics } from "@/lib/latency-updater";

const LatencyMap: FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerLocation[]>(
    geoData.servers.map((s) => ({
      ...s,
      cloudProvider: s.cloudProvider as "AWS" | "GCP" | "Azure" | "Other",
    }))
  );
  const [filters, setFilters] = useState<Filters>({
    search: "",
    exchange: "all",
    latency: [0, 500],
    providers: { AWS: true, GCP: true, Azure: true, Other: true },
    layers: { servers: true, regions: true },
  });
  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(false);

  // Real-time latency updates every 5-10 seconds
  useEffect(() => {
    const updateLatency = () => {
      setServers((prevServers) => updateLatencyValues(prevServers));
    };

    // Initial update
    updateLatency();

    // Update every 7 seconds (between 5-10 seconds as specified)
    const interval = setInterval(updateLatency, 7000);

    return () => clearInterval(interval);
  }, []);

  const exchanges = useMemo(() => {
    const uniqueExchanges = [
      ...new Set(geoData.servers.map((s) => s.exchange)),
    ];
    return ["all", ...uniqueExchanges.sort()];
  }, []);

  const filteredGeoData = useMemo(() => {
    const searchLower = filters.search.toLowerCase();

    const filteredServers = servers
      .filter((server) => {
        const searchMatch =
          !filters.search ||
          server.name.toLowerCase().includes(searchLower) ||
          server.city.toLowerCase().includes(searchLower) ||
          server.country.toLowerCase().includes(searchLower) ||
          server.exchange.toLowerCase().includes(searchLower);

        const exchangeMatch =
          filters.exchange === "all" || server.exchange === filters.exchange;

        const latencyMatch =
          server.latency >= filters.latency[0] &&
          server.latency <= filters.latency[1];

        const providerMatch =
          filters.providers[
            server.cloudProvider as keyof typeof filters.providers
          ];

        return searchMatch && exchangeMatch && latencyMatch && providerMatch;
      })
      .map((server) => ({
        ...server,
        cloudProvider: server.cloudProvider as
          | "AWS"
          | "GCP"
          | "Azure"
          | "Other",
      }));

    const filteredRegions = geoData.regions
      .filter(
        (region) =>
          filters.providers[region.provider as keyof typeof filters.providers]
      )
      .map((region) => ({
        ...region,
        provider: region.provider as "AWS" | "GCP" | "Azure",
        code:
          typeof region.code === "string"
            ? region.code
            : (region as any).code_attention ?? "",
      }));

    return { servers: filteredServers, regions: filteredRegions };
  }, [filters, servers]);

  // Export functionality
  const handleExport = useCallback(() => {
    const metrics = calculatePerformanceMetrics(filteredGeoData.servers);
    exportLatencyReport(
      filteredGeoData.servers,
      filteredGeoData.regions,
      metrics
    );
  }, [filteredGeoData]);

  return (
    <div className="relative min-h-[100vh] w-full bg-black font-body antialiased overflow-x-hidden">
      <Header />
      <ThemeToggle />
      <main className="relative h-[100vh] w-full flex flex-col md:flex-row">
        {loading && <MapSkeleton />}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            <MapContainer
              geoData={filteredGeoData}
              layerVisibility={filters.layers}
            />
            <div className="md:hidden absolute top-20 left-2 z-20 ">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
                className="bg-background/80 backdrop-blur-sm"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-20 md:top-24 left-2 md:left-4 z-10 flex flex-col gap-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <ControlPanel
                filters={filters}
                onFiltersChange={setFilters}
                exchanges={exchanges}
                onExport={handleExport}
                className={`
                  w-[90vw] md:w-80
                  transition-transform duration-300 ease-in-out
                  ${
                    isControlPanelOpen
                      ? "translate-x-0"
                      : "-translate-x-full md:translate-x-0"
                  }
                `}
                onClose={() => setIsControlPanelOpen(false)}
              />
              <div className="hidden md:block">
                <PerformanceMetrics servers={filteredGeoData.servers} />
              </div>
            </div>
          </>
        )}
      </main>

      <div className="mt-4 h-full w-full max-w-7xl mx-auto px-4">
        <MarketDashboard />
      </div>
    </div>
  );
};

const MapSkeleton = () => (
  <div className="absolute inset-0">
    <Skeleton className="h-full w-full bg-gray-800" />
  </div>
);

export default LatencyMap;
