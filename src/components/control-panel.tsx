"use client";

import type { FC } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";
import { Server, Cloud, Network, Search, Layers, Download } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";

export interface Filters {
  search: string;
  exchange: string;
  latency: [number, number];
  providers: {
    AWS: boolean;
    GCP: boolean;
    Azure: boolean;
    Other: boolean;
  };
  layers: {
    servers: boolean;
    regions: boolean;
  };
}

interface ControlPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  exchanges: string[];
  className?: string;
  onClose: () => void;
  onExport?: () => void;
}

export const ControlPanel: FC<ControlPanelProps> = ({
  filters,
  onFiltersChange,
  exchanges,
  className,
  onClose,
  onExport,
}) => {
  const handleFilterChange = (
    newFilters: Partial<Filters> | { [key: string]: any }
  ) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  return (
    <Card
      className={cn(
        "shadow-2xl mt-6 bg-background/100 backdrop-blur-sm",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base md:text-lg">
            <Layers size={14} className="md:h-5 md:w-5 inline mr-2" />
            Controls & Filters
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExport}
              className="text-muted-foreground hover:text-foreground"
              title="Export Data"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <span className="text-xl">×</span>
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="h-full max-h-[calc(100vh-10rem)]">
        <CardContent className="space-y-4 md:space-y-6 pb-4 md:pb-6">
          <div className="space-y-2">
            <Label
              htmlFor="search"
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <Search size={14} className="md:h-5 md:w-5" />
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search servers"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="exchange"
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <Server size={14} className="md:h-5 md:w-5" />
              Exchange
            </Label>
            <Select
              value={filters.exchange}
              onValueChange={(value) => handleFilterChange({ exchange: value })}
            >
              <SelectTrigger id="exchange" className="text-xs md:text-sm">
                <SelectValue placeholder="Select Exchange" />
              </SelectTrigger>
              <SelectContent>
                {exchanges.map((ex) => (
                  <SelectItem
                    key={ex}
                    value={ex}
                    className="text-xs md:text-sm"
                  >
                    {ex === "all" ? "All Exchanges" : ex}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs md:text-sm">
              <Cloud size={14} className="md:h-5 md:w-5" />
              Cloud Providers
            </Label>
            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
              {Object.keys(filters.providers).map((provider) => (
                <div key={provider} className="flex items-center gap-2">
                  <Switch
                    id={provider}
                    checked={
                      filters.providers[
                        provider as keyof typeof filters.providers
                      ]
                    }
                    onCheckedChange={(checked) =>
                      handleFilterChange({
                        providers: {
                          ...filters.providers,
                          [provider]: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor={provider}>{provider}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="latency"
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <Network size={14} className="md:h-5 md:w-5" />
              Latency ({filters.latency[0]} - {filters.latency[1]}ms)
            </Label>
            <Slider
              id="latency"
              min={0}
              max={500}
              step={10}
              value={filters.latency}
              onValueChange={(value: [number, number]) =>
                handleFilterChange({ latency: value })
              }
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-xs md:text-sm">
              <Layers size={14} className="md:h-5 md:w-5" />
              Layers
            </Label>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="servers-layer"
                className="font-normal text-xs md:text-sm"
              >
                Exchange Servers
              </Label>
              <Switch
                id="servers-layer"
                checked={filters.layers.servers}
                onCheckedChange={(checked) =>
                  handleFilterChange({
                    layers: { ...filters.layers, servers: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="regions-layer"
                className="font-normal text-xs md:text-sm"
              >
                Cloud Regions
              </Label>
              <Switch
                id="regions-layer"
                checked={filters.layers.regions}
                onCheckedChange={(checked) =>
                  handleFilterChange({
                    layers: { ...filters.layers, regions: checked },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
