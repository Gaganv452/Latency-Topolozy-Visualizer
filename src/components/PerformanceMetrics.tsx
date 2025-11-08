"use client";

import type { FC } from "react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Activity, Server, Network, Clock, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ServerLocation } from "@/types/geo";
import { calculatePerformanceMetrics, type PerformanceMetrics as PerformanceMetricsType } from "@/lib/latency-updater";

interface PerformanceMetricsProps {
  servers: ServerLocation[];
}

export const PerformanceMetrics: FC<PerformanceMetricsProps> = ({ servers }) => {
  const metrics: PerformanceMetricsType = useMemo(() => calculatePerformanceMetrics(servers), [servers]);

  const getStatusIcon = () => {
    switch (metrics.systemStatus) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (metrics.systemStatus) {
      case 'healthy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  return (
    <Card className="bg-background/100 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Activity className="h-4 w-4 md:h-5 md:w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">System Status</span>
          </div>
          <Badge className={getStatusColor()}>
            {metrics.systemStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Servers</span>
            </div>
            <div className="text-lg md:text-xl font-bold">{metrics.totalServers}</div>
          </div>

          <div className="p-3 rounded-lg border bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Network className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Connections</span>
            </div>
            <div className="text-lg md:text-xl font-bold">{metrics.activeConnections}</div>
          </div>

          <div className="p-3 rounded-lg border bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Latency</span>
            </div>
            <div className="text-lg md:text-xl font-bold">
              {metrics.averageLatency.toFixed(1)} ms
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Range</span>
            </div>
            <div className="text-xs md:text-sm font-semibold">
              {metrics.minLatency}-{metrics.maxLatency} ms
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
          Last updated: {metrics.lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

