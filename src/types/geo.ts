export interface ServerLocation {
  id: string;
  name: string;
  exchange: string;
  cloudProvider: 'AWS' | 'GCP' | 'Azure' | 'Other';
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  latency: number; // in ms
}

export interface CloudRegion {
  id: string;
  provider: 'AWS' | 'GCP' | 'Azure';
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

export interface GeoData {
  servers: ServerLocation[];
  regions: CloudRegion[];
}

export interface HistoricalLatencyDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  latency: number; // in ms
}

export interface ServerPair {
  server1: ServerLocation;
  server2: ServerLocation;
  pairId: string; // Unique identifier for the pair
}

export interface HistoricalLatencyTrend {
  pairId: string;
  server1Name: string;
  server2Name: string;
  data: HistoricalLatencyDataPoint[];
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';