import type { Perfil } from "@/lib/scoring";
import { benchmarkPerPerfil, productesPerPerfil } from "@/lib/portfolio";
import { getDailySeries } from "@/lib/marketData";
import { annualizedReturn, annualizedVolatility, dailyReturns, maxDrawdownFromReturns, sharpeRatio, correlation } from "@/lib/metrics";

export type BacktestPayload = {
  updatedAt: string;
  dataSource: string;
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
  const rawProductData = await Promise.all(realProducts.map((p) => getDailySeries(p.tickerYahoo!, 756)));
  const benchData = await Promise.all(benchmark.map((b) => getDailySeries(b.ticker, 756)));

  const dateSet = new Set(rawProductData.flatMap((d) => d.series.map((s) => s.date)).filter(Boolean));
  const commonDates = Array.from(dateSet).sort().slice(-500);

  const portfolioReturns: Array<{ date: string; ret: number }> = commonDates.slice(1).map((date, idx) => {
    let ret = 0;
    for (const [i, p] of realProducts.entries()) {
      const series = rawProductData[i].series;
      const prev = series.find((x) => x.date === commonDates[idx])?.close;
      const curr = series.find((x) => x.date === date)?.close;
      if (prev && curr) ret += (p.percentatge / 100) * (curr / prev - 1);
    }
    return { date, ret };
  });

  const benchmarkReturns: Array<{ date: string; ret: number }> = commonDates.slice(1).map((date, idx) => {
    let ret = 0;
    for (const [i, b] of benchmark.entries()) {
      const series = benchData[i].series;
      const prev = series.find((x) => x.date === commonDates[idx])?.close;
      const curr = series.find((x) => x.date === date)?.close;
      if (prev && curr) ret += (b.pes / 100) * (curr / prev - 1);
    }
    return { date, ret };
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

  const riskReturn = realProducts.map((p, i) => {
    const rets = dailyReturns(rawProductData[i].series).map((x) => x.ret);
    return {
      nom: p.tickerOrientatiu,
      risc: annualizedVolatility(rets) * 100,
      rendiment: annualizedReturn(rets) * 100,
      pes: p.percentatge,
      serie: "Cartera",
    };
  });

  const volPortfolio = annualizedVolatility(pr);
  const riskContribution = riskReturn.map((item) => ({
    nom: item.nom,
    contribucio: volPortfolio > 0 ? (item.pes / 100) * (item.risc / (volPortfolio * 100)) * 100 : 0,
  }));

  const correlations: Array<{ x: string; y: string; value: number }> = [];
  for (let i = 0; i < realProducts.length; i++) {
    for (let j = i + 1; j < realProducts.length; j++) {
      const a = dailyReturns(rawProductData[i].series).map((x) => x.ret);
      const b = dailyReturns(rawProductData[j].series).map((x) => x.ret);
      correlations.push({ x: realProducts[i].tickerOrientatiu, y: realProducts[j].tickerOrientatiu, value: correlation(a, b) });
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    dataSource: [...new Set(rawProductData.map((d) => d.provider).concat(benchData.map((d) => d.provider)))].join(", "),
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
      ambDades: realProducts.map((p) => p.nom),
      pendents: productes.filter((p) => !p.dataAvailable).map((p) => p.nom),
      limitacions: "Alguns fons actius no tenen sèrie pública diària homogènia. S'exclouen dels càlculs quantitatius i es mantenen com informatius.",
    },
  };
}
