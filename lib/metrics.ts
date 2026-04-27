export function dailyReturns(series: Array<{ date: string; close: number }>) {
  const out: Array<{ date: string; ret: number }> = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].close;
    const next = series[i].close;
    if (prev > 0 && Number.isFinite(next)) out.push({ date: series[i].date, ret: next / prev - 1 });
  }
  return out;
}

export function annualizedReturn(returns: number[]) {
  if (!returns.length) return 0;
  const compounded = returns.reduce((acc, r) => acc * (1 + r), 1);
  return Math.pow(compounded, 252 / returns.length) - 1;
}

export function annualizedVolatility(returns: number[]) {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function maxDrawdownFromReturns(returns: number[]) {
  let equity = 1;
  let peak = 1;
  let maxDD = 0;
  for (const r of returns) {
    equity *= 1 + r;
    peak = Math.max(peak, equity);
    maxDD = Math.min(maxDD, equity / peak - 1);
  }
  return maxDD;
}

export function sharpeRatio(returns: number[], riskFree = 0.015) {
  const ar = annualizedReturn(returns);
  const vol = annualizedVolatility(returns);
  if (vol === 0) return 0;
  return (ar - riskFree) / vol;
}

export function correlation(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const xs = x.slice(x.length - n);
  const ys = y.slice(y.length - n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const cov = xs.reduce((acc, v, i) => acc + (v - mx) * (ys[i] - my), 0) / (n - 1);
  const sx = Math.sqrt(xs.reduce((acc, v) => acc + (v - mx) ** 2, 0) / (n - 1));
  const sy = Math.sqrt(ys.reduce((acc, v) => acc + (v - my) ** 2, 0) / (n - 1));
  if (sx === 0 || sy === 0) return 0;
  return cov / (sx * sy);
}
