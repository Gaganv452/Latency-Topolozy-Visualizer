"use client";

import type { FC } from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { ArrowDown, ArrowUp, RefreshCw, AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "../components/ui/badge";

// Type definitions for the Blockchain.com ticker API response
interface Ticker {
  symbol: string;
  price_24h: number;
  volume_24h: number;
  last_trade_price: number;
  previous_price?: number; // For animation tracking
  previous_volume?: number; // For volume change tracking
}

type SortKey = keyof Ticker;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

const LiveMarketDataPage: FC = () => {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("volume_24h");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    ITEMS_PER_PAGE_OPTIONS[0]
  );
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const previousTickersRef = useRef<Ticker[]>([]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Use Next.js API route to proxy the request and avoid CORS issues
      // Add multiple cache-busting strategies to ensure fresh data
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const cacheBuster = `?t=${timestamp}&r=${random}&_=${timestamp}`;
      
      console.log(`[Frontend] Fetching data at ${new Date().toISOString()} with cache-buster: ${cacheBuster}`);
      
      const response = await fetch(
        `/api/tickers${cacheBuster}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "X-Request-Time": timestamp.toString(),
          },
          cache: "no-store", // Prevent browser caching
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      let data: any = await response.json();
      
      // Check if the response contains an error (from our API route)
      if (!response.ok || (data && data.error)) {
        const errorMessage = data?.error || `Failed to fetch market data. Status: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Log response metadata
      const responseTimestamp = response.headers.get("X-Timestamp");
      console.log(`[Frontend] API Response received at ${new Date().toISOString()}`);
      console.log(`[Frontend] Response timestamp from server: ${responseTimestamp}`);
      console.log(`[Frontend] Response type:`, typeof data, "Is array:", Array.isArray(data));
      
      // Log first ticker to see if values are actually changing
      if (Array.isArray(data) && data.length > 0) {
        const firstTicker = data[0];
        console.log(`[Frontend] First ticker sample:`, {
          symbol: firstTicker.symbol || firstTicker.Symbol || 'unknown',
          raw: firstTicker,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Validate data structure
      if (!Array.isArray(data)) {
        // Check if data is an object with a tickers array
        if (data && typeof data === 'object' && Array.isArray(data.tickers)) {
          console.log("Found tickers array in data.tickers");
          data = data.tickers;
        } else if (data && typeof data === 'object') {
          // Try to find array in the response
          const possibleArrays = Object.values(data).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            console.log("Found array in object:", possibleArrays.length, "arrays found");
            data = possibleArrays[0];
          } else {
            console.error("No array found in response object. Keys:", Object.keys(data));
            throw new Error("Invalid data format received from API");
          }
        } else {
          console.error("Data is not an array or object:", typeof data);
          throw new Error("Invalid data format received from API");
        }
      }
      
      console.log("Processing", data.length, "tickers");
      
      // Filter and map data - handle different possible field names
      const validTickers = (data as any[])
        .map((ticker: any, index: number) => {
          // Handle different possible field names for symbol
          const symbol = ticker.symbol || ticker.Symbol || ticker.pair || ticker.symbol_pair || '';
          
          // Handle different possible field names for last trade price
          const lastTradePrice = ticker.last_trade_price || ticker.lastTradePrice || ticker.price || ticker.last || ticker.lastPrice || ticker.close || 0;
          
          // Try multiple field names for 24h opening price (price 24 hours ago)
          // This is the reference point for calculating 24h change
          const price24h = ticker.price_24h || ticker.price24h || ticker.open_24h || ticker.open24h || ticker.open || ticker.price_24h_open || ticker.price24h_open || ticker.open_price || 0;
          
          // Try multiple field names for 24h volume (cumulative volume over last 24 hours)
          const volume24h = ticker.volume_24h || ticker.volume24h || ticker.volume || ticker.volume24 || ticker.volume_24 || ticker.volume_24h_total || ticker.volume24h_total || ticker.total_volume_24h || 0;
          
          // Find previous ticker data for change detection and animation
          const previousTicker = previousTickersRef.current.find(t => t.symbol === symbol);
          const previousPrice = previousTicker?.last_trade_price;
          const previousVolume = previousTicker?.volume_24h;
          
          // Log first few tickers for debugging - show all available fields
          if (index < 3) {
            console.log(`Ticker ${index} (${symbol}):`, {
              raw_fields: Object.keys(ticker),
              raw_sample: ticker,
              parsed: { 
                symbol, 
                lastTradePrice, 
                price24h, 
                volume24h,
                calculated_24h_change: lastTradePrice - price24h,
                calculated_24h_change_percent: price24h > 0 ? ((lastTradePrice - price24h) / price24h * 100).toFixed(2) + '%' : 'N/A'
              }
            });
          }
          
          return {
            symbol,
            last_trade_price: Number(lastTradePrice) || 0,
            price_24h: Number(price24h) || 0,
            volume_24h: Number(volume24h) || 0,
            previous_price: previousPrice,
            previous_volume: previousVolume,
          };
        })
        .filter(
          (ticker) => {
            const isValid = ticker &&
              ticker.symbol &&
              ticker.symbol.trim() !== '' &&
              (ticker.last_trade_price > 0 || ticker.price_24h > 0 || ticker.volume_24h > 0);
            
            if (!isValid && ticker) {
              console.warn("Filtered out invalid ticker:", ticker);
            }
            
            return isValid;
          }
        );
      
      console.log("Valid tickers after filtering:", validTickers.length, "out of", data.length);
      
      if (validTickers.length === 0) {
        console.error("No valid tickers found. Raw data sample:", Array.isArray(data) ? data.slice(0, 3) : data);
        console.error("Data type:", typeof data, "Is array:", Array.isArray(data));
        setError("No valid ticker data received. The API response format may have changed. Check console for details.");
        setTickers([]);
      } else {
        console.log(`Successfully loaded ${validTickers.length} tickers`);
        console.log("Sample tickers:", validTickers.slice(0, 3));
        
        // Check if data actually changed by comparing key values
        const previousTickers = previousTickersRef.current;
        let hasChanged = false;
        const changedTickers: string[] = [];
        
        if (previousTickers.length !== validTickers.length) {
          hasChanged = true;
          console.log(`📊 Ticker count changed: ${previousTickers.length} → ${validTickers.length}`);
        } else {
          // Compare all tickers to see if prices/volumes changed
          for (let i = 0; i < validTickers.length; i++) {
            const prev = previousTickers.find(t => t.symbol === validTickers[i].symbol);
            const curr = validTickers[i];
            
            if (prev) {
              const priceChanged = Math.abs(prev.last_trade_price - curr.last_trade_price) > 0.01;
              const volumeChanged = Math.abs(prev.volume_24h - curr.volume_24h) > 0.01;
              const price24hChanged = Math.abs(prev.price_24h - curr.price_24h) > 0.01;
              
              if (priceChanged || volumeChanged || price24hChanged) {
                hasChanged = true;
                changedTickers.push(curr.symbol);
                if (changedTickers.length <= 3) {
                  console.log(`📊 Data changed for ${curr.symbol}:`, {
                    price: priceChanged ? `${prev.last_trade_price.toFixed(2)} → ${curr.last_trade_price.toFixed(2)}` : 'unchanged',
                    volume: volumeChanged ? `${prev.volume_24h.toFixed(0)} → ${curr.volume_24h.toFixed(0)}` : 'unchanged',
                    price24h: price24hChanged ? `${prev.price_24h.toFixed(2)} → ${curr.price_24h.toFixed(2)}` : 'unchanged',
                  });
                }
              }
            } else {
              // New ticker
              hasChanged = true;
              changedTickers.push(curr.symbol);
            }
          }
        }
        
        if (hasChanged) {
          console.log(`✅ Data has changed - ${changedTickers.length} ticker(s) updated:`, changedTickers.slice(0, 5));
        } else {
          console.log("⚠️ Data appears unchanged - API may be returning cached data or market values haven't changed");
          console.log("💡 Note: Some APIs update less frequently. Values may remain constant during low trading activity.");
        }
        
        // Store previous tickers for animation
        previousTickersRef.current = tickers;
        setTickers(validTickers);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      // Handle different error types
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request timed out. Please check your internet connection and try again.");
        } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("Network request failed")) {
          setError("Network error. Please check your internet connection and try again.");
        } else if (err.message.includes("CORS") || err.message.includes("CORS policy")) {
          setError("CORS error. The API may not be accessible from this domain.");
        } else {
          setError(err.message || "An unknown error occurred");
        }
      } else {
        setError("An unknown error occurred while fetching market data.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds to get updated data
    // This ensures 24h change and volume values stay current:
    // - 24h Change: Updates as last_trade_price changes (real-time price movements)
    // - 24h Volume: Updates as new trades add to the cumulative 24-hour volume
    const interval = setInterval(() => {
      if (!error) {
        setIsRefreshing(true);
        fetchData();
      }
    }, 10000); // Refresh every 10 seconds for more frequent updates
    return () => clearInterval(interval);
  }, [fetchData, error]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, priceFilter]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortDirection("desc");
      }
      return key;
    });
    setCurrentPage(1); // Reset to first page on sort
  }, []);

  const filteredTickers = useMemo(() => {
    let filtered = tickers;

    if (debouncedSearch) {
      filtered = filtered.filter((ticker) =>
        ticker.symbol.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (priceFilter !== "all") {
      filtered = filtered.filter((ticker) => {
        const price = ticker.last_trade_price;
        switch (priceFilter) {
          case "low":
            return price < 1000;
          case "medium":
            return price >= 1000 && price < 10000;
          case "high":
            return price >= 10000;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => {
      const valueA = a[sortKey] ?? 0;
      const valueB = b[sortKey] ?? 0;
      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tickers, sortKey, sortDirection, debouncedSearch, priceFilter]);

  const paginatedTickers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTickers.length / itemsPerPage);

  const getPriceChange = useCallback((ticker: Ticker) => {
    // Use price_24h if available, otherwise calculate from previous price
    if (ticker.price_24h > 0) {
      return ticker.last_trade_price - ticker.price_24h;
    }
    // Fallback: if we have previous price, use that
    if (ticker.previous_price && ticker.previous_price > 0) {
      return ticker.last_trade_price - ticker.previous_price;
    }
    return 0;
  }, []);

  const getPriceChangePercent = useCallback(
    (ticker: Ticker) => {
      // Use price_24h if available
      if (ticker.price_24h > 0) {
        return (getPriceChange(ticker) / ticker.price_24h) * 100;
      }
      // Fallback: if we have previous price, use that
      if (ticker.previous_price && ticker.previous_price > 0) {
        return (getPriceChange(ticker) / ticker.previous_price) * 100;
      }
      return 0;
    },
    [getPriceChange]
  );

  const getPriceChangeDirection = useCallback((ticker: Ticker) => {
    const change = getPriceChange(ticker);
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }, [getPriceChange]);

  return (
    <div className="min-h-screen w-full bg-black font-body text-foreground antialiased">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="bg-background/100 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  Market Tickers
                  {isRefreshing && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">
                  Data is refreshed automatically every 10 seconds.
                  {lastUpdate && (
                    <span className="ml-2 text-xs flex items-center gap-1">
                      <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                      {isRefreshing && (
                        <span className="text-blue-400 animate-pulse">🔄 Updating...</span>
                      )}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading || isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search by symbol..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64"
              />
              <div className="flex items-center gap-4">
                <Select
                  value={priceFilter}
                  onValueChange={(value) => {
                    setPriceFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">Under $1,000</SelectItem>
                    <SelectItem value="medium">$1,000 - $10,000</SelectItem>
                    <SelectItem value="high">Over $10,000</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPriceFilter("all");
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Status Panel - Enhanced UI */}
            <div className="mb-4 p-4 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm rounded-lg border border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : error ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm font-medium">
                      {loading ? 'Loading...' : error ? 'Error' : 'Connected'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Tickers</div>
                  <div className="text-sm font-semibold">{tickers.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Filtered</div>
                  <div className="text-sm font-semibold">{filteredTickers.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Page</div>
                  <div className="text-sm font-semibold">
                    {currentPage} / {totalPages}
                  </div>
                </div>
              </div>
              {(debouncedSearch || priceFilter !== 'all') && (
                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                  {debouncedSearch && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{debouncedSearch}"
                    </Badge>
                  )}
                  {priceFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Price: {priceFilter === 'low' ? 'Under $1,000' : priceFilter === 'medium' ? '$1,000-$10,000' : 'Over $10,000'}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {loading && <TableSkeleton />}
            {error && (
              <div className="py-8 text-center space-y-4">
                <div className="text-destructive font-medium text-base sm:text-lg">
                  {error}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchData();
                  }}
                  className="mt-4"
                >
                  Retry
                </Button>
                <div className="text-sm text-muted-foreground mt-2">
                  If the problem persists, the API may be temporarily unavailable.
                </div>
              </div>
            )}
            {!loading && !error && tickers.length === 0 && (
              <div className="py-8 text-center space-y-4">
                <div className="text-muted-foreground text-base">
                  No market data available at this time.
                </div>
                <div className="text-sm text-muted-foreground">
                  The API may be temporarily unavailable or the response format may have changed.
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchData();
                  }}
                  className="mt-4"
                >
                  Refresh Data
                </Button>
              </div>
            )}
            {!loading && !error && tickers.length > 0 && filteredTickers.length === 0 && (
              <div className="py-8 text-center space-y-4">
                <div className="text-muted-foreground text-base">
                  No tickers match your search criteria.
                </div>
                <div className="text-sm text-muted-foreground">
                  Found {tickers.length} total tickers, but none match your filters.
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPriceFilter("all");
                    setCurrentPage(1);
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
            {!loading && !error && tickers.length > 0 && filteredTickers.length > 0 && (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader
                        id="symbol"
                        title="Symbol"
                        currentSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        className="w-[120px] sm:w-[150px]"
                      />
                      <SortableHeader
                        id="last_trade_price"
                        title="Last Price"
                        currentSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        className="w-[120px] sm:w-[150px]"
                      />
                      <TableHead className="w-[120px] sm:w-[150px]">
                        24h Change
                      </TableHead>
                      <SortableHeader
                        id="volume_24h"
                        title="24h Volume"
                        currentSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                        className="w-[120px] sm:w-[150px]"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No tickers match your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTickers.map((ticker) => {
                        const priceChange = getPriceChange(ticker);
                        const priceChangePercent = getPriceChangePercent(ticker);
                        const direction = getPriceChangeDirection(ticker);
                        const hasChanged = ticker.previous_price && ticker.previous_price !== ticker.last_trade_price;
                        
                        return (
                          <TableRow 
                            key={ticker.symbol}
                            className={`transition-all duration-300 ${
                              hasChanged && direction === 'up' 
                                ? 'bg-green-500/10 hover:bg-green-500/20' 
                                : hasChanged && direction === 'down'
                                ? 'bg-red-500/10 hover:bg-red-500/20'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <TableCell className="font-medium whitespace-nowrap text-sm sm:text-base">
                              <div className="flex items-center gap-2">
                                {ticker.symbol}
                                {hasChanged && (
                                  <span className="inline-block animate-pulse">
                                    {direction === 'up' ? (
                                      <TrendingUp className="h-3 w-3 text-green-500" />
                                    ) : direction === 'down' ? (
                                      <TrendingDown className="h-3 w-3 text-red-500" />
                                    ) : null}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap text-sm sm:text-base">
                              <div className="flex items-center gap-1">
                                ${ticker.last_trade_price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                {hasChanged && (
                                  <span className={`text-xs animate-pulse ${
                                    direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : ''
                                  }`}>
                                    {direction === 'up' ? '↑' : direction === 'down' ? '↓' : ''}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm sm:text-base">
                              <div className="flex items-center gap-1">
                                {direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                {direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                                <span
                                  className={
                                    priceChange > 0
                                      ? "text-green-400 font-semibold"
                                      : priceChange < 0
                                      ? "text-red-400 font-semibold"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {priceChange > 0 ? "+" : ""}
                                  {priceChange.toFixed(4)} (
                                  {priceChangePercent > 0 ? "+" : ""}
                                  {priceChangePercent.toFixed(2)}%)
                                </span>
                                {/* Show 24h reference price if available */}
                                {ticker.price_24h > 0 && ticker.price_24h !== ticker.last_trade_price && (
                                  <span className="text-xs text-muted-foreground ml-1" title={`24h ago: $${ticker.price_24h.toFixed(2)}`}>
                                    (24h: ${ticker.price_24h.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap text-sm sm:text-base">
                              {ticker.volume_24h > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span>${ticker.volume_24h.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}</span>
                                  {/* Show volume change indicator */}
                                  {ticker.previous_volume !== undefined && ticker.previous_volume !== ticker.volume_24h && (
                                    <span className={`text-xs ${
                                      ticker.volume_24h > ticker.previous_volume 
                                        ? 'text-green-500' 
                                        : 'text-red-500'
                                    }`} title={`Previous: $${ticker.previous_volume.toLocaleString()}`}>
                                      {ticker.volume_24h > ticker.previous_volume ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const SortableHeader: FC<{
  id: SortKey;
  title: string;
  currentSort: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}> = ({ id, title, currentSort, direction, onSort, className }) => (
  <TableHead
    className={`cursor-pointer hover:bg-muted/50 whitespace-nowrap ${className}`}
    onClick={() => onSort(id)}
  >
    <div className="flex items-center gap-2">
      {title}
      {currentSort === id &&
        (direction === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        ))}
    </div>
  </TableHead>
);

const TableSkeleton = () => (
  <div className="space-y-2">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

export default LiveMarketDataPage;
