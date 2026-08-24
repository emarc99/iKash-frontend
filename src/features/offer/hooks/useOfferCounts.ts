"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface OfferCountsResult {
  buyCount: number | null;
  sellCount: number | null;
  isLoading: boolean;
}

/**
 * Fetches the total number of active buy and sell offers from the backend.
 *
 * Two parallel requests are made — one per type — because the backend does
 * not currently expose a summary/count endpoint.  Only non-executed offers
 * are counted (matching the filter applied in TradeDashboard).
 */
export function useOfferCounts(): OfferCountsResult {
  const [buyCount, setBuyCount] = useState<number | null>(null);
  const [sellCount, setSellCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel stale requests on unmount or re-fetch
  const abortRef = useRef<AbortController | null>(null);

  const fetchCounts = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

      const [buyRes, sellRes] = await Promise.all([
        fetch(`${baseUrl}/offers?type=buy`, { signal: controller.signal }),
        fetch(`${baseUrl}/offers?type=sell`, { signal: controller.signal }),
      ]);

      if (!buyRes.ok || !sellRes.ok) throw new Error("Failed to fetch offer counts");

      const [buyData, sellData]: [unknown[], unknown[]] = await Promise.all([
        buyRes.json(),
        sellRes.json(),
      ]);

      // Count only non-executed offers, matching the P2P dashboard filter
      const countActive = (arr: unknown[]) =>
        arr.filter(
          (o) => o !== null && typeof o === "object" && !(o as Record<string, unknown>).executed
        ).length;

      if (abortRef.current === controller) {
        setBuyCount(countActive(buyData));
        setSellCount(countActive(sellData));
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[useOfferCounts]", err);
      if (abortRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    return () => abortRef.current?.abort();
  }, [fetchCounts]);

  return { buyCount, sellCount, isLoading };
}
