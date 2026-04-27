"use client";

import { useState, type ReactNode } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { calcularScoringClient, type Client, type Perfil, type ScoringResult } from "@/lib/scoring";

type CarteraModel = {
  rendaVariable: number;
  rendaFixa: number;
  liquiditat: number;
  alternatius: number;
};

type ProducteCartera = {
  id: string;
  nom: string;
  isin: string;
  tickerOrientatiu: string;
  categoria: string;
  tipus: string;
  risc: string;
  perfilRecomanat: string;
  rol: string;
  blocActiu: string;
  benchmarkRef: string;
  percentatge: number;
  criteri: string;
  justificacio: string;
};

type ClientResult = ScoringResult & {
  cartera: CarteraModel;
};

const COLORS = {
  bg: "#f5f7f6",
  white: "#ffffff",
  primaryDark: "#0c2d2a",
  primaryLight: "#eef6f4",
  gold: "#b39b72",
  textDark: "#1a1a1a",
  textMedium: "#404040",
  textLight: "#666666",
  border: "#e0e6e5",
  danger: "#b1412c",
  green: "#1a6b4a",
};

const initialClient: Client = {
  nom: "",
  edat: "",
  ingressosMensualsNets: "",
  despesesFixesMensuals: "",
  despesesVariablesMensuals: "",
  estalviMensual: "",
  estalviLiquid: "",
  patrimoniInvertit: "0",
  deuteTotal: "0",
  quotaMensualDeutes: "0",
  objectiuPrincipal: "creixer_patrimoni",
  importObjectiu: "",
  horitzoAnys: "",
  percentatgeEstalviInvertir: "",
  coneixementFinancer: "basic",
  experienciaInversora: "mai",
  anysInvertint: "0",
  reaccioCaiguda10: "mantenir",
  reaccioCaiguda25: "mantenir",
  perduaMaximaTolerable: "15",
  tempsAguantariaPerdues: "6_24_mesos",
  mercatCau: "mantenir",
  inversioPujaRapid: "revisar",
  frequenciaRevisio: "mensual",
  preferenciaESG: "indiferent",
};

