// ─── Raw API response shape (CoinGecko simple/price) ────────────────────────
// GET https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd
// { "usd-coin": { "usd": 1.0012 } }

export interface CoinGeckoSimplePriceResponse {
  "usd-coin": {
    usd: number;
  };
}

// ─── Internal normalised price result ────────────────────────────────────────

export type UsdcPriceStatus = "loading" | "success" | "stale" | "error";

export interface UsdcPriceResult {
  /** Validated, positive price value — null when never successfully fetched */
  price: number | null;
  /** ISO timestamp of the last successful fetch */
  lastValidAt: string | null;
  status: UsdcPriceStatus;
}

// ─── Server-side Route Handler response ──────────────────────────────────────

export interface MarketDataRouteResponse {
  price: number;
  updatedAt: string;
}

export interface MarketDataRouteError {
  error: string;
}

export type MarketDataRouteResult = MarketDataRouteResponse | MarketDataRouteError;

// ─── Type guard helpers ───────────────────────────────────────────────────────

export function isValidUsdcPrice(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value > 0;
}

export function isMarketDataError(
  res: MarketDataRouteResult
): res is MarketDataRouteError {
  return "error" in res;
}

/**
 * Validates a raw CoinGecko simple/price response.
 * Ensures the expected asset + quote currency are present and the value is a
 * positive, finite number.
 */
export function parseCoinGeckoResponse(
  raw: unknown
): number | null {
  if (
    raw !== null &&
    typeof raw === "object" &&
    "usd-coin" in (raw as object)
  ) {
    const coin = (raw as CoinGeckoSimplePriceResponse)["usd-coin"];
    if (
      coin !== null &&
      typeof coin === "object" &&
      "usd" in coin &&
      isValidUsdcPrice(coin.usd)
    ) {
      return coin.usd;
    }
  }
  return null;
}
