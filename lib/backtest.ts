import type { Perfil } from "@/lib/scoring";
import { benchmarkPerPerfil, productesPerPerfil } from "@/lib/portfolio";
import { getDailySeriesSafe } from "@/lib/marketData";
import { annualizedReturn, annualizedVolatility, dailyReturns, maxDrawdownFromReturns, sharpeRatio, correlation } from "@/lib/metrics";

export type BacktestPayload = {
  updatedAt: string;
  dataSource: string;
  dataStatus: "validated" | "partial" | "pending";
  realDataSufficient: boolean;
  warnings: string[];
  missingApiKeys: string[];
  benchmark: {
    composicio: Array<{ component: string; ticker: string; pes: number; rationale: string }>;
  };
  data: Array<{ date: string; cartera: number; benchmark: number; carteraDD: number; benchmarkDD: number }>;
  metrics: {
    rendibilitatAnualitzada: number;
    volatilitat: number;
    maxDrawdown: number;
    sharpe: number;
    rendimentAcumulat: number;
  };
  benchmarkMetrics: {
    rendibilitatAnualitzada: number;
    volatilitat: number;
    maxDrawdown: number;
    sharpe: number;
    rendimentAcumulat: number;
  };
  correlations: Array<{ x: string; y: string; value: number }>;
  riskReturn: Array<{ nom: string; risc: number; rendiment: number; pes: number; serie: string }>;
  riskContribution: Array<{ nom: string; contribucio: number }>;
  availability: {
    ambDades: string[];
    pendents: string[];
    limitacions: string;
  };
};

