import { annualizedReturn, annualizedVolatility } from "@/lib/metrics";

function normalRandom() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function simulateMonteCarloFromReturns({
  returns,
  years,
  initial,
  yearlyContribution,
  trials = 2000,
}: {
  returns: number[];
  years: number;
  initial: number;
  yearlyContribution: number;
  trials?: number;
}) {
  const mu = annualizedReturn(returns);
  const sigma = annualizedVolatility(returns);
  const horizon = Math.max(3, Math.min(30, years));

  const finals: number[] = [];
  const trajectories: number[][] = [];

  for (let t = 0; t < trials; t++) {
    let value = initial;
    const path = [initial];
    for (let y = 1; y <= horizon; y++) {
      const shock = normalRandom();
      const annualRet = mu + sigma * shock;
      value = value * (1 + annualRet) + yearlyContribution;
      path.push(value);
    }
    finals.push(value);
    trajectories.push(path);
  }

  finals.sort((a, b) => a - b);
  const percentile = (p: number) => finals[Math.min(finals.length - 1, Math.max(0, Math.floor(finals.length * p)))];

  const p10 = percentile(0.1);
  const p50 = percentile(0.5);
  const p90 = percentile(0.9);

  const trajectoria = Array.from({ length: horizon + 1 }).map((_, i) => ({
    any: i,
    pessimista: Math.round(trajectories.map((t) => t[i]).sort((a, b) => a - b)[Math.floor(trials * 0.1)]),
    esperat: Math.round(trajectories.map((t) => t[i]).sort((a, b) => a - b)[Math.floor(trials * 0.5)]),
    optimista: Math.round(trajectories.map((t) => t[i]).sort((a, b) => a - b)[Math.floor(trials * 0.9)]),
  }));

  return { mu, sigma, trajectoria, p10, p50, p90, anys: horizon };
}
