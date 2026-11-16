export function formatPercentage(count, total, decimals = 1) {
  if (!total || total <= 0 || !Number.isFinite(count)) {
    return '0.0%';
  }
  return `${((count / total) * 100).toFixed(decimals)}%`;
}