export async function buildBacktest(perfil: Perfil): Promise<BacktestPayload> {
  const productes = productesPerPerfil(perfil);
  const benchmark = benchmarkPerPerfil(perfil);
  const realProducts = productes.filter((p) => p.dataAvailable && p.tickerYahoo);
  const productFetch = await Promise.all(realProducts.map((p) => getDailySeriesSafe(p.tickerYahoo!, 756)));
  const benchmarkFetch = await Promise.all(benchmark.map((b) => getDailySeriesSafe(b.ticker, 756)));
  const missingApiKeys = [...new Set([...productFetch, ...benchmarkFetch].flatMap((x) => (x.ok ? [] : x.missingKeys)))];
  const warnings = [...productFetch, ...benchmarkFetch].flatMap((x) => (x.ok ? [] : x.errors));

  const resolvedProducts = realProducts
    .map((p, idx) => ({ product: p, fetch: productFetch[idx] }))
    .filter((entry): entry is { product: (typeof realProducts)[number]; fetch: Extract<(typeof productFetch)[number], { ok: true }> } => entry.fetch.ok);

  const resolvedBench = benchmark
    .map((b, idx) => ({ bench: b, fetch: benchmarkFetch[idx] }))
    .filter((entry): entry is { bench: (typeof benchmark)[number]; fetch: Extract<(typeof benchmarkFetch)[number], { ok: true }> } => entry.fetch.ok);

  if (resolvedProducts.length < 2 || resolvedBench.length < 2) {
    return {
      updatedAt: new Date().toISOString(),
      dataSource: "Dades pendents de connexió",
      dataStatus: "pending",
      realDataSufficient: false,
      warnings,
      missingApiKeys,
      benchmark: { composicio: benchmark },
      data: [],
      metrics: { rendibilitatAnualitzada: 0, volatilitat: 0, maxDrawdown: 0, sharpe: 0, rendimentAcumulat: 0 },
      benchmarkMetrics: { rendibilitatAnualitzada: 0, volatilitat: 0, maxDrawdown: 0, sharpe: 0, rendimentAcumulat: 0 },
      correlations: [],
      riskReturn: [],
      riskContribution: [],
      availability: {
        ambDades: resolvedProducts.map((p) => p.product.nom),
        pendents: productes.filter((p) => !resolvedProducts.some((rp) => rp.product.id === p.id)).map((p) => p.nom),
        limitacions: "No hi ha prou sèries reals per generar mètriques robustes. S’indica com a dades pendents de connexió.",
      },
    };
  }

  const dateSet = new Set(resolvedProducts.flatMap((d) => d.fetch.data.series.map((s) => s.date)).filter(Boolean));
  const commonDates = Array.from(dateSet).sort().slice(-500);

  const portfolioReturns: Array<{ date: string; ret: number }> = commonDates.slice(1).map((date, idx) => {
    let ret = 0;
    let totalWeight = 0;
    for (const entry of resolvedProducts) {
      const series = entry.fetch.data.series;
      const prev = series.find((x) => x.date === commonDates[idx])?.close;
      const curr = series.find((x) => x.date === date)?.close;
      if (prev && curr) {
        ret += (entry.product.percentatge / 100) * (curr / prev - 1);
        totalWeight += entry.product.percentatge / 100;
      }
    }
    return { date, ret: totalWeight > 0 ? ret / totalWeight : 0 };
  });

  const benchmarkReturns: Array<{ date: string; ret: number }> = commonDates.slice(1).map((date, idx) => {
    let ret = 0;
    let totalWeight = 0;
    for (const entry of resolvedBench) {
      const series = entry.fetch.data.series;
      const prev = series.find((x) => x.date === commonDates[idx])?.close;
      const curr = series.find((x) => x.date === date)?.close;
      if (prev && curr) {
        ret += (entry.bench.pes / 100) * (curr / prev - 1);
        totalWeight += entry.bench.pes / 100;
      }
    }
    return { date, ret: totalWeight > 0 ? ret / totalWeight : 0 };
  });

  let cartera = 10000;
  let bench = 10000;
  let maxC = cartera;
  let maxB = bench;
  const evolution = [{ date: commonDates[0] || new Date().toISOString().slice(0, 10), cartera, benchmark: bench, carteraDD: 0, benchmarkDD: 0 }];
  for (let i = 0; i < portfolioReturns.length; i++) {
    cartera *= 1 + portfolioReturns[i].ret;
    bench *= 1 + benchmarkReturns[i].ret;
    maxC = Math.max(maxC, cartera);
    maxB = Math.max(maxB, bench);
    evolution.push({
      date: portfolioReturns[i].date,
      cartera: Math.round(cartera),
      benchmark: Math.round(bench),
      carteraDD: ((cartera - maxC) / maxC) * 100,
      benchmarkDD: ((bench - maxB) / maxB) * 100,
    });
  }

  const pr = portfolioReturns.map((x) => x.ret);
  const br = benchmarkReturns.map((x) => x.ret);

  const riskReturn = resolvedProducts.map((entry) => {
    const rets = dailyReturns(entry.fetch.data.series).map((x) => x.ret);
    return {
      nom: entry.product.tickerOrientatiu,
      risc: annualizedVolatility(rets) * 100,
      rendiment: annualizedReturn(rets) * 100,
      pes: entry.product.percentatge,
      serie: "Cartera",
    };
  });

  const volPortfolio = annualizedVolatility(pr);
  const riskContribution = riskReturn.map((item) => ({
    nom: item.nom,
    contribucio: volPortfolio > 0 ? (item.pes / 100) * (item.risc / (volPortfolio * 100)) * 100 : 0,
  }));

  const correlations: Array<{ x: string; y: string; value: number }> = [];
  for (let i = 0; i < resolvedProducts.length; i++) {
    for (let j = i + 1; j < resolvedProducts.length; j++) {
      const a = dailyReturns(resolvedProducts[i].fetch.data.series).map((x) => x.ret);
      const b = dailyReturns(resolvedProducts[j].fetch.data.series).map((x) => x.ret);
      correlations.push({ x: resolvedProducts[i].product.tickerOrientatiu, y: resolvedProducts[j].product.tickerOrientatiu, value: correlation(a, b) });
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    dataSource: [...new Set(resolvedProducts.map((d) => d.fetch.data.provider).concat(resolvedBench.map((d) => d.fetch.data.provider)))].join(", "),
    dataStatus: resolvedProducts.length === realProducts.length ? "validated" : "partial",
    realDataSufficient: true,
    warnings,
    missingApiKeys,
    benchmark: { composicio: benchmark },
    data: evolution,
    metrics: {
      rendibilitatAnualitzada: annualizedReturn(pr) * 100,
      volatilitat: annualizedVolatility(pr) * 100,
      maxDrawdown: maxDrawdownFromReturns(pr) * 100,
      sharpe: sharpeRatio(pr),
      rendimentAcumulat: (evolution[evolution.length - 1].cartera / evolution[0].cartera - 1) * 100,
    },
    benchmarkMetrics: {
      rendibilitatAnualitzada: annualizedReturn(br) * 100,
      volatilitat: annualizedVolatility(br) * 100,
      maxDrawdown: maxDrawdownFromReturns(br) * 100,
      sharpe: sharpeRatio(br),
      rendimentAcumulat: (evolution[evolution.length - 1].benchmark / evolution[0].benchmark - 1) * 100,
    },
    correlations,
    riskReturn,
    riskContribution,
    availability: {
      ambDades: resolvedProducts.map((p) => p.product.nom),
      pendents: productes.filter((p) => !resolvedProducts.some((rp) => rp.product.id === p.id)).map((p) => p.nom),
      limitacions:
        "Alguns productes no tenen ticker vàlid o no tenen sèrie pública diària homogènia. Només els productes amb dades contrastables entren en els càlculs reals.",
    },
  };
}
