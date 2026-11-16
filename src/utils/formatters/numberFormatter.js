/**
 * Formats a decimal number safely for academic tables.
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(decimals);
}

/**
 * Formats p-values according to APA 7 / psychology thesis standards.
 * Never reports p = 0.000; values below 0.001 are shown as "< .001".
 */
export function formatPValue(pValue) {
  if (pValue === null || pValue === undefined || !Number.isFinite(Number(pValue))) {
    return '—';
  }
  const p = Number(pValue);
  if (p < 0.001) {
    return '< .001';
  }
  return p.toFixed(3).replace(/^0\./, '.');
}

/**
 * Formats p-values with the appropriate operator ("< .001" or "= .047")
 * so inline expressions `p ${formatPValueWithOperator(p)}` never output `p = < .001`.
 */
export function formatPValueWithOperator(pValue) {
  if (pValue === null || pValue === undefined || !Number.isFinite(Number(pValue))) {
    return '= —';
  }
  const p = Number(pValue);
  if (p < 0.001) {
    return '< .001';
  }
  return `= ${p.toFixed(3).replace(/^0\./, '.')}`;
}

export function formatCI(ci, decimals = 2) {
  if (!ci || ci.lower === null || ci.upper === null) {
    return '—';
  }
  return `[${Number(ci.lower).toFixed(decimals)}, ${Number(ci.upper).toFixed(decimals)}]`;
}
