import { NextResponse } from "next/server";
import { parseCoinGeckoResponse } from "@/features/market-data/types/market-data.types";

/**
 * GET /api/market-data/usdc-price
 *
 * Server-side proxy that fetches the USDC/USD price from CoinGecko's free,
 * no-key-required simple/price endpoint.
 *
 * Using a Route Handler (rather than a direct client-side fetch) means:
 *  - The base URL stays server-side and is easy to swap for a paid provider.
 *  - If a private API key is ever needed, it can be added via the server-only
 *    MARKET_API_KEY env var without touching client bundles.
 *  - The browser never calls an external API directly, which avoids CORS issues.
 *
 * CoinGecko free-tier limits: ~30 req / min — the client polls every 60 s so
 * this endpoint will be called at most once per user per minute.
 */
export async function GET(): Promise<NextResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_MARKET_API_URL ??
    "https://api.coingecko.com/api/v3";

  // Optional: private API key for paid CoinGecko tiers or alternative providers.
  // NEVER use NEXT_PUBLIC_ for this variable.
  const apiKey = process.env.MARKET_API_KEY;

  const url = `${baseUrl}/simple/price?ids=usd-coin&vs_currencies=usd`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    // CoinGecko Pro uses x-cg-pro-api-key; adjust if using another provider.
    headers["x-cg-pro-api-key"] = apiKey;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000); // 8 s timeout

    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      // Revalidate every 30 s at the Next.js layer as a secondary cache
      next: { revalidate: 30 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const raw: unknown = await res.json();
    const price = parseCoinGeckoResponse(raw);

    if (price === null) {
      return NextResponse.json(
        { error: "Unexpected response structure from market-data provider" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { price, updatedAt: new Date().toISOString() },
      {
        status: 200,
        headers: {
          // Allow the browser to cache the response for 30 s
          "Cache-Control": "public, max-age=30, stale-while-revalidate=15",
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching price";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
