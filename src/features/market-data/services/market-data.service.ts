import {
  isMarketDataError,
  isValidUsdcPrice,
  MarketDataRouteResult,
} from "../types/market-data.types";

/** How long (ms) a cached price is considered fresh — skip the network call. */
const CACHE_TTL_MS = 45_000; // 45 s

interface PriceCache {
  price: number;
  fetchedAt: number; // Date.now()
}

let cache: PriceCache | null = null;

/**
 * Fetches the current USDC/USD price from the internal Next.js route handler.
 *
 * - Returns the cached value if it is still within `CACHE_TTL_MS`.
 * - Validates the response before returning so callers never receive junk data.
 * - Rejects with an `Error` on any network or validation failure.
 */
export async function fetchUsdcPrice(signal?: AbortSignal): Promise<number> {
  // Return cache hit if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.price;
  }

  const res = await fetch("/api/market-data/usdc-price", {
    signal,
    // Tell Next.js not to use the Data Cache for this route
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Market-data API responded with ${res.status}`);
  }

  const json: MarketDataRouteResult = await res.json();

  if (isMarketDataError(json)) {
    throw new Error(json.error);
  }

  if (!isValidUsdcPrice(json.price)) {
    throw new Error(
      `Invalid price received from market-data route: ${json.price}`
    );
  }

  cache = { price: json.price, fetchedAt: Date.now() };
  return json.price;
}

/** Clears the in-memory cache — useful in tests. */
export function clearPriceCache(): void {
  cache = null;
}
