// Spaces group thousands; commas separate decimals throughout the calculators.
export const numberFormat = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 6, useGrouping: "always" });

export function parseNumberInput(text: string): number | null {
  const normalized = text.replace(/\s/g, "").replace(",", ".");
  if (!/^\d*(?:\.\d*)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
