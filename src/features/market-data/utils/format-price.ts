/**
 * Formats a USDC/USD price value for display.
 *
 * Rules:
 *  - Preserves small market deviations (up to 6 decimal places).
 *  - Avoids unnecessary trailing zeros.
 *  - Always shows at least 2 decimal places.
 *
 * Examples:
 *   1.0012    → "1.0012"
 *   1.0       → "1.00"
 *   1.001200  → "1.0012"
 *   0.9998765 → "0.999877"
 */
export function formatUsdcPrice(price: number): string {
  // Try up to 6 decimal places, then strip trailing zeros (keeping min 2)
  const raw = price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
    useGrouping: false,
  });

  // Remove trailing zeros after the decimal point, but keep at least 2
  return raw.replace(/(\.\d{2}[1-9]?)0+$/, "$1");
}