function formatEuro(value: number) {
  return new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPct(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

function carteraPerPerfil(perfil: Perfil): CarteraModel {
  if (perfil === "Conservador") return { rendaVariable: 20, rendaFixa: 65, liquiditat: 10, alternatius: 5 };
  if (perfil === "Moderat") return { rendaVariable: 45, rendaFixa: 45, liquiditat: 5, alternatius: 5 };
  if (perfil === "Dinàmic") return { rendaVariable: 70, rendaFixa: 20, liquiditat: 5, alternatius: 5 };
  return { rendaVariable: 90, rendaFixa: 5, liquiditat: 0, alternatius: 5 };
}

type UniverseProduct = {
  id: string;
  nom: string;
  isin: string;
  tickerOrientatiu: string;
  categoria: string;
  tipus: string;
  risc: "Baix" | "Mitjà" | "Alt" | "Molt alt";
  perfils: Perfil[];
  rol: "Core" | "Satellite" | "Thematic/high risk" | "Income/dividend" | "Defensive/liquidity";
  blocActiu: "Renda variable" | "Renda fixa" | "Liquiditat" | "Alternatius";
};

const PRODUCT_UNIVERSE: UniverseProduct[] = [
  { id: "world-core", nom: "Trade MSCI ACWI USD Acc", isin: "N/D", tickerOrientatiu: "Trade ACWI", categoria: "Global Equity", tipus: "ETF", risc: "Mitjà", perfils: ["Conservador", "Moderat", "Dinàmic", "Agressiu"], rol: "Core", blocActiu: "Renda variable" },
  { id: "aggh", nom: "ETF renda fixa global coberta EUR", isin: "IE00BDBRDM35", tickerOrientatiu: "AGGH", categoria: "Global Bonds", tipus: "ETF", risc: "Baix", perfils: ["Conservador", "Moderat", "Dinàmic"], rol: "Defensive/liquidity", blocActiu: "Renda fixa" },
  { id: "ibgs", nom: "ETF renda fixa governamental EUR curt termini", isin: "IE00B3VTMJ91", tickerOrientatiu: "IBGS", categoria: "Government Bonds", tipus: "ETF", risc: "Baix", perfils: ["Conservador", "Moderat"], rol: "Defensive/liquidity", blocActiu: "Renda fixa" },
  { id: "cash", nom: "Fons monetari EUR", isin: "N/D", tickerOrientatiu: "Monetari EUR", categoria: "Liquidity", tipus: "Fons monetari", risc: "Baix", perfils: ["Conservador", "Moderat", "Dinàmic"], rol: "Defensive/liquidity", blocActiu: "Liquiditat" },
  { id: "reits", nom: "ETF REIT global", isin: "N/D", tickerOrientatiu: "IWDP", categoria: "Real Estate", tipus: "ETF", risc: "Mitjà", perfils: ["Moderat", "Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Alternatius" },
  { id: "small-eu", nom: "Invesco Continental European Small Cap Equity A EUR Acc", isin: "LU2305834041", tickerOrientatiu: "Invesco Small Cap EU", categoria: "Europa Small Caps", tipus: "Fons", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "small-global-vg", nom: "Vanguard Global Small-Cap Index Fund EUR Acc", isin: "IE00B42W4L06", tickerOrientatiu: "Vanguard Small Cap", categoria: "Global Small Caps", tipus: "Fons indexat", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "small-global-ish", nom: "iShares MSCI World Small Cap UCITS ETF USD Acc", isin: "N/D", tickerOrientatiu: "IUSN", categoria: "Global Small Caps", tipus: "ETF", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "em-vg", nom: "Vanguard Emerging Markets Stock Index Fund EUR", isin: "IE0031786696", tickerOrientatiu: "Vanguard EM", categoria: "Mercats emergents", tipus: "Fons indexat", risc: "Alt", perfils: ["Moderat", "Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "asia-active", nom: "Federated Hermes Asia ex-Japan Equity Fund Class F Acc", isin: "IE00B8H6X308", tickerOrientatiu: "Hermes Asia ex-Japan", categoria: "Àsia ex-Japó", tipus: "Fons actiu", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "nasdaq-my", nom: "MyInvestor Nasdaq-100", isin: "N/D", tickerOrientatiu: "Nasdaq-100", categoria: "NASDAQ 100", tipus: "Fons indexat", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "qqq", nom: "Invesco QQQ Trust Series 1 ETF", isin: "US46090E1038", tickerOrientatiu: "QQQ", categoria: "NASDAQ 100", tipus: "ETF", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "ai-polar", nom: "Polar Capital Artificial Intelligence Fund I Acc", isin: "IE00BF0GL329", tickerOrientatiu: "Polar AI", categoria: "Tecnologia i IA", tipus: "Fons", risc: "Molt alt", perfils: ["Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "tech-polar", nom: "Polar Capital Global Technology Fund R", isin: "IE00BM95B621", tickerOrientatiu: "Polar Tech", categoria: "Tecnologia global", tipus: "Fons", risc: "Molt alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "tech-fidelity", nom: "Fidelity Funds Global Technology Fund A-Acc-EUR Hedged", isin: "LU1841614867", tickerOrientatiu: "Fidelity Tech Hedged", categoria: "Tecnologia global", tipus: "Fons", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "biotech", nom: "Polar Capital Biotech R Inc", isin: "IE00B3VXGD32", tickerOrientatiu: "Polar Biotech", categoria: "Innovació sanitària", tipus: "Fons", risc: "Molt alt", perfils: ["Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "energy-bgf", nom: "BlackRock Global Funds World Energy Fund D2 EUR", isin: "LU0252963896", tickerOrientatiu: "BGF World Energy", categoria: "Energia", tipus: "Fons", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "energy-vg", nom: "Vanguard Energy Fund Investor Shares", isin: "US9219081091", tickerOrientatiu: "VGENX", categoria: "Energia", tipus: "Fons", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "gold-miners", nom: "DWS Invest Gold and Precious Metals Equities LC", isin: "LU0273159177", tickerOrientatiu: "DWS Gold Miners", categoria: "Mineres / Or", tipus: "Fons", risc: "Molt alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Alternatius" },
  { id: "china-index", nom: "Pictet China Index P EUR", isin: "LU0625737910", tickerOrientatiu: "Pictet China", categoria: "Xina", tipus: "Fons indexat", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable" },
  { id: "div-jpm", nom: "JPMorgan Investment Funds Global Dividend Fund A div EUR", isin: "LU0714179727", tickerOrientatiu: "JPM Global Dividend", categoria: "Dividends", tipus: "Fons", risc: "Mitjà", perfils: ["Moderat", "Dinàmic"], rol: "Income/dividend", blocActiu: "Renda variable" },
  { id: "div-vg", nom: "Vanguard Global Equity Income Fund", isin: "N/D", tickerOrientatiu: "Vanguard Equity Income", categoria: "Dividends", tipus: "Fons", risc: "Mitjà", perfils: ["Moderat", "Dinàmic"], rol: "Income/dividend", blocActiu: "Renda variable" },
  { id: "oil-gas-ish", nom: "iShares Oil & Gas Exploration & Production", isin: "N/D", tickerOrientatiu: "iShares Oil&Gas", categoria: "Energia", tipus: "ETF", risc: "Molt alt", perfils: ["Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
  { id: "robotics", nom: "Global X Robotics & Artificial Intelligence ETF", isin: "N/D", tickerOrientatiu: "BOTZ", categoria: "Tecnologia i IA", tipus: "ETF", risc: "Molt alt", perfils: ["Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable" },
];

const PROFILE_SELECTION: Record<Perfil, Array<{ id: string; percentatge: number; criteri: string; justificacio: string }>> = {
  Conservador: [
    { id: "cash", percentatge: 10, criteri: "Reserva de liquiditat", justificacio: "Cobertura d’imprevistos i reducció del risc de venda forçada." },
    { id: "ibgs", percentatge: 35, criteri: "Defensa de curta durada", justificacio: "Durada moderada i menor sensibilitat a tipus d’interès." },
    { id: "aggh", percentatge: 30, criteri: "Diversificació de renda fixa", justificacio: "Bloc estabilitzador global amb cobertura a EUR." },
    { id: "world-core", percentatge: 20, criteri: "Core de creixement prudent", justificacio: "Exposició global diversificada amb pes controlat." },
    { id: "div-jpm", percentatge: 5, criteri: "Renda periòdica", justificacio: "Complement d’ingressos en perfil defensiu." },
  ],
  Moderat: [
    { id: "world-core", percentatge: 35, criteri: "Nucli global", justificacio: "Motor principal de creixement ajustat al risc moderat." },
    { id: "aggh", percentatge: 28, criteri: "Estabilització", justificacio: "Reduceix volatilitat total de cartera." },
    { id: "ibgs", percentatge: 12, criteri: "Durada curta", justificacio: "Amortidor addicional davant cicles de tipus." },
    { id: "em-vg", percentatge: 8, criteri: "Creixement emergent", justificacio: "Potencial estructural amb pes limitat." },
    { id: "div-vg", percentatge: 7, criteri: "Income", justificacio: "Component de dividends per estabilitzar retorns." },
    { id: "cash", percentatge: 5, criteri: "Liquiditat tàctica", justificacio: "Marge per reequilibris." },
    { id: "reits", percentatge: 5, criteri: "Diversificació real asset", justificacio: "Exposició immobiliària cotitzada." },
  ],
  Dinàmic: [
    { id: "world-core", percentatge: 35, criteri: "Core global", justificacio: "Base d’exposició global de renda variable." },
    { id: "em-vg", percentatge: 12, criteri: "Emergents", justificacio: "Creixement a llarg termini." },
    { id: "small-global-vg", percentatge: 8, criteri: "Small caps", justificacio: "Prima de mida i diversificació." },
    { id: "nasdaq-my", percentatge: 10, criteri: "Tecnologia large cap", justificacio: "Exposició a innovació i creixement." },
    { id: "aggh", percentatge: 15, criteri: "Control de risc", justificacio: "Bloc de renda fixa per contenir drawdowns." },
    { id: "reits", percentatge: 5, criteri: "Alternatiu líquid", justificacio: "Diversificació de fonts de retorn." },
    { id: "div-jpm", percentatge: 5, criteri: "Income quality", justificacio: "Empreses madures amb dividends." },
    { id: "cash", percentatge: 10, criteri: "Gestió tàctica", justificacio: "Reserva per aportacions i reequilibris." },
  ],
  Agressiu: [
    { id: "world-core", percentatge: 26, criteri: "Core global", justificacio: "Base diversificada per evitar concentració extrema." },
    { id: "em-vg", percentatge: 15, criteri: "Emergents", justificacio: "Elevat potencial de creixement." },
    { id: "small-global-ish", percentatge: 10, criteri: "Small caps global", justificacio: "Increment de beta i prima de mida." },
    { id: "qqq", percentatge: 10, criteri: "Nasdaq 100", justificacio: "Biaix a mega-cap tecnològiques." },
    { id: "ai-polar", percentatge: 8, criteri: "Temàtica IA", justificacio: "Exposició específica a disrupció tecnològica." },
    { id: "energy-bgf", percentatge: 8, criteri: "Temàtica energia", justificacio: "Diversificació cíclica i de matèries primeres." },
    { id: "aggh", percentatge: 13, criteri: "Estabilització mínima", justificacio: "Petit bloc per controlar risc agregat." },
    { id: "cash", percentatge: 10, criteri: "Liquiditat operativa", justificacio: "Reserves per volatilitat i oportunitats." },
  ],
};

function benchmarkPerCategoria(categoria: string) {
  if (categoria.includes("Global Equity")) return "MSCI ACWI Index";
  if (categoria.includes("Global Bonds")) return "Bloomberg Global Aggregate Bond EUR Hedged";
  if (categoria.includes("Government Bonds")) return "ICE BofA Euro Government 1-3Y";
  if (categoria.includes("Liquidity")) return "€STR";
  if (categoria.includes("Real Estate")) return "FTSE EPRA/NAREIT Global REIT";
  if (categoria.includes("Small Caps")) return "MSCI World Small Cap";
  if (categoria.includes("emergents") || categoria.includes("Mercats emergents")) return "MSCI Emerging Markets";
  if (categoria.includes("NASDAQ")) return "NASDAQ-100";
  if (categoria.includes("Tecnologia")) return "MSCI World Information Technology";
  if (categoria.includes("Energia")) return "MSCI World Energy";
  if (categoria.includes("Dividends")) return "MSCI World High Dividend Yield";
  if (categoria.includes("Xina")) return "MSCI China";
  return "Benchmark sectorial equivalent";
}

function productesPerPerfil(perfil: Perfil): ProducteCartera[] {
  const picks = PROFILE_SELECTION[perfil];
  return picks
    .slice(0, 8)
    .map((pick) => {
      const producte = PRODUCT_UNIVERSE.find((x) => x.id === pick.id);
      if (!producte) return null;
      return {
        id: producte.id,
        nom: producte.nom,
        isin: producte.isin,
        tickerOrientatiu: producte.tickerOrientatiu,
        categoria: producte.categoria,
        tipus: producte.tipus,
        risc: producte.risc,
        perfilRecomanat: producte.perfils.join(", "),
        rol: producte.rol,
        blocActiu: producte.blocActiu,
        benchmarkRef: benchmarkPerCategoria(producte.categoria),
        percentatge: pick.percentatge,
        criteri: pick.criteri,
        justificacio: pick.justificacio,
      } satisfies ProducteCartera;
    })
    .filter((x): x is ProducteCartera => Boolean(x));
}

function calcularClient(client: Client): ClientResult {
  const scoring = calcularScoringClient(client);
  return {
    ...scoring,
    cartera: carteraPerPerfil(scoring.perfilFinal),
  };
}

function generarBacktestSimulat(perfil: Perfil) {
  const params =
    perfil === "Conservador"
      ? { r: 0.032, v: 0.055, dd: -9.8, s: 0.38 }
      : perfil === "Moderat"
      ? { r: 0.052, v: 0.092, dd: -18.5, s: 0.43 }
      : perfil === "Dinàmic"
      ? { r: 0.068, v: 0.135, dd: -27.4, s: 0.45 }
      : { r: 0.079, v: 0.18, dd: -36.2, s: 0.42 };

  const shocks = [-0.04, 0.06, 0.02, -0.08, 0.11, 0.04, -0.12, 0.15, 0.07, -0.05, 0.09];
  const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];

  let cartera = 10000;
  let benchmark = 10000;
  const data = [{ any: "Inici", cartera, benchmark }];

  for (let i = 0; i < years.length; i++) {
    cartera *= 1 + params.r + shocks[i] * (params.v / 0.165);
    benchmark *= 1 + 0.074 + shocks[i];
    data.push({ any: years[i], cartera: Math.round(cartera), benchmark: Math.round(benchmark) });
  }

  return {
    data,
    metrics: {
      rendibilitatAnualitzada: params.r * 100,
      volatilitat: params.v * 100,
      maxDrawdown: params.dd,
      sharpe: params.s,
    },
    benchmarkMetrics: {
      rendibilitatAnualitzada: 7.4,
      volatilitat: 16.5,
      maxDrawdown: -34.1,
      sharpe: 0.39,
    },
  };
}

function benchmarkCompost(perfil: Perfil) {
  const base =
    perfil === "Conservador"
      ? [
          { component: "Global Aggregate Bond EUR Hedged", pes: 55, r: 3.1, v: 5.8 },
          { component: "Euro Govt 1-3y", pes: 25, r: 2.3, v: 2.8 },
          { component: "MSCI ACWI", pes: 15, r: 7.4, v: 16.5 },
          { component: "Cash EUR", pes: 5, r: 1.7, v: 0.8 },
        ]
      : perfil === "Moderat"
      ? [
          { component: "MSCI ACWI", pes: 45, r: 7.4, v: 16.5 },
          { component: "Global Aggregate Bond EUR Hedged", pes: 40, r: 3.1, v: 5.8 },
          { component: "Euro Govt 1-3y", pes: 10, r: 2.3, v: 2.8 },
          { component: "Global REIT", pes: 5, r: 5.9, v: 18.2 },
        ]
      : perfil === "Dinàmic"
      ? [
          { component: "MSCI ACWI", pes: 60, r: 7.4, v: 16.5 },
          { component: "MSCI EM", pes: 12, r: 8.2, v: 20.8 },
          { component: "MSCI World Small Cap", pes: 8, r: 8.1, v: 19.5 },
          { component: "Global Aggregate Bond EUR Hedged", pes: 15, r: 3.1, v: 5.8 },
          { component: "Global REIT", pes: 5, r: 5.9, v: 18.2 },
        ]
      : [
          { component: "MSCI ACWI", pes: 62, r: 7.4, v: 16.5 },
          { component: "NASDAQ 100", pes: 13, r: 10.2, v: 24.5 },
          { component: "MSCI EM", pes: 10, r: 8.2, v: 20.8 },
          { component: "World Energy", pes: 7, r: 7.8, v: 25.2 },
          { component: "Global Aggregate Bond EUR Hedged", pes: 8, r: 3.1, v: 5.8 },
        ];

  const rendibilitat = base.reduce((acc, x) => acc + (x.pes / 100) * x.r, 0);
  const volatilitat = Math.sqrt(base.reduce((acc, x) => acc + (x.pes / 100) ** 2 * x.v ** 2, 0));
  return { composicio: base, rendibilitat, volatilitat };
}

function classeActiuBenchmark(component: string): "Renda variable" | "Renda fixa" | "Liquiditat" | "Alternatius" {
  const text = component.toLowerCase();
  if (text.includes("bond") || text.includes("govt")) return "Renda fixa";
  if (text.includes("cash")) return "Liquiditat";
  if (text.includes("reit")) return "Alternatius";
  return "Renda variable";
}

function comparacioClasseActiu(cartera: CarteraModel, benchmark: ReturnType<typeof benchmarkCompost>) {
  const benchmarkAgg = { "Renda variable": 0, "Renda fixa": 0, Liquiditat: 0, Alternatius: 0 };
  for (const b of benchmark.composicio) {
    const classe = classeActiuBenchmark(b.component);
    benchmarkAgg[classe] += b.pes;
  }
  return [
    { classe: "Renda variable", cartera: cartera.rendaVariable, benchmark: benchmarkAgg["Renda variable"] },
    { classe: "Renda fixa", cartera: cartera.rendaFixa, benchmark: benchmarkAgg["Renda fixa"] },
    { classe: "Liquiditat", cartera: cartera.liquiditat, benchmark: benchmarkAgg.Liquiditat },
    { classe: "Alternatius", cartera: cartera.alternatius, benchmark: benchmarkAgg.Alternatius },
  ];
}

function metriquesComparatives(backtest: ReturnType<typeof generarBacktestSimulat>, benchmark: ReturnType<typeof benchmarkCompost>) {
  const sharpeBenchmark = benchmark.volatilitat > 0 ? benchmark.rendibilitat / benchmark.volatilitat : 0;
  return [
    ["Rendibilitat esperada", formatPct(backtest.metrics.rendibilitatAnualitzada), formatPct(benchmark.rendibilitat)],
    ["Volatilitat", formatPct(backtest.metrics.volatilitat), formatPct(benchmark.volatilitat)],
    ["Sharpe aprox.", backtest.metrics.sharpe.toFixed(2), sharpeBenchmark.toFixed(2)],
    ["Drawdown estimat", formatPct(backtest.metrics.maxDrawdown), formatPct(backtest.benchmarkMetrics.maxDrawdown)],
  ];
}

function productesPerBloc(productes: ProducteCartera[]) {
  const blocMap = new Map<string, number>();
  for (const p of productes) blocMap.set(p.blocActiu, (blocMap.get(p.blocActiu) || 0) + p.percentatge);
  return Array.from(blocMap.entries()).map(([bloc, pes]) => ({ bloc, pes }));
}

function riscVsRendibilitat(productes: ProducteCartera[]) {
  const riskScore: Record<string, number> = { Baix: 5, Mitjà: 10, Alt: 16, "Molt alt": 24 };
  return productes.map((p) => ({
    nom: p.tickerOrientatiu,
    risc: riskScore[p.risc] || 12,
    rendiment: p.risc === "Baix" ? 2.5 : p.risc === "Mitjà" ? 5.2 : p.risc === "Alt" ? 8.1 : 10.5,
    pes: p.percentatge,
    serie: "Cartera",
  }));
}

function drawdownSeries(backtest: ReturnType<typeof generarBacktestSimulat>) {
  let maxC = backtest.data[0].cartera;
  let maxB = backtest.data[0].benchmark;
  return backtest.data.map((d) => {
    maxC = Math.max(maxC, d.cartera);
    maxB = Math.max(maxB, d.benchmark);
    return {
      any: d.any,
      carteraDD: ((d.cartera - maxC) / maxC) * 100,
      benchmarkDD: ((d.benchmark - maxB) / maxB) * 100,
    };
  });
}

function simulacioMonteCarlo(result: ClientResult) {
  const anys = Math.max(3, Math.min(30, Number(result.row.horitzoAnys || 10)));
  const capitalInicial = 10000 + Math.max(0, result.metriques.excedentMensual) * 12;
  const aportacioAnual = Math.max(0, result.metriques.excedentMensual * 12 * 0.4);
  const rendEsperat = result.perfilFinal === "Conservador" ? 0.035 : result.perfilFinal === "Moderat" ? 0.052 : result.perfilFinal === "Dinàmic" ? 0.069 : 0.082;
  const volatilitat = result.perfilFinal === "Conservador" ? 0.055 : result.perfilFinal === "Moderat" ? 0.092 : result.perfilFinal === "Dinàmic" ? 0.135 : 0.18;

  const pessimista = [{ any: 0, valor: capitalInicial }];
  const esperat = [{ any: 0, valor: capitalInicial }];
  const optimista = [{ any: 0, valor: capitalInicial }];

  let p = capitalInicial;
  let e = capitalInicial;
  let o = capitalInicial;

  for (let any = 1; any <= anys; any++) {
    p = p * (1 + rendEsperat - volatilitat * 0.65) + aportacioAnual;
    e = e * (1 + rendEsperat) + aportacioAnual;
    o = o * (1 + rendEsperat + volatilitat * 0.55) + aportacioAnual;
    pessimista.push({ any, valor: Math.round(p) });
    esperat.push({ any, valor: Math.round(e) });
    optimista.push({ any, valor: Math.round(o) });
  }

  const importObjectiu = Number(result.row.importObjectiu || 0);
  const probAssolir = importObjectiu > 0 ? Math.min(95, Math.max(8, Math.round(((e - 0.4 * p) / importObjectiu) * 100))) : 72;
  const valorFinalEsperat = esperat[esperat.length - 1].valor;
  const rang = {
    min: pessimista[pessimista.length - 1].valor,
    max: optimista[optimista.length - 1].valor,
  };

  const trajectoria = esperat.map((row, i) => ({
    any: row.any,
    pessimista: pessimista[i].valor,
    esperat: row.valor,
    optimista: optimista[i].valor,
  }));

  return { trajectoria, probAssolir, valorFinalEsperat, rang, anys };
}

export default function Home() {
  const [client, setClient] = useState<Client>(initialClient);
  const [resultat, setResultat] = useState<ClientResult | null>(null);
  const [error, setError] = useState("");

  const update = (key: keyof Client, value: string) => setClient({ ...client, [key]: value });

  const calcular = () => {
    const required = [
      client.nom,
      client.edat,
      client.ingressosMensualsNets,
      client.despesesFixesMensuals,
      client.despesesVariablesMensuals,
      client.estalviMensual,
      client.estalviLiquid,
      client.horitzoAnys,
      client.perduaMaximaTolerable,
    ];

    if (required.some((x) => String(x).trim() === "")) {
      setError("Falten camps obligatoris per calcular el perfil inversor.");
      return;
    }

    setError("");
    setResultat(calcularClient(client));
  };

  const pieData = resultat
    ? [
        { name: "Renda variable", value: resultat.cartera.rendaVariable },
        { name: "Renda fixa", value: resultat.cartera.rendaFixa },
        { name: "Liquiditat", value: resultat.cartera.liquiditat },
        { name: "Alternatius", value: resultat.cartera.alternatius },
      ]
    : [];

  return (
    <main className="px-3 py-4 sm:px-5 sm:py-6 md:px-7 md:py-8" style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textDark }}>
      <div className="mx-auto w-full max-w-[1380px]">
        <Header />

        <Panel title="1. Test avançat de perfil inversor">
          <div style={{ display: "grid", gap: 24 }}>
            <FormBlock title="Bloc 1. Dades personals i financeres">
              <TextInput label="Nom del client" value={client.nom} onChange={(v) => update("nom", v)} />
              <NumberInput label="Edat" value={client.edat} onChange={(v) => update("edat", v)} />
              <NumberInput label="Ingressos mensuals nets (€)" value={client.ingressosMensualsNets} onChange={(v) => update("ingressosMensualsNets", v)} />
              <NumberInput label="Despeses fixes mensuals (€)" value={client.despesesFixesMensuals} onChange={(v) => update("despesesFixesMensuals", v)} />
              <NumberInput label="Despeses variables mensuals (€)" value={client.despesesVariablesMensuals} onChange={(v) => update("despesesVariablesMensuals", v)} />
              <NumberInput label="Estalvi mensual (€)" value={client.estalviMensual} onChange={(v) => update("estalviMensual", v)} />
              <NumberInput label="Estalvi líquid actual (€)" value={client.estalviLiquid} onChange={(v) => update("estalviLiquid", v)} />
              <NumberInput label="Patrimoni ja invertit (€)" value={client.patrimoniInvertit} onChange={(v) => update("patrimoniInvertit", v)} />
              <NumberInput label="Deute total (€)" value={client.deuteTotal} onChange={(v) => update("deuteTotal", v)} />
              <NumberInput label="Quota mensual de deutes (€)" value={client.quotaMensualDeutes} onChange={(v) => update("quotaMensualDeutes", v)} />
            </FormBlock>

            <FormBlock title="Bloc 2. Objectiu, horitzó i coneixement">
              <SelectInput
                label="Objectiu principal"
                value={client.objectiuPrincipal}
                onChange={(v) => update("objectiuPrincipal", v)}
                options={[
                  ["creixer_patrimoni", "Fer créixer patrimoni"],
                  ["jubilacio", "Jubilació"],
                  ["habitatge", "Comprar habitatge"],
                  ["preservar_capital", "Preservar capital"],
                ]}
              />
              <NumberInput label="Import objectiu (€)" value={client.importObjectiu} onChange={(v) => update("importObjectiu", v)} />
              <NumberInput label="Horitzó temporal en anys" value={client.horitzoAnys} onChange={(v) => update("horitzoAnys", v)} />
              <NumberInput label="% de l’estalvi que vols invertir" value={client.percentatgeEstalviInvertir} onChange={(v) => update("percentatgeEstalviInvertir", v)} />
              <SelectInput
                label="Coneixement financer"
                value={client.coneixementFinancer}
                onChange={(v) => update("coneixementFinancer", v)}
                options={[
                  ["baix", "Baix"],
                  ["basic", "Bàsic"],
                  ["mitja", "Mitjà"],
                  ["alt", "Alt"],
                ]}
              />
              <SelectInput
                label="Experiència inversora"
                value={client.experienciaInversora}
                onChange={(v) => update("experienciaInversora", v)}
                options={[
                  ["mai", "Mai he invertit"],
                  ["conservadors", "Productes conservadors"],
                  ["fons_etfs", "Fons o ETFs"],
                  ["alta_volatilitat", "Renda variable / alta volatilitat"],
                ]}
              />
              <NumberInput label="Anys invertint" value={client.anysInvertint} onChange={(v) => update("anysInvertint", v)} />
            </FormBlock>

            <FormBlock title="Bloc 3. Tolerància psicològica i biaixos">
              <SelectInput
                label="Si una inversió baixa un -10%, què faries?"
                value={client.reaccioCaiguda10}
                onChange={(v) => update("reaccioCaiguda10", v)}
                options={[
                  ["vendre_tot", "Vendria tot"],
                  ["reduir_risc", "Reduiria risc"],
                  ["mantenir", "Mantindria el pla"],
                  ["aportar_mes", "Aportaria més"],
                ]}
              />
              <SelectInput
                label="Si una inversió baixa un -25%, què faries?"
                value={client.reaccioCaiguda25}
                onChange={(v) => update("reaccioCaiguda25", v)}
                options={[
                  ["vendre_tot", "Vendria tot"],
                  ["reduir_risc", "Reduiria risc"],
                  ["mantenir", "Mantindria el pla"],
                  ["aportar_mes", "Aportaria més"],
                ]}
              />
              <NumberInput label="Pèrdua màxima tolerable (%)" value={client.perduaMaximaTolerable} onChange={(v) => update("perduaMaximaTolerable", v)} />
              <SelectInput
                label="Quant temps aguantaries pèrdues?"
                value={client.tempsAguantariaPerdues}
                onChange={(v) => update("tempsAguantariaPerdues", v)}
                options={[
                  ["menys_1_mes", "Menys d’1 mes"],
                  ["1_6_mesos", "1-6 mesos"],
                  ["6_24_mesos", "6-24 mesos"],
                  ["mes_2_anys", "Més de 2 anys"],
                ]}
              />
              <SelectInput
                label="Quan el mercat cau, penses que..."
                value={client.mercatCau}
                onChange={(v) => update("mercatCau", v)}
                options={[
                  ["sortir", "Cal sortir"],
                  ["reduir", "Cal reduir risc"],
                  ["mantenir", "Cal mantenir el pla"],
                  ["oportunitat", "Pot ser una oportunitat"],
                ]}
              />
              <SelectInput
                label="Si una inversió puja molt ràpidament..."
                value={client.inversioPujaRapid}
                onChange={(v) => update("inversioPujaRapid", v)}
                options={[
                  ["comprar_mes", "Compraria més"],
                  ["mantenir", "Mantindria"],
                  ["revisar", "Revisaria"],
                  ["reequilibrar", "Reequilibraria"],
                ]}
              />
              <SelectInput
                label="Freqüència de revisió"
                value={client.frequenciaRevisio}
                onChange={(v) => update("frequenciaRevisio", v)}
                options={[
                  ["diaria", "Diària"],
                  ["setmanal", "Setmanal"],
                  ["mensual", "Mensual"],
                  ["trimestral_anual", "Trimestral o anual"],
                ]}
              />
              <SelectInput
                label="Preferència ESG"
                value={client.preferenciaESG}
                onChange={(v) => update("preferenciaESG", v)}
                options={[
                  ["imprescindible", "Imprescindible"],
                  ["preferible", "Preferible"],
                  ["indiferent", "Indiferent"],
                  ["no", "No"],
                ]}
              />
            </FormBlock>

            <button onClick={calcular} style={buttonStyle}>Calcular perfil inversor</button>
          </div>
        </Panel>

        {error && <Alert text={error} />}

        {resultat && (
          <>
            <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <SummaryCard title="Perfil final" value={resultat.perfilFinal} note={`Score ${resultat.scoreFinal}/100`} color={perfilColor(resultat.perfilFinal)} />
              <SummaryCard title="Capacitat" value={`${resultat.scoreCapacitat}/100`} note="Risc assumible objectiu" color={COLORS.green} />
              <SummaryCard title="Tolerància" value={`${resultat.scoreTolerancia}/100`} note="Reacció davant volatilitat" color={COLORS.gold} />
              <SummaryCard title="Horitzó" value={`${resultat.scoreHoritzo}/100`} note="Temps disponible" color="#315d9c" />
              <SummaryCard title="Coneixement" value={`${resultat.scoreConeixement}/100`} note="Experiència inversora" color={COLORS.danger} />
            </section>

            <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <Panel title="2. Asset allocation proposada">
                <div style={{ height: "clamp(220px, 50vw, 320px)" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={105} innerRadius={55} label>
                        <Cell fill={COLORS.danger} />
                        <Cell fill={COLORS.green} />
                        <Cell fill={COLORS.gold} />
                        <Cell fill="#315d9c" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <SimpleTable
                  headers={["Classe d’actiu", "Pes"]}
                  rows={[
                    ["Renda variable", `${resultat.cartera.rendaVariable}%`],
                    ["Renda fixa", `${resultat.cartera.rendaFixa}%`],
                    ["Liquiditat", `${resultat.cartera.liquiditat}%`],
                    ["Alternatius", `${resultat.cartera.alternatius}%`],
                  ]}
                />
              </Panel>

              <Panel title="3. Diagnòstic del perfil">
                <div style={{ borderLeft: `4px solid ${perfilColor(resultat.perfilFinal)}`, background: "#fafcfb", padding: 16, lineHeight: 1.8 }}>
                  <strong>Justificació del perfil:</strong> El model recomana un perfil {resultat.perfilFinal.toLowerCase()} perquè detecta {resultat.motius.join(", ")}.
                </div>

                {resultat.alertes.length > 0 && (
                  <div style={{ marginTop: 16, borderLeft: `4px solid ${COLORS.danger}`, background: "#fff7f5", padding: 16, color: "#7a2e22", lineHeight: 1.8 }}>
                    <strong>Regles de prudència aplicades:</strong>
                    <ul>{resultat.alertes.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <SimpleTable
                    headers={["Mètrica", "Resultat"]}
                    rows={[
                      ["Ingressos mensuals", formatEuro(resultat.metriques.ingressos)],
                      ["Despeses mensuals totals", formatEuro(resultat.metriques.despesesTotals)],
                      ["Excedent mensual", formatEuro(resultat.metriques.excedentMensual)],
                      ["Taxa d’estalvi", formatPct(resultat.metriques.taxaEstalvi)],
                      ["Ràtio deute/ingressos", formatPct(resultat.metriques.ratioDeuteIngressos)],
                      ["Fons d’emergència", `${resultat.metriques.fonsEmergenciaMesos.toFixed(1)} mesos`],
                    ]}
                  />
                </div>
              </Panel>
            </section>

            <section className="mt-5">
              <Panel title="4. Informe financer personalitzat">
                <Informe result={resultat} />
              </Panel>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Informe({ result }: { result: ClientResult }) {
  const productes = productesPerPerfil(result.perfilFinal);
  const backtest = generarBacktestSimulat(result.perfilFinal);
  const benchmark = benchmarkCompost(result.perfilFinal);
  const blocData = productesPerBloc(productes);
  const riscReturn = riscVsRendibilitat(productes);
  const drawdowns = drawdownSeries(backtest);
  const monteCarlo = simulacioMonteCarlo(result);
  const compClasse = comparacioClasseActiu(result.cartera, benchmark);
  const taulaComparacio = metriquesComparatives(backtest, benchmark);
  const alternatives = PRODUCT_UNIVERSE.filter((p) => p.perfils.includes(result.perfilFinal) && !productes.some((x) => x.id === p.id));

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={serifTitle}>Informe financer personalitzat</h2>
          <p style={paragraph}>
            Proposta per a {result.row.nom || "client"} basada en perfilació avançada, capacitat real de risc, tolerància psicològica i criteris de construcció de cartera.
          </p>
        </div>
        <button onClick={() => window.print()} style={buttonStyle}>Imprimir / PDF</button>
      </div>

      <ExecutiveSummary result={result} />

      <Panel title="Perfil i diagnòstic">
        <MethodologyBox />
      </Panel>

      <Panel title="Cartera recomanada (productes reals)">
        <div>
          <h3 style={sectionTitle}>Productes de cartera (4-8)</h3>
          <SimpleTable
            headers={["Producte", "ISIN", "Categoria", "Pes", "Rol", "Benchmark referència", "Funció"]}
            rows={productes.map((p) => [p.nom, p.isin, `${p.categoria} · ${p.tipus}`, `${p.percentatge}%`, p.rol, p.benchmarkRef, p.justificacio])}
          />
        </div>
      </Panel>

      <Panel title="Benchmark compost">
        <BenchmarkCompostBox benchmark={benchmark} />
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <MiniMetric title="Renda variable" value={`${result.cartera.rendaVariable}%`} />
        <MiniMetric title="Renda fixa" value={`${result.cartera.rendaFixa}%`} />
        <MiniMetric title="Liquiditat" value={`${result.cartera.liquiditat}%`} />
        <MiniMetric title="Alternatius" value={`${result.cartera.alternatius}%`} />
      </div>

      <ProfessionalBox
        title="Lectura de l’asset allocation"
        text={`La cartera ${result.perfilFinal.toLowerCase()} utilitza una estructura nucli-satèl·lit: primer es defineix el risc estratègic (asset allocation) i després es trien instruments concrets per implementar-lo amb control de risc i cost.`}
      />

      <CriteriaGrid />

      <Panel title="Comparació cartera vs benchmark">
        <ComparacioCarteraBenchmark compClasse={compClasse} taulaComparacio={taulaComparacio} />
      </Panel>

      <Panel title="Visualització professional de la cartera">
        <ProfessionalCharts
          blocData={blocData}
          productes={productes}
          backtest={backtest}
          riscReturn={riscReturn}
          drawdowns={drawdowns}
          benchmark={benchmark}
        />
      </Panel>

      <Panel title="Univers complementari">
        <h3 style={sectionTitle}>Univers complementari</h3>
        <ProductGroups alternatives={alternatives} />
      </Panel>

      <Panel title="Simulacions (backtest + Monte Carlo)">
        <BacktestBlock backtest={backtest} />
        <div style={{ height: 12 }} />
        <MonteCarloBlock mc={monteCarlo} />
      </Panel>

      <ProfessionalBox
        title="Decisió de prudència"
        text={
          result.perfilFinal === "Agressiu"
            ? "Tot i que el perfil detectat és agressiu, el model manté un petit percentatge en renda fixa i actius alternatius per evitar una concentració absoluta en renda variable. Aquesta decisió respon a un criteri de prudència i diversificació, ja que fins i tot en perfils d’alt risc és recomanable limitar l’exposició a una única font de rendiment."
            : "La cartera manté una combinació entre actius de creixement i actius estabilitzadors per adaptar-se al perfil de risc detectat, evitant concentracions excessives i buscant coherència entre rendibilitat esperada, volatilitat i horitzó temporal."
        }
      />

      <ProfessionalBox title="Explicació final per al client" text={`Es recomana una cartera ${result.perfilFinal.toLowerCase()} perquè el model detecta ${result.motius.join(", ")}.`} />
      <Panel title="Conclusions finals">
        <FinalConclusion result={result} />
      </Panel>
      <DefenseBox />
      <LegalNotice />
    </div>
  );
}

function MethodologyBox() {
  return (
    <div style={highlightBox}>
      <h3 style={sectionTitle}>Metodologia de construcció de la cartera</h3>
      <p style={paragraph}>
        La cartera proposada es construeix seguint els principis de la Modern Portfolio Theory de Markowitz, segons la qual el risc d’una cartera no depèn només del risc individual de cada actiu, sinó també de la correlació entre ells. Per aquest motiu, el model combina renda variable global, renda fixa, actius immobiliaris cotitzats i liquiditat amb l’objectiu d’obtenir una relació rendibilitat-risc coherent amb el perfil inversor detectat.
      </p>
      <p style={paragraph}>
        El procés diferencia dues decisions: primer, l’asset allocation estratègica, que determina el nivell de risc assumit; i segon, la implementació mitjançant ETFs, escollits per criteris de diversificació, cost, liquiditat, simplicitat i adequació al client.
      </p>
    </div>
  );
}

function SectionBadge({ text }: { text: string }) {
  return (
    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: COLORS.primaryDark, background: COLORS.primaryLight, padding: "4px 10px", borderRadius: 999, marginBottom: 8 }}>
      {text}
    </span>
  );
}

function ExecutiveSummary({
  result,
}: {
  result: ClientResult;
}) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, padding: 18 }}>
      <SectionBadge text="Resum executiu" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MiniMetric title="Perfil final" value={result.perfilFinal} />
        <MiniMetric title="Score total" value={`${result.scoreFinal}/100`} />
        <MiniMetric title="Objectiu" value={String(result.row.objectiuPrincipal || "-")} />
        <MiniMetric title="Horitzó" value={`${result.row.horitzoAnys || "-"} anys`} />
        <MiniMetric title="Asset mix" value={`${result.cartera.rendaVariable}/${result.cartera.rendaFixa}/${result.cartera.liquiditat}/${result.cartera.alternatius}`} />
      </div>
      <div style={{ marginTop: 14, color: COLORS.textMedium, lineHeight: 1.7, fontSize: 14 }}>
        <strong>Recomanació principal:</strong>
        <ul style={{ margin: "8px 0 0 18px" }}>
          <li>La cartera prioritza coherència entre capacitat de risc, horitzó i tolerància psicològica.</li>
          <li>El pes principal recau en actius core diversificats, complementats amb satèl·lits selectius.</li>
          <li>Es manté control de volatilitat mitjançant bloc defensiu i reequilibris periòdics.</li>
        </ul>
      </div>
    </div>
  );
}

function MonteCarloBlock({ mc }: { mc: ReturnType<typeof simulacioMonteCarlo> }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, padding: 18 }}>
      <SectionBadge text="Simulació Monte Carlo" />
      <p style={paragraph}>
        La simulació Monte Carlo permet estimar diferents trajectòries possibles d’una cartera incorporant rendibilitat esperada i volatilitat.
        No prediu el futur, però ajuda a visualitzar el risc i la incertesa.
      </p>
      <div style={{ height: "clamp(220px, 52vw, 320px)" }}>
        <ResponsiveContainer>
          <LineChart data={mc.trajectoria}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="any" />
            <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
            <Tooltip formatter={(v) => formatEuro(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="pessimista" stroke="#b1412c" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="esperat" stroke="#0c2d2a" dot={false} strokeWidth={3} />
            <Line type="monotone" dataKey="optimista" stroke="#1a6b4a" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <SimpleTable
        headers={["Mètrica", "Resultat"]}
        rows={[
          ["Escenari pessimista (final)", formatEuro(mc.rang.min)],
          ["Escenari esperat (final)", formatEuro(mc.valorFinalEsperat)],
          ["Escenari optimista (final)", formatEuro(mc.rang.max)],
          ["Probabilitat estimada d’assolir l’objectiu", `${mc.probAssolir}%`],
          ["Valor final estimat de cartera", formatEuro(mc.valorFinalEsperat)],
          ["Rang de resultats possibles", `${formatEuro(mc.rang.min)} - ${formatEuro(mc.rang.max)}`],
        ]}
      />
    </div>
  );
}

function ProductGroups({ alternatives }: { alternatives: UniverseProduct[] }) {
  const groups: Array<{ title: string; filter: (p: UniverseProduct) => boolean }> = [
    { title: "Alternatives complementàries", filter: (p) => p.rol === "Satellite" || p.rol === "Core" },
    { title: "Productes temàtics d’alt risc", filter: (p) => p.rol === "Thematic/high risk" },
    { title: "Productes de dividends / renda", filter: (p) => p.rol === "Income/dividend" },
    { title: "Productes defensius / liquiditat", filter: (p) => p.rol === "Defensive/liquidity" },
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {groups.map((group) => {
        const list = alternatives.filter(group.filter).slice(0, 5);
        if (!list.length) return null;
        return (
          <div key={group.title}>
            <h4 style={{ margin: "0 0 8px 0", color: COLORS.primaryDark }}>{group.title}</h4>
            <SimpleTable headers={["Producte", "ISIN", "Categoria", "Tipus", "Risc", "Rol"]} rows={list.map((a) => [a.nom, a.isin, a.categoria, a.tipus, <RiskBadge key={`${a.id}-${group.title}`} risc={a.risc} />, a.rol])} />
          </div>
        );
      })}
    </div>
  );
}

function FinalConclusion({ result }: { result: ClientResult }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: "#fafcfb", padding: 18 }}>
      <SectionBadge text="Conclusió final" />
      <ul style={{ margin: 0, paddingLeft: 20, color: COLORS.textMedium, lineHeight: 1.8, fontSize: 14 }}>
        <li>Aquesta cartera encaixa amb el perfil {result.perfilFinal.toLowerCase()} perquè alinea capacitat financera, tolerància i horitzó temporal.</li>
        <li>Riscos principals: volatilitat de renda variable, risc de mercat global, risc temàtic en satèl·lits i possible desviació respecte objectiu.</li>
        <li>Revisió recomanada: com a mínim trimestral i sempre que hi hagi canvis personals rellevants (ingressos, objectiu o horitzó).</li>
        <li>No és assessorament financer real: és una proposta acadèmica i educativa basada en supòsits simplificats.</li>
      </ul>
    </div>
  );
}

function BenchmarkCompostBox({ benchmark }: { benchmark: ReturnType<typeof benchmarkCompost> }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, padding: 18 }}>
      <h3 style={sectionTitle}>Benchmark compost acadèmic</h3>
      <p style={paragraph}>
        El benchmark no és un únic índex; és una combinació ponderada d’índexs representatius segons perfil. Això evita comparar una cartera conservadora amb un índex 100% accions i millora la consistència metodològica en la defensa acadèmica.
      </p>
      <SimpleTable
        headers={["Component de benchmark", "Pes", "Rendibilitat esperada", "Volatilitat estimada"]}
        rows={benchmark.composicio.map((c) => [c.component, `${c.pes}%`, formatPct(c.r), formatPct(c.v)])}
      />
      <div style={{ height: "clamp(220px, 46vw, 280px)", marginTop: 10 }}>
        <ResponsiveContainer>
          <BarChart data={benchmark.composicio}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="component" hide />
            <YAxis />
            <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="pes" name="Pes benchmark" fill={COLORS.gold} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 10, color: COLORS.textMedium, fontSize: 13 }}>
        <strong>Resultat compost:</strong> Rendibilitat esperada {formatPct(benchmark.rendibilitat)} · Volatilitat estimada {formatPct(benchmark.volatilitat)}.
      </div>
    </div>
  );
}

