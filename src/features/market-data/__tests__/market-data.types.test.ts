import { describe, expect, it } from "vitest";
import {
  isValidUsdcPrice,
  parseCoinGeckoResponse,
  isMarketDataError,
} from "../types/market-data.types";

// ─── isValidUsdcPrice ────────────────────────────────────────────────────────

describe("isValidUsdcPrice", () => {
  it("accepts a positive finite number", () => {
    expect(isValidUsdcPrice(1.0012)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isValidUsdcPrice(0)).toBe(false);
  });

  it("rejects negative numbers", () => {
    expect(isValidUsdcPrice(-1)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidUsdcPrice(NaN)).toBe(false);
  });

  it("rejects Infinity", () => {
    expect(isValidUsdcPrice(Infinity)).toBe(false);
  });

  it("rejects strings", () => {
    expect(isValidUsdcPrice("1.0012")).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidUsdcPrice(null)).toBe(false);
  });
});

// ─── parseCoinGeckoResponse ──────────────────────────────────────────────────

describe("parseCoinGeckoResponse", () => {
  it("parses a valid CoinGecko simple/price response", () => {
    const raw = { "usd-coin": { usd: 1.0012 } };
    expect(parseCoinGeckoResponse(raw)).toBe(1.0012);
  });

  it("returns null for an empty object", () => {
    expect(parseCoinGeckoResponse({})).toBeNull();
  });

  it("returns null when the asset key is missing", () => {
    expect(parseCoinGeckoResponse({ bitcoin: { usd: 60000 } })).toBeNull();
  });

  it("returns null when the quote currency is missing", () => {
    expect(parseCoinGeckoResponse({ "usd-coin": { eur: 0.92 } })).toBeNull();
  });

  it("returns null when the price is zero", () => {
    expect(parseCoinGeckoResponse({ "usd-coin": { usd: 0 } })).toBeNull();
  });

  it("returns null when the price is negative", () => {
    expect(parseCoinGeckoResponse({ "usd-coin": { usd: -1 } })).toBeNull();
  });

  it("returns null for a string price", () => {
    expect(parseCoinGeckoResponse({ "usd-coin": { usd: "1.0012" } })).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseCoinGeckoResponse(null)).toBeNull();
  });

  it("returns null for a non-object", () => {
    expect(parseCoinGeckoResponse("hello")).toBeNull();
  });
});

// ─── isMarketDataError ───────────────────────────────────────────────────────

describe("isMarketDataError", () => {
  it("identifies an error response", () => {
    expect(isMarketDataError({ error: "something went wrong" })).toBe(true);
  });

  it("does not flag a success response as an error", () => {
    expect(
      isMarketDataError({ price: 1.0012, updatedAt: new Date().toISOString() })
    ).toBe(false);
  });
});
