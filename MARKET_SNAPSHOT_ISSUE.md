# Issue: Implement Market Snapshot With Live USDC Price

## Overview

The dashboard is missing a **Market Snapshot** widget that gives users an at-a-glance view of P2P
market activity and the current USDC/USD price. The component is defined in the approved Figma design
([node 547-2372](https://www.figma.com/design/cTjxeBLUu4wtQS5BSqANBt/iKash?node-id=547-2372&t=wrB53PpUAusdU18x-0))
and must be wired to live data — no hardcoded values.

---

## The Problem

### What is missing

The `DashboardPage` currently renders only `WalletDashboard` (balance + assets) and
`ActiveOrdersSection` (open orders). There is no component that shows:

- How many **buy offers** are currently active on the platform.
- How many **sell offers** are currently active on the platform.
- The live **USDC/USD market price** with real-time refresh.

### Why it cannot be trivially added

There are two distinct data-sourcing challenges:

#### 1 — Offer counts

The backend `/offers` endpoint accepts a `type` filter (`buy` or `sell`) and returns an array.
There is no existing `/offers/count` or summary endpoint. To get both counts the dashboard would
need to issue **two separate requests** (one per type), or the backend would need a new aggregation
endpoint.

The existing `useOffers` hook manages its own array state and is designed for the P2P trade list —
it is not suitable for a lightweight snapshot because it also carries filter/abort/CRUD logic that
is irrelevant in the dashboard context.

#### 2 — Live USDC price

There is no market-data integration anywhere in the project. The price must come from a **public
external API** (e.g. CoinGecko, Kraken, Binance). Two constraints make this non-trivial:

- **Credential safety.** Any provider that requires a private API key must not expose that key via a
  `NEXT_PUBLIC_*` variable. A key-bearing call must go through a server-side Next.js Route Handler
  (`/api/market-data/usdc-price`) so the secret stays server-side only.
- **No caching library.** The project does not use React Query or SWR. Polling, deduplication, and
  stale-value retention must be implemented manually using `useEffect`, `useRef`, and
  `visibilitychange`.

---

## Recommended Solution

### Architecture

```
src/
├── app/
│   ├── api/
│   │   └── market-data/
│   │       └── usdc-price/
│   │           └── route.ts          ← Next.js Route Handler (server-side proxy)
│   └── (protected)/
│       └── dashboard/
│           └── components/
│               └── MarketSnapshot.tsx  ← Presentation component (pure UI)
└── features/
    └── market-data/
        ├── hooks/
        │   └── useUsdcPrice.ts        ← Polling hook with stale-value fallback
        ├── services/
        │   └── market-data.service.ts ← Validated fetch against /api/market-data/usdc-price
        └── types/
            └── market-data.types.ts   ← Response shapes + validation helpers
```

Offer counts are obtained through a **new lightweight hook**
`src/features/offer/hooks/useOfferCounts.ts` that makes two parallel requests:
`GET /offers?type=buy` and `GET /offers?type=sell`, then exposes only `{ buyCount, sellCount,
isLoading }`. This avoids touching the existing `useOffers` hook, which is used only on the P2P
page.

### Data flow

```
DashboardPage
  └── MarketSnapshot
        ├── useOfferCounts()   →  GET /offers?type=buy  (our backend)
        │                      →  GET /offers?type=sell (our backend)
        └── useUsdcPrice()     →  GET /api/market-data/usdc-price (Next.js Route Handler)
                                        └── fetches CoinGecko / Kraken (server-side, key hidden)
```

### Route Handler (credential proxy)

`/api/market-data/usdc-price/route.ts` is a Next.js `GET` Route Handler that:

1. Reads `MARKET_API_KEY` from server-side env (not `NEXT_PUBLIC_*`).
2. Calls the configured provider URL (`NEXT_PUBLIC_MARKET_API_URL` for the base URL only — the key
   is never embedded in client bundles).
3. Validates the response: asset = USDC, quote = USD, value is numeric and positive.
4. Returns `{ price: number, updatedAt: string }` to the browser, or `{ error: string }` on
   failure.

If using CoinGecko's free tier (no key required), the Route Handler still acts as a thin proxy so
the provider URL stays configurable and can be swapped without frontend changes.

### `useUsdcPrice` hook

Follows the same `useState` + `useEffect` + plain `fetch` pattern used throughout the codebase
(no React Query / SWR). Key behaviour:

| Behaviour | Implementation |
|---|---|
| Initial load | `useEffect` on mount |
| 60-second polling | `setInterval` inside `useEffect` |
| Tab-visibility refresh | `visibilitychange` listener calls fetch when `document.visibilityState === "visible"` |
| No overlapping requests | `useRef<boolean>` flag; skip if a fetch is already in-flight |
| Stale-value retention | Keep last valid price in state; expose `isStale: boolean` when polling fails |
| 30–60 s client cache | Compare `Date.now()` against `lastFetchedAt` ref; skip fetch if fresh |

### `MarketSnapshot` component

Pure presentational component that accepts props and renders the approved design:

```
┌──────────────────────────────────────────────────────┐
│  ⓘ  Market Snapshot                                  │
│                          │                           │
│  Offers                  │  USDC Price               │
│  Buy: 12   Sell: 23      │  1.0012 USD               │
└──────────────────────────────────────────────────────┘
```

Design tokens from the existing codebase:
- Background: `#161618`, border: `#1F2937`, radius: `rounded-2xl`
- Accent / numbers: `#BCED09` (lime green, consistent with offer price colour)
- Secondary text: `#8F8389`
- Price text: `white`, label text: `#A1969C`
- A vertical divider (`border-l border-[#2D2D2D]`) separates the Offers column from the USDC Price
  column, matching the Figma design.

States to handle in the component:

| State | Offer counts | USDC price |
|---|---|---|
| Loading | skeleton pulses | skeleton pulse |
| Success | numbers rendered in `#BCED09` | formatted price, e.g. `1.0012 USD` |
| Stale (last known price, API unreachable) | — | price shown with `⚠ Stale` badge |
| Error / no data | `—` | `Price unavailable` |

### Price formatting

```ts
// Removes trailing zeros, preserves 4-6 decimal places for sub-cent deviations
function formatUsdcPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
// e.g. 1.001200 → "1.0012"
```

### Response validation

Before storing any external API value, validate:

```ts
function isValidUsdcPrice(raw: unknown): raw is number {
  return typeof raw === "number" && isFinite(raw) && raw > 0;
}
```

The Route Handler additionally confirms that the response object contains the expected field
structure for the chosen provider (e.g. `data["usd-coin"].usd` for CoinGecko simple-price).

---

## Environment variables

| Variable | Side | Purpose |
|---|---|---|
| `NEXT_PUBLIC_MARKET_API_URL` | Client-safe (base URL only) | Provider base URL, configurable without code changes |
| `MARKET_API_KEY` | **Server only** — never `NEXT_PUBLIC_` | Private API key for providers that require one |

Example `.env.local` entries:

```
NEXT_PUBLIC_MARKET_API_URL=https://api.coingecko.com/api/v3
# MARKET_API_KEY=secret-key-here   ← only needed for paid tiers
```

---

## Placement on the Dashboard

Insert `<MarketSnapshot />` inside `DashboardPage` between the `Header` and the existing
`WalletDashboard` / `ActiveOrdersSection` split, or as the top element inside the right panel
(`hidden md:flex` column), matching the Figma layout. The exact insertion point should be confirmed
against the full Figma canvas.

---

## Files to create

| File | Purpose |
|---|---|
| `src/app/api/market-data/usdc-price/route.ts` | Server-side proxy Route Handler |
| `src/features/market-data/types/market-data.types.ts` | Types + validation helpers |
| `src/features/market-data/services/market-data.service.ts` | `fetchUsdcPrice()` client function |
| `src/features/market-data/hooks/useUsdcPrice.ts` | Polling hook with stale-value handling |
| `src/features/offer/hooks/useOfferCounts.ts` | Lightweight buy/sell count hook |
| `src/app/(protected)/dashboard/components/MarketSnapshot.tsx` | Presentation component |

## Files to modify

| File | Change |
|---|---|
| `src/app/(protected)/dashboard/page.tsx` | Import and render `<MarketSnapshot />` |
| `.env.local` (not committed) | Add `NEXT_PUBLIC_MARKET_API_URL` |
| `.env.example` (committed) | Document the new env vars (keys redacted) |

---

## Out of scope

- Price history charts.
- Additional cryptocurrencies.
- Multiple fiat currencies.
- Creating a custom market-data microservice.
- Modifying the backend `/offers` endpoint.

---

## Acceptance criteria summary

- [ ] Component matches the approved Figma design on desktop and mobile.
- [ ] Buy and sell offer counts reflect live backend data (not hardcoded).
- [ ] USDC/USD price is fetched from a live public API (not hardcoded).
- [ ] Price refreshes every ~60 seconds and on tab focus.
- [ ] Skeleton shown during initial load; dimensions do not shift.
- [ ] Last valid price retained during transient failures, with stale indicator.
- [ ] "Price unavailable" shown when no valid price has ever been received.
- [ ] No private API key exposed in `NEXT_PUBLIC_*` variables or client bundles.
- [ ] External API response is validated before rendering.
- [ ] Unit tests cover price formatting and response validation.
- [ ] Component tests cover loading, success, stale, and error states.
