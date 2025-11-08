"use client";

import type { FC } from "react";
import { useState, useMemo, useEffect } from "react";
import geoData from "../data/data.json";
import type {
  ServerLocation,
  ServerPair,
  TimeRange,
  HistoricalLatencyDataPoint,
} from "../types/geo";
import {
  generateHistoricalLatencyData,
  generateServerPairs,
  calculateLatencyStatistics,
} from "../lib/historical-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  ChartContainer,
  ChartTooltip,
} from "./ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Clock, Minus, Maximize2 } from "lucide-react";

const HistoricalLatencyTrends: FC = () => {
  const [selectedPairId, setSelectedPairId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedExchange, setSelectedExchange] = useState<string>("all");

  // Generate server pairs
  const serverPairs = useMemo(() => {
    let servers = geoData.servers as ServerLocation[];
    
    // Filter by exchange if needed
    if (selectedExchange !== "all") {
      servers = servers.filter((s) => s.exchange === selectedExchange);
    }
    
    return generateServerPairs(servers);
  }, [selectedExchange]);

  // Get unique exchanges for filter
  const exchanges = useMemo(() => {
    const uniqueExchanges = [
      ...new Set(geoData.servers.map((s) => s.exchange)),
    ];
    return ["all", ...uniqueExchanges.sort()];
  }, []);

  // Get selected pair
  const selectedPair = useMemo(() => {
    return serverPairs.find((p) => p.pairId === selectedPairId);
  }, [serverPairs, selectedPairId]);

  // Generate historical data for selected pair
  const historicalData = useMemo(() => {
    if (!selectedPair) return [];

    const data = generateHistoricalLatencyData(
      selectedPair.server1,
      selectedPair.server2,
      timeRange
    );

    // Format for chart (convert timestamp to readable time)
    return data.map((point) => ({
      ...point,
      time: formatTimestamp(point.timestamp, timeRange),
      fullTime: new Date(point.timestamp).toLocaleString(),
    }));
  }, [selectedPair, timeRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (historicalData.length === 0) {
      return { min: 0, max: 0, average: 0 };
    }
    const dataPoints: HistoricalLatencyDataPoint[] = historicalData.map(
      (d) => ({
        timestamp: d.timestamp,
        latency: d.latency,
      })
    );
    return calculateLatencyStatistics(dataPoints);
  }, [historicalData]);

  // Auto-select first pair if none selected
  useEffect(() => {
    if (!selectedPairId && serverPairs.length > 0) {
      setSelectedPairId(serverPairs[0].pairId);
    }
  }, [selectedPairId, serverPairs]);

  // Format timestamp for display
  function formatTimestamp(timestamp: number, range: TimeRange): string {
    const date = new Date(timestamp);
    switch (range) {
      case "1h":
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "24h":
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "7d":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        });
      case "30d":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
    }
  }

  const chartConfig = {
    latency: {
      label: "Latency",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="min-h-[50vh] w-full bg-black font-body text-foreground antialiased">
      <main className="p-2 sm:p-4 md:p-6 lg:p-8">
        <Card className="bg-background/100 backdrop-blur-sm w-full max-w-[100vw] mx-auto">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Historical Latency Trends
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              View historical latency data for server pairs over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exchange-filter">Filter by Exchange</Label>
                <Select
                  value={selectedExchange}
                  onValueChange={(value) => {
                    setSelectedExchange(value);
                    setSelectedPairId(""); // Reset selection when filter changes
                  }}
                >
                  <SelectTrigger id="exchange-filter" className="w-full">
                    <SelectValue placeholder="Select Exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    {exchanges.map((ex) => (
                      <SelectItem key={ex} value={ex}>
                        {ex === "all" ? "All Exchanges" : ex}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pair-select">Select Server Pair</Label>
                <Select
                  value={selectedPairId}
                  onValueChange={setSelectedPairId}
                >
                  <SelectTrigger id="pair-select" className="w-full">
                    <SelectValue placeholder="Select a server pair">
                      {selectedPair
                        ? `${selectedPair.server1.name} ↔ ${selectedPair.server2.name}`
                        : "Select a server pair"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {serverPairs.map((pair) => (
                      <SelectItem key={pair.pairId} value={pair.pairId}>
                        {pair.server1.name} ↔ {pair.server2.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Range Selectors */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Range
              </Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "1h", label: "1 Hour" },
                    { value: "24h", label: "24 Hours" },
                    { value: "7d", label: "7 Days" },
                    { value: "30d", label: "30 Days" },
                  ] as const
                ).map((range) => (
                  <Button
                    key={range.value}
                    variant={timeRange === range.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range.value)}
                    className={
                      timeRange === range.value
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Statistics Display */}
            {selectedPair && historicalData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Minimum</p>
                        <p className="text-2xl font-bold text-green-400">
                          {statistics.min} ms
                        </p>
                      </div>
                      <Minus className="h-8 w-8 text-green-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {statistics.average} ms
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Maximum</p>
                        <p className="text-2xl font-bold text-red-400">
                          {statistics.max} ms
                        </p>
                      </div>
                      <Maximize2 className="h-8 w-8 text-red-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Selected Pair Info */}
            {selectedPair && (
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-sm">
                  {selectedPair.server1.name}
                </Badge>
                <span className="text-muted-foreground">↔</span>
                <Badge variant="outline" className="text-sm">
                  {selectedPair.server2.name}
                </Badge>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: "#FF9900",
                    color: "#fff",
                  }}
                  className="text-xs"
                >
                  {selectedPair.server1.cloudProvider}
                </Badge>
                <span className="text-muted-foreground">↔</span>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: "#4285F4",
                    color: "#fff",
                  }}
                  className="text-xs"
                >
                  {selectedPair.server2.cloudProvider}
                </Badge>
              </div>
            )}

            {/* Chart */}
            {historicalData.length > 0 ? (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <ChartContainer
                    config={chartConfig}
                    className="h-[400px] w-full"
                  >
                    <LineChart data={historicalData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.2}
                      />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: "Latency (ms)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      Time
                                    </span>
                                    <span className="text-sm font-medium">
                                      {data.fullTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      Latency
                                    </span>
                                    <span className="text-sm font-bold text-primary">
                                      {data.latency} ms
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latency"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    {serverPairs.length === 0
                      ? "No server pairs available. Try selecting a different exchange."
                      : "Select a server pair to view historical latency trends"}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HistoricalLatencyTrends;

