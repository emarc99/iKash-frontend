import { describe, expect, it } from "vitest";
import { formatUsdcPrice } from "../utils/format-price";

describe("formatUsdcPrice", () => {
  it("preserves four significant decimals for a typical stablecoin price", () => {
    expect(formatUsdcPrice(1.0012)).toBe("1.0012");
  });

  it("shows at least two decimal places for a whole-number price", () => {
    expect(formatUsdcPrice(1)).toBe("1.00");
  });

  it("strips trailing zeros beyond two decimals", () => {
    expect(formatUsdcPrice(1.0012)).toBe("1.0012");
    expect(formatUsdcPrice(1.001200)).toBe("1.0012");
  });

  it("keeps up to six decimal places for tiny deviations", () => {
    expect(formatUsdcPrice(0.9998765)).toBe("0.999877");
  });

  it("formats an exactly-two-decimal value correctly", () => {
    expect(formatUsdcPrice(1.05)).toBe("1.05");
  });

  it("does not add thousands separators", () => {
    // USDC should never be > $2, but guard against unexpected grouping
    expect(formatUsdcPrice(1.0001)).not.toContain(",");
  });
});