function ComparacioCarteraBenchmark({
  compClasse,
  taulaComparacio,
}: {
  compClasse: Array<{ classe: string; cartera: number; benchmark: number }>;
  taulaComparacio: string[][];
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={paragraph}>
        La comparació es fa contra un benchmark compost coherent amb el perfil, no contra un únic índex. Això permet avaluar millor si el risc i la rendibilitat esperada de la cartera són consistents.
      </p>
      <div style={{ height: "clamp(220px, 48vw, 290px)" }}>
        <ResponsiveContainer>
          <BarChart data={compClasse}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="classe" />
            <YAxis />
            <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="cartera" fill={COLORS.primaryDark} name="Cartera" />
            <Bar dataKey="benchmark" fill={COLORS.gold} name="Benchmark" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SimpleTable headers={["Mètrica", "Cartera", "Benchmark compost"]} rows={taulaComparacio} />
    </div>
  );
}

function ProfessionalCharts({
  blocData,
  productes,
  backtest,
  riscReturn,
  drawdowns,
  benchmark,
}: {
  blocData: Array<{ bloc: string; pes: number }>;
  productes: ProducteCartera[];
  backtest: ReturnType<typeof generarBacktestSimulat>;
  riscReturn: Array<{ nom: string; risc: number; rendiment: number; pes: number; serie: string }>;
  drawdowns: Array<{ any: string; carteraDD: number; benchmarkDD: number }>;
  benchmark: ReturnType<typeof benchmarkCompost>;
}) {
  const comparacio = [
    { serie: "Cartera", rendibilitat: backtest.metrics.rendibilitatAnualitzada, volatilitat: backtest.metrics.volatilitat, drawdown: backtest.metrics.maxDrawdown },
    { serie: "Benchmark compost", rendibilitat: benchmark.rendibilitat, volatilitat: benchmark.volatilitat, drawdown: backtest.benchmarkMetrics.maxDrawdown },
  ];
  const benchmarkPoint = [{ nom: "Benchmark compost", risc: benchmark.volatilitat, rendiment: benchmark.rendibilitat, pes: 30, serie: "Benchmark" }];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
          <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Pes per producte</h4>
          <div style={{ height: "clamp(220px, 48vw, 280px)" }}>
            <ResponsiveContainer>
              <BarChart data={productes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tickerOrientatiu" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentatge" fill={COLORS.primaryDark} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
          <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Asset allocation (per bloc d’actiu)</h4>
          <div style={{ height: "clamp(220px, 48vw, 280px)" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={blocData} dataKey="pes" nameKey="bloc" innerRadius={45} outerRadius={90} label />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
          <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Comparació cartera vs benchmark</h4>
          <div style={{ height: "clamp(220px, 48vw, 280px)" }}>
            <ResponsiveContainer>
              <BarChart data={comparacio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="serie" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rendibilitat" fill={COLORS.green} name="Rendibilitat" />
                <Bar dataKey="volatilitat" fill={COLORS.gold} name="Volatilitat" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
          <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Risc vs rendibilitat (productes)</h4>
          <div style={{ height: "clamp(220px, 48vw, 280px)" }}>
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="risc" name="Risc" unit="%" />
                <YAxis dataKey="rendiment" name="Rendiment" unit="%" />
                <ZAxis dataKey="pes" range={[60, 420]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend />
                <Scatter name="Actius cartera" data={riscReturn} fill={COLORS.primaryDark} />
                <Scatter name="Benchmark compost" data={benchmarkPoint} fill={COLORS.gold} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
        <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Rendiment històric simulat (cartera vs benchmark)</h4>
        <div style={{ height: "clamp(230px, 50vw, 310px)" }}>
          <ResponsiveContainer>
            <LineChart data={backtest.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="any" />
              <YAxis />
              <Tooltip formatter={(value) => formatEuro(Number(value))} />
              <Legend />
              <Line dataKey="cartera" stroke={COLORS.primaryDark} strokeWidth={3} dot={false} />
              <Line dataKey="benchmark" stroke={COLORS.gold} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
        <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Drawdown (caiguda des de màxim)</h4>
        <div style={{ height: "clamp(220px, 48vw, 280px)" }}>
          <ResponsiveContainer>
            <AreaChart data={drawdowns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="any" />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <Legend />
              <Area type="monotone" dataKey="carteraDD" stroke={COLORS.primaryDark} fill="#d6e7e1" />
              <Area type="monotone" dataKey="benchmarkDD" stroke={COLORS.gold} fill="#f2e9da" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function CriteriaGrid() {
  const criteris = [
    ["Diversificació", "Exposició a diferents geografies, sectors, capitalitzacions i classes d’actiu."],
    ["Cost", "Preferència per ETFs amb TER reduït per minimitzar l’erosió de rendibilitat a llarg termini."],
    ["Liquiditat", "Ús d’instruments negociats en mercats regulats i amb capacitat d’entrada i sortida."],
    ["Risc", "Pesos ajustats al perfil inversor, horitzó temporal i tolerància psicològica."],
    ["Divisa", "Renda fixa coberta a EUR per reduir risc de canvi en el bloc estabilitzador."],
    ["Simplicitat", "Cartera comprensible, replicable i fàcil de reequilibrar periòdicament."],
  ];

  return (
    <div>
      <h3 style={sectionTitle}>Criteris de selecció dels ETFs</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {criteris.map(([title, text]) => (
          <div key={title} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, padding: 16 }}>
            <div style={{ color: COLORS.primaryDark, fontWeight: 800, marginBottom: 8 }}>{title}</div>
            <div style={{ color: COLORS.textMedium, fontSize: 13, lineHeight: 1.7 }}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BacktestBlock({ backtest }: { backtest: ReturnType<typeof generarBacktestSimulat> }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, padding: 18, background: COLORS.white }}>
      <h3 style={sectionTitle}>Simulació històrica orientativa vs benchmark compost</h3>
      <p style={paragraph}>
        La simulació no utilitza dades reals de mercat descarregades automàticament, sinó una aproximació acadèmica basada en paràmetres esperats de rendibilitat, volatilitat i drawdown per perfil. Serveix per il·lustrar el comportament esperat de la cartera, però no constitueix una predicció ni una recomanació d’inversió real.
      </p>

      <div style={{ height: "clamp(230px, 55vw, 340px)" }}>
        <ResponsiveContainer>
          <LineChart data={backtest.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="any" />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatEuro(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="cartera" name="Cartera recomanada" stroke="#0c2d2a" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="benchmark" name="Benchmark compost" stroke="#b39b72" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SimpleTable
        headers={["Mètrica", "Cartera recomanada", "Benchmark compost"]}
        rows={[
          ["Rendibilitat anualitzada", formatPct(backtest.metrics.rendibilitatAnualitzada), formatPct(backtest.benchmarkMetrics.rendibilitatAnualitzada)],
          ["Volatilitat estimada", formatPct(backtest.metrics.volatilitat), formatPct(backtest.benchmarkMetrics.volatilitat)],
          ["Drawdown màxim", formatPct(backtest.metrics.maxDrawdown), formatPct(backtest.benchmarkMetrics.maxDrawdown)],
          ["Sharpe aproximat", backtest.metrics.sharpe.toFixed(2), backtest.benchmarkMetrics.sharpe.toFixed(2)],
        ]}
      />
    </div>
  );
}

function DefenseBox() {
  return (
    <div style={{ background: COLORS.primaryDark, color: "white", padding: 20 }}>
      <h3 style={{ margin: "0 0 12px 0", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 22 }}>Resposta defensiva davant tribunal</h3>
      <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>
        La cartera no respon a una selecció subjectiva, sinó a un procés estructurat basat en perfil de risc, horitzó temporal, capacitat financera i criteris de diversificació. Els ETFs permeten reduir risc específic, controlar costos i implementar una cartera global de manera eficient. La proposta és acadèmica i no constitueix assessorament financer regulat ni execució d’ordres.
      </p>
    </div>
  );
}

function LegalNotice() {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: "#fff8e8", padding: 14, color: COLORS.textMedium, fontSize: 13, lineHeight: 1.7 }}>
      <strong>Avís legal i educatiu:</strong> Aquesta proposta té finalitat acadèmica i educativa. No constitueix assessorament financer personalitzat regulat ni recomanació d’inversió real.
    </div>
  );
}

function Header() {
  return (
    <section className="mb-4 sm:mb-6 md:mb-7" style={{ background: COLORS.white, boxShadow: "0 5px 40px rgba(0,0,0,0.08)", border: `1px solid ${COLORS.border}` }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primaryDark}, ${COLORS.gold})` }} />
      <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-10 md:py-9">
        <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 24, letterSpacing: 2, color: COLORS.primaryDark, textTransform: "uppercase", marginBottom: 28 }} className="text-base sm:text-lg md:text-2xl">
          <strong>FACTOR</strong> OTC
        </div>
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 34, fontWeight: 500, color: COLORS.primaryDark, margin: 0 }} className="text-2xl sm:text-3xl md:text-[34px]">
          ROBOADVISOR FINANCER INTEL·LIGENT
        </h1>
        <p style={{ marginTop: 18, marginBottom: 0, maxWidth: 980, color: COLORS.textMedium, fontSize: 14, lineHeight: 1.8 }} className="text-sm leading-7">
          Sistema acadèmic de perfilació inversora, scoring, suitability i proposta de cartera model basada en asset allocation, diversificació i criteris de selecció d’ETFs.
        </p>
      </div>
    </section>
  );
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-3 sm:p-4 md:p-[18px]" style={{ border: `1px solid ${COLORS.border}`, background: "#fafcfb" }}>
      <h3 style={{ margin: "0 0 16px 0", color: COLORS.primaryDark, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 20 }}>{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </Field>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input type="number" min="0" value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </Field>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <Field label={label}>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, color: COLORS.textMedium, fontWeight: 600 }}>
      {label}
      {children}
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="p-3 sm:p-4 md:p-5 lg:p-[22px]" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, boxShadow: "0 5px 30px rgba(0,0,0,0.05)" }}>
      <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
        <h2 style={{ margin: 0, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 18, fontWeight: 500, color: COLORS.primaryDark }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ title, value, note, color }: { title: string; value: string; note: string; color: string }) {
  return (
    <div className="p-4 sm:p-5" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: color }} />
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textLight, marginBottom: 8, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 26, lineHeight: 1.1, fontWeight: 400, color: COLORS.primaryDark, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, color: COLORS.textLight }}>{note}</div>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, padding: 16, background: COLORS.white }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.textLight, letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 22, color: COLORS.primaryDark, fontFamily: 'Georgia, "Times New Roman", serif' }}>{value}</div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-md" style={{ WebkitOverflowScrolling: "touch" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
        <thead style={{ background: COLORS.primaryLight }}>
          <tr>{headers.map((h) => <Th key={h}>{h}</Th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <Td key={`${i}-${j}`}>{cell}</Td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.primaryDark, borderBottom: `1px solid ${COLORS.border}` }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMedium, fontSize: 12.5, lineHeight: 1.55, verticalAlign: "top" }}>
      {children}
    </td>
  );
}

function RiskBadge({ risc }: { risc: string }) {
  const colors =
    risc === "Baix"
      ? { bg: "#e8f6ee", fg: "#1a6b4a" }
      : risc === "Mitjà"
      ? { bg: "#f8f0df", fg: "#9a6e22" }
      : risc === "Alt"
      ? { bg: "#fdeee8", fg: "#b1412c" }
      : { bg: "#f9e8ee", fg: "#7a2950" };
  return (
    <span style={{ background: colors.bg, color: colors.fg, fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 999 }}>
      {risc}
    </span>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 16, background: "#fdf3f1", borderLeft: `4px solid ${COLORS.danger}`, padding: "14px 16px", color: "#7a2e22", fontSize: 14 }}>
      <strong>Incidència:</strong> {text}
    </div>
  );
}

function perfilColor(perfil: Perfil) {
  if (perfil === "Conservador") return COLORS.green;
  if (perfil === "Moderat") return COLORS.gold;
  if (perfil === "Dinàmic") return "#315d9c";
  return COLORS.danger;
}

function ProfessionalBox({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ background: "#fafcfb", borderLeft: `4px solid ${COLORS.gold}`, padding: 16, color: COLORS.textMedium, lineHeight: 1.8 }}>
      <strong style={{ color: COLORS.primaryDark }}>{title}:</strong> {text}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${COLORS.border}`,
  background: COLORS.white,
  color: COLORS.textDark,
  fontSize: 16,
  minHeight: 46,
  borderRadius: 8,
};

const buttonStyle = {
  background: COLORS.primaryDark,
  color: "white",
  border: "none",
  padding: "13px 18px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  borderRadius: 8,
  minHeight: 46,
};

const serifTitle = {
  margin: 0,
  color: COLORS.primaryDark,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 28,
};

const sectionTitle = {
  margin: "0 0 12px 0",
  color: COLORS.primaryDark,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 22,
};

const paragraph = {
  color: COLORS.textMedium,
  lineHeight: 1.8,
  fontSize: 14,
};

const highlightBox = {
  border: `1px solid ${COLORS.border}`,
  background: COLORS.primaryLight,
  padding: 18,
};
