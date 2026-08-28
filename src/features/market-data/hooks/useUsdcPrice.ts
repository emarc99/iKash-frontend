"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchUsdcPrice } from "../services/market-data.service";
import { UsdcPriceResult, UsdcPriceStatus } from "../types/market-data.types";

/** Poll interval in ms (60 seconds). */
const POLL_INTERVAL_MS = 60_000;

/**
 * Fetches and keeps the live USDC/USD price up-to-date.
 *
 * Behaviour:
 *  - Fetches immediately on mount.
 *  - Re-fetches every 60 s via setInterval.
 *  - Re-fetches when the browser tab becomes visible again.
 *  - Guards against overlapping requests with an in-flight ref.
 *  - Retains the last valid price during failures and marks it "stale".
 *  - Returns "error" only when no valid price has ever been received.
 */
export function useUsdcPrice(): UsdcPriceResult {
  const [price, setPrice] = useState<number | null>(null);
  const [lastValidAt, setLastValidAt] = useState<string | null>(null);
  const [status, setStatus] = useState<UsdcPriceStatus>("loading");

  // Prevent overlapping requests
  const isFetching = useRef(false);
  // Keep the latest price in a ref so the visibility handler closure doesn't
  // capture a stale value from the first render.
  const priceRef = useRef<number | null>(null);

  const doFetch = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const value = await fetchUsdcPrice();
      priceRef.current = value;
      setPrice(value);
      setLastValidAt(new Date().toISOString());
      setStatus("success");
    } catch {
      // Keep last valid price; switch to stale if we had one, error otherwise
      setStatus(priceRef.current !== null ? "stale" : "error");
    } finally {
      isFetching.current = false;
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    doFetch();

    const interval = setInterval(doFetch, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [doFetch]);

  // Refresh when the tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        doFetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [doFetch]);

  return { price, lastValidAt, status };
}
