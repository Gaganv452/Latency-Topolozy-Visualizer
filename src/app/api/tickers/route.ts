import { NextResponse } from "next/server";

// Force dynamic rendering - prevent Next.js from caching this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Add multiple cache-busting strategies to ensure fresh data
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cacheBuster = `?t=${timestamp}&r=${random}&_=${timestamp}`;
    
    console.log(`[API] Fetching fresh data at ${new Date().toISOString()} with cache-buster: ${cacheBuster}`);
    
    const response = await fetch(`https://api.blockchain.com/v3/exchange/tickers${cacheBuster}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "If-None-Match": `"${timestamp}"`, // Force fresh response
      },
      cache: "no-store", // Prevent Next.js from caching
      next: { revalidate: 0 }, // Disable Next.js caching
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch market data. Status: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log a sample of the data to verify it's changing
    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      console.log(`[API] Sample ticker data:`, {
        symbol: sample.symbol || sample.Symbol || 'unknown',
        price: sample.last_trade_price || sample.lastTradePrice || sample.price || 'N/A',
        timestamp: new Date().toISOString(),
      });
    }
    
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Timestamp": timestamp.toString(), // Add timestamp header
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: error.message || "An unknown error occurred" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "An unknown error occurred while fetching market data." },
      { status: 500 }
    );
  }
}

