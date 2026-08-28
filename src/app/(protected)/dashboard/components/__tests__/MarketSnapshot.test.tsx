/**
 * Component tests for MarketSnapshot.
 *
 * The two hooks used by the component are mocked so the tests are
 * fully deterministic and require no network access.
 *
 * Note: this project does not configure @testing-library/jest-dom, so
 * assertions use vitest's built-in matchers (.toBeDefined(), .toBeNull(),
 * .toBeTruthy()) plus DOM queries from @testing-library/react.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketSnapshot } from "../MarketSnapshot";

// ─── Mock hooks ──────────────────────────────────────────────────────────────

vi.mock("@/features/market-data/hooks/useUsdcPrice", () => ({
  useUsdcPrice: vi.fn(),
}));

vi.mock("@/features/offer/hooks/useOfferCounts", () => ({
  useOfferCounts: vi.fn(),
}));

import { useUsdcPrice } from "@/features/market-data/hooks/useUsdcPrice";
import { useOfferCounts } from "@/features/offer/hooks/useOfferCounts";

const mockUsdcPrice = useUsdcPrice as ReturnType<typeof vi.fn>;
const mockOfferCounts = useOfferCounts as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderSnapshot() {
  return render(<MarketSnapshot />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MarketSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it("shows skeleton placeholders while price and counts are loading", () => {
    mockUsdcPrice.mockReturnValue({
      price: null,
      lastValidAt: null,
      status: "loading",
    });
    mockOfferCounts.mockReturnValue({
      buyCount: null,
      sellCount: null,
      isLoading: true,
    });

    const { container } = renderSnapshot();

    // The animated skeleton elements should be present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // No price value or error message should appear yet
    expect(screen.queryByText(/\d+\.\d+ USD/)).toBeNull();
    expect(screen.queryByText("Price unavailable")).toBeNull();
  });

  // ── Success state ──────────────────────────────────────────────────────────

  it("displays formatted USDC price and offer counts on success", () => {
    mockUsdcPrice.mockReturnValue({
      price: 1.0012,
      lastValidAt: new Date().toISOString(),
      status: "success",
    });
    mockOfferCounts.mockReturnValue({
      buyCount: 12,
      sellCount: 23,
      isLoading: false,
    });

    renderSnapshot();

    // Price formatted and labelled
    expect(screen.getByText("1.0012")).toBeDefined();
    expect(screen.getByText("USD")).toBeDefined();

    // Offer counts
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("23")).toBeDefined();

    // No stale / error indicators
    expect(screen.queryByText(/stale/i)).toBeNull();
    expect(screen.queryByText("Price unavailable")).toBeNull();
  });

  // ── Stale state ────────────────────────────────────────────────────────────

  it("shows last known price with a stale indicator when the API is unreachable", () => {
    mockUsdcPrice.mockReturnValue({
      price: 1.0012,
      lastValidAt: new Date(Date.now() - 120_000).toISOString(),
      status: "stale",
    });
    mockOfferCounts.mockReturnValue({
      buyCount: 5,
      sellCount: 10,
      isLoading: false,
    });

    renderSnapshot();

    // Price is still shown
    expect(screen.getByText("1.0012")).toBeDefined();
    // Stale warning is present
    expect(screen.getByText(/stale/i)).toBeDefined();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it("shows 'Price unavailable' when no valid price has ever been received", () => {
    mockUsdcPrice.mockReturnValue({
      price: null,
      lastValidAt: null,
      status: "error",
    });
    mockOfferCounts.mockReturnValue({
      buyCount: 3,
      sellCount: 7,
      isLoading: false,
    });

    renderSnapshot();

    expect(screen.getByText("Price unavailable")).toBeDefined();

    // Must not display a hardcoded or zero price
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("0.00")).toBeNull();
  });

  // ── Region labelling ───────────────────────────────────────────────────────

  it("has an accessible region label", () => {
    mockUsdcPrice.mockReturnValue({ price: 1, lastValidAt: null, status: "success" });
    mockOfferCounts.mockReturnValue({ buyCount: 0, sellCount: 0, isLoading: false });

    renderSnapshot();

    expect(
      screen.getByRole("region", { name: /market snapshot/i })
    ).toBeDefined();
  });

  // ── Header ─────────────────────────────────────────────────────────────────

  it("renders the 'Market Snapshot' heading", () => {
    mockUsdcPrice.mockReturnValue({ price: 1, lastValidAt: null, status: "success" });
    mockOfferCounts.mockReturnValue({ buyCount: 0, sellCount: 0, isLoading: false });

    renderSnapshot();

    expect(screen.getByText("Market Snapshot")).toBeDefined();
  });
});
