"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { PRODUCT_UNIVERSE, carteraPerPerfil, productesPerPerfil, type CarteraModel, type ProducteCartera, type UniverseProduct } from "@/lib/portfolio";

type ClientResult = ScoringResult & {
  cartera: CarteraModel;
};

type BacktestApi = {
  updatedAt: string;
  dataSource: string;
  dataStatus: "validated" | "partial" | "pending";
  realDataSufficient: boolean;
  warnings: string[];
  missingApiKeys: string[];
  benchmark: { composicio: Array<{ component: string; ticker: string; pes: number; rationale: string }> };
  data: Array<{ date: string; cartera: number; benchmark: number; carteraDD: number; benchmarkDD: number }>;
  metrics: { rendibilitatAnualitzada: number; volatilitat: number; maxDrawdown: number; sharpe: number; rendimentAcumulat: number };
  benchmarkMetrics: { rendibilitatAnualitzada: number; volatilitat: number; maxDrawdown: number; sharpe: number; rendimentAcumulat: number };
  riskReturn: Array<{ nom: string; risc: number; rendiment: number; pes: number; serie: string }>;
  correlations: Array<{ x: string; y: string; value: number }>;
  riskContribution: Array<{ nom: string; contribucio: number }>;
  availability: { ambDades: string[]; pendents: string[]; limitacions: string };
};

type PortfolioMetricsApi = {
  monteCarlo: {
    trajectoria: Array<{ any: number; pessimista: number; esperat: number; optimista: number }>;
    percentils: { p10: number; p50: number; p90: number };
    params: { rendibilitatAnual: number; volatilitatAnual: number };
  } | null;
  dataStatus?: string;
  note?: string;
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

  const shocks = [-0.03, 0.05, 0.01, -0.07, 0.09, 0.03, -0.16, 0.14, -0.17, 0.08, 0.07];
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

function notesPerfil(perfil: Perfil) {
  if (perfil === "Conservador") {
    return [
      "Renda variable baixa per prioritzar preservació de capital.",
      "Pes dominant en renda fixa curta i global coberta a EUR.",
      "Sense productes temàtics d’alt risc.",
      "Risc principal: pèrdua de poder adquisitiu si la inflació supera el retorn.",
    ];
  }
  if (perfil === "Moderat") {
    return [
      "Equilibri entre creixement (renda variable) i estabilització (renda fixa).",
      "Emergents amb pes limitat per no disparar volatilitat.",
      "Satèl·lits de dividends/REITs amb funció diversificadora.",
      "Risc principal: drawdowns moderats en cicles adversos.",
    ];
  }
  if (perfil === "Dinàmic") {
    return [
      "Major pes en renda variable global, small caps i emergents.",
      "Tecnologia present però amb control de pes.",
      "Renda fixa reduïda com a amortidor parcial.",
      "Risc principal: volatilitat rellevant en mercats baixistes.",
    ];
  }
  return [
    "Predomini de renda variable i satèl·lits d’alt creixement.",
    "Exposició a IA/tecnologia/sectorials amb alta volatilitat.",
    "Renda fixa i liquiditat mínimes.",
    "Risc principal: caigudes temporals intenses i elevada dispersió de resultats.",
  ];
}

function analisiCostos(productes: ProducteCartera[]) {
  const files = productes.map((p) => {
    const ter = p.terAnual ?? null;
    const costPonderat = ter !== null ? (p.percentatge / 100) * ter : null;
    return {
      ...p,
      ter,
      costPonderat,
    };
  });
  const costTotal = files.reduce((acc, f) => acc + (f.costPonderat ?? 0), 0);
  const costActivaRef = 1.15;
  const costIndexadaRef = 0.22;
  return { files, costTotal, costActivaRef, costIndexadaRef };
}

function estatDadesMercat() {
  return {
    font: "Simulades/estimades (mode acadèmic)",
    actualitzacio: "Manual (preparat per integració diària via API/CSV)",
    nota:
      "Les mètriques de rendibilitat, volatilitat, drawdown i Monte Carlo depenen de les dades de mercat utilitzades. En aquesta versió acadèmica, poden basar-se en estimacions o dades històriques importades. Per a ús professional, caldria connectar fonts de dades financeres actualitzades diàriament.",
  };
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");
  const [backtestData, setBacktestData] = useState<BacktestApi | null>(null);
  const [metricsData, setMetricsData] = useState<PortfolioMetricsApi | null>(null);

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

    const edat = Number(client.edat);
    const horitzo = Number(client.horitzoAnys);
    const ingressos = Number(client.ingressosMensualsNets);
    const despeses = Number(client.despesesFixesMensuals) + Number(client.despesesVariablesMensuals);
    const objectiu = Number(client.importObjectiu || 0);
    const pctInvertir = Number(client.percentatgeEstalviInvertir || 0);
    if (!Number.isFinite(edat) || edat < 18 || edat > 100) {
      setError("Edat incoherent. Introdueix una edat entre 18 i 100 anys.");
      return;
    }
    if (!Number.isFinite(horitzo) || horitzo <= 0) {
      setError("L’horitzó temporal ha de ser superior a 0 anys.");
      return;
    }
    if (!Number.isFinite(ingressos) || ingressos <= 0 || despeses < 0 || despeses > ingressos * 1.5) {
      setError("Ingressos/despeses incoherents. Revisa els imports mensuals.");
      return;
    }
    if (client.importObjectiu && (!Number.isFinite(objectiu) || objectiu <= 0)) {
      setError("L’import objectiu ha de ser superior a 0 €.");
      return;
    }
    if (pctInvertir > 100) {
      setError("El percentatge d’estalvi a invertir no pot superar el 100%.");
      return;
    }

    setError("");
    setResultat(calcularClient(client));
  };

  useEffect(() => {
    if (!resultat) return;
    const fetchMarket = async () => {
      setMarketLoading(true);
      setMarketError("");
      try {
        const backtestRes = await fetch(`/api/backtest?perfil=${encodeURIComponent(resultat.perfilFinal)}`);
        const backtestJson = await backtestRes.json();
        if (!backtestRes.ok || backtestJson.status !== "ok") throw new Error(backtestJson.message || "Error de backtest");
        setBacktestData(backtestJson);

        const annualContribution = Math.max(0, resultat.metriques.excedentMensual * 12 * 0.4);
        const metricsRes = await fetch(
          `/api/portfolio-metrics?perfil=${encodeURIComponent(resultat.perfilFinal)}&horizon=${encodeURIComponent(resultat.row.horitzoAnys || "10")}&annualContribution=${annualContribution}`,
        );
        const metricsJson = await metricsRes.json();
        if (!metricsRes.ok || metricsJson.status !== "ok") throw new Error(metricsJson.message || "Error de mètriques");
        setMetricsData(metricsJson);
      } catch (e) {
        setMarketError(e instanceof Error ? e.message : "No s'han pogut actualitzar les dades de mercat.");
      } finally {
        setMarketLoading(false);
      }
    };
    fetchMarket();
  }, [resultat]);

  const pieData = resultat
    ? [
        { name: "Renda variable", value: resultat.cartera.rendaVariable },
        { name: "Renda fixa", value: resultat.cartera.rendaFixa },
        { name: "Liquiditat", value: resultat.cartera.liquiditat },
        { name: "Alternatius", value: resultat.cartera.alternatius },
      ]
    : [];

  const handleGeneratePdf = async () => {
    if (!resultat) return;
    const pdfRoot = document.getElementById("pdf-report");
    if (!pdfRoot) return;
    setGeneratingPdf(true);
    try {
      const safeName = (resultat.row.nom || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const printableHtml = `
        <html>
          <head>
            <title>informe-roboadvisor-${safeName || "client"}.pdf</title>
            <meta charset="utf-8" />
            <style>
              @page { size: A4; margin: 16mm; }
              body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border-bottom: 1px solid #e0e6e5; padding: 8px 10px; font-size: 12px; text-align: left; vertical-align: top; }
              th { background: #eef6f4; text-transform: uppercase; font-size: 10px; }
            </style>
          </head>
          <body>${pdfRoot.innerHTML}</body>
        </html>
      `;
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      iframe.srcdoc = printableHtml;
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 800);
      };
    } finally {
      setGeneratingPdf(false);
    }
  };

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
                {marketLoading && <Alert text="Actualitzant dades de mercat..." />}
                {marketError && <Alert text={`Error de dades de mercat: ${marketError}`} />}
                <Informe result={resultat} onGeneratePdf={handleGeneratePdf} generatingPdf={generatingPdf} backtestData={backtestData} metricsData={metricsData} />
              </Panel>
            </section>
          </>
        )}
      </div>

      {resultat && (
        <div style={{ position: "fixed", left: -10000, top: 0, width: 1100, background: "#fff", padding: 24, zIndex: -1 }} aria-hidden="true">
          <div id="pdf-report">
            <PdfReportDocument result={resultat} backtestData={backtestData} metricsData={metricsData} />
          </div>
        </div>
      )}
    </main>
  );
}

function Informe({
  result,
  onGeneratePdf,
  generatingPdf,
  backtestData,
  metricsData,
}: {
  result: ClientResult;
  onGeneratePdf: () => void;
  generatingPdf: boolean;
  backtestData: BacktestApi | null;
  metricsData: PortfolioMetricsApi | null;
}) {
  const productes = productesPerPerfil(result.perfilFinal);
  const hasRealData = Boolean(backtestData?.realDataSufficient);
  const backtest = hasRealData && backtestData
    ? {
        data: backtestData.data.map((d, idx) => ({ any: idx === 0 ? "Inici" : d.date, cartera: d.cartera, benchmark: d.benchmark })),
        metrics: backtestData.metrics,
        benchmarkMetrics: backtestData.benchmarkMetrics,
      }
    : { data: [], metrics: { rendibilitatAnualitzada: 0, volatilitat: 0, maxDrawdown: 0, sharpe: 0 }, benchmarkMetrics: { rendibilitatAnualitzada: 0, volatilitat: 0, maxDrawdown: 0, sharpe: 0 } };
  const benchmark = backtestData
    ? {
        composicio: backtestData.benchmark.composicio.map((c) => ({ component: c.component, pes: c.pes, r: 0, v: 0 })),
        rendibilitat: backtestData.benchmarkMetrics.rendibilitatAnualitzada,
        volatilitat: backtestData.benchmarkMetrics.volatilitat,
      }
    : { composicio: [], rendibilitat: 0, volatilitat: 0 };
  const blocData = productesPerBloc(productes);
  const riscReturn = backtestData?.riskReturn ?? [];
  const drawdowns = backtestData
    ? backtestData.data.map((d, idx) => ({ any: idx === 0 ? "Inici" : d.date, carteraDD: d.carteraDD, benchmarkDD: d.benchmarkDD }))
    : [];
  const monteCarlo = metricsData?.monteCarlo
    ? {
        trajectoria: metricsData.monteCarlo!.trajectoria,
        probAssolir:
          Number(result.row.importObjectiu || 0) > 0
            ? Math.round(
                Math.max(
                  0,
                  Math.min(100, (metricsData.monteCarlo!.percentils.p50 / Number(result.row.importObjectiu || 1)) * 100),
                ),
              )
            : 0,
        valorFinalEsperat: metricsData.monteCarlo!.percentils.p50,
        rang: { min: metricsData.monteCarlo!.percentils.p10, max: metricsData.monteCarlo!.percentils.p90 },
        anys: metricsData.monteCarlo!.trajectoria.length - 1,
      }
    : null;
  const compClasse = benchmark.composicio.length ? comparacioClasseActiu(result.cartera, benchmark) : [];
  const taulaComparacio = hasRealData ? metriquesComparatives(backtest, benchmark) : [["Estat de dades", "Dades pendents de connexió", "No disponible"]];
  const bulletsPerfil = notesPerfil(result.perfilFinal);
  const costos = analisiCostos(productes);
  const dades = backtestData
    ? {
        font: backtestData.dataSource,
        actualitzacio: new Date(backtestData.updatedAt).toLocaleString("ca-ES"),
        nota: `${backtestData.availability.limitacions} Rendiments passats no garanteixen rendiments futurs.`,
      }
    : { font: "Dades pendents de connexió", actualitzacio: "-", nota: "Encara no hi ha prou dades reals per generar mètriques robustes." };
  const alternatives = PRODUCT_UNIVERSE.filter((p) => p.perfils.includes(result.perfilFinal) && !productes.some((x) => x.id === p.id));
  const benchmarkProducts = backtestData?.benchmark.composicio ?? [];
  const informatiusPendents = productes.filter((p) => !p.dataAvailable || p.dataStatus !== "validated");
  const descartats = PRODUCT_UNIVERSE.filter((p) => p.perfils.includes(result.perfilFinal) && p.dataStatus === "unavailable");
  const coveragePct = productes.length ? ((productes.filter((p) => p.dataStatus === "validated").length / productes.length) * 100).toFixed(1) : "0.0";
  const gapVsBenchmark =
    hasRealData && backtestData ? backtestData.metrics.rendibilitatAnualitzada - backtestData.benchmarkMetrics.rendibilitatAnualitzada : null;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={serifTitle}>Informe financer personalitzat</h2>
          <p style={paragraph}>
            Proposta per a {result.row.nom || "client"} basada en perfilació avançada, capacitat real de risc, tolerància psicològica i criteris de construcció de cartera.
          </p>
        </div>
        <button onClick={onGeneratePdf} style={buttonStyle} disabled={generatingPdf}>
          {generatingPdf ? "Generant PDF..." : "Generar informe PDF"}
        </button>
      </div>

      <ExecutiveSummary result={result} costTotal={costos.costTotal} />

      <Panel title="Perfil i diagnòstic">
        <MethodologyBox />
      </Panel>

      <Panel title="Cartera recomanada (productes reals)">
        <div>
          <h3 style={sectionTitle}>Productes de cartera (4-8)</h3>
          <p style={{ ...paragraph, marginTop: 0 }}>La cartera principal prioritza fons d’inversió; els ETFs es mantenen com a referència de benchmark o com a alternativa líquida quan escau.</p>
          <SimpleTable
            headers={["Classe d’actiu", "Producte", "Gestora", "ISIN", "Ticker", "Tipus", "Gestió", "Pes", "TER", "Cost ponderat", "Estat dades", "Rol", "Benchmark referència", "Funció"]}
            rows={costos.files.map((p) => [
              p.blocActiu,
              p.nom,
              p.gestora || "-",
              p.isin,
              p.tickerYahoo || p.tickerFMP || "pendent",
              p.tipus,
              p.gestio,
              `${p.percentatge}%`,
              p.ter !== null ? `${p.ter.toFixed(2)}%` : "TER estimat pendent de validació",
              p.costPonderat !== null ? `${p.costPonderat.toFixed(3)}%` : "-",
              <DataStatusBadge key={`${p.id}-status`} status={p.dataStatus} />,
              p.rol,
              p.benchmarkRef,
              p.dataAvailable ? p.justificacio : `${p.justificacio} (només informatiu, pendent de validació de dades)`,
            ])}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: "0 0 8px 0", color: COLORS.primaryDark }}>Per què aquesta cartera és diferent per al teu perfil?</h4>
          <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.textMedium, lineHeight: 1.75 }}>
            {bulletsPerfil.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div style={{ marginTop: 12 }}>
          <MiniMetric title="Cost total estimat de la cartera" value={`${costos.costTotal.toFixed(3)}% anual`} />
        </div>
      </Panel>

      <Panel title="Costos estimats de la cartera">
        <SimpleTable
          headers={["Producte", "ISIN", "Ticker", "Pes", "TER anual", "Cost ponderat", "Estat", "Gestió", "Comentari"]}
          rows={costos.files.map((p) => [
            p.nom,
            p.isin,
            p.tickerYahoo || p.tickerFMP || "pendent",
            `${p.percentatge}%`,
            p.ter !== null ? `${p.ter.toFixed(2)}%` : "TER estimat pendent de validació",
            p.costPonderat !== null ? `${p.costPonderat.toFixed(3)}%` : "-",
            <DataStatusBadge key={`${p.id}-cost-status`} status={p.dataStatus} />,
            p.gestio,
            "El cost ponderat es calcula com pes × TER anual.",
          ])}
        />
        <div style={{ marginTop: 10, color: COLORS.textMedium, fontSize: 13, lineHeight: 1.7 }}>
          <strong>Cost total ponderat:</strong> {costos.costTotal.toFixed(3)}% anual ·
          <strong> Referència cartera activa:</strong> ~{costos.costActivaRef.toFixed(2)}% ·
          <strong> Referència cartera indexada:</strong> ~{costos.costIndexadaRef.toFixed(2)}%.
          <br />
          El cost total de la cartera és important perquè redueix la rendibilitat neta esperada a llarg termini.
        </div>
      </Panel>

      <Panel title="Governança d’univers de productes">
        <SimpleTable
          headers={["Bloc", "Detall"]}
          rows={[
            ["Productes recomanats per cartera", productes.map((p) => p.nom).join(", ") || "-"],
            ["Productes utilitzats al benchmark", benchmarkProducts.map((b) => `${b.component} (${b.ticker})`).join(", ") || "pendent"],
            ["Productes informatius pendents de validació", informatiusPendents.map((p) => p.nom).join(", ") || "Cap"],
            ["Productes descartats per manca de dades", descartats.map((p) => p.nom).join(", ") || "Cap"],
          ]}
        />
      </Panel>

      <Panel title="Benchmark compost">
        <BenchmarkCompositionPanel benchmark={benchmark} />
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
        {gapVsBenchmark !== null && gapVsBenchmark < 0 && (
          <p style={{ ...paragraph, marginTop: 10 }}>
            La cartera mostra una rendibilitat anualitzada inferior al benchmark en aquest període. Això no implica fracàs: el perfil pot prioritzar menor volatilitat/drawdown, prudència de construcció o cobertura limitada de dades validades.
          </p>
        )}
      </Panel>

      <Panel title="Visualització professional de la cartera">
        {hasRealData ? (
          <ProfessionalCharts
            blocData={blocData}
            productes={productes}
            backtest={backtest}
            riscReturn={riscReturn}
            drawdowns={drawdowns}
            benchmark={benchmark}
            correlations={backtestData?.correlations ?? []}
            riskContribution={backtestData?.riskContribution ?? []}
          />
        ) : (
          <div style={highlightBox}>Dades pendents de connexió. Els gràfics quantitatius (backtest, drawdown, correlacions) es mostraran quan hi hagi historial real suficient.</div>
        )}
      </Panel>

      <Panel title="Univers complementari">
        <h3 style={sectionTitle}>Univers complementari</h3>
        <ProductGroups alternatives={alternatives} />
      </Panel>

      <Panel title="Simulacions (backtest + Monte Carlo)">
        {hasRealData ? (
          <>
            <BacktestBlock backtest={backtest} />
            <div style={{ height: 12 }} />
            {monteCarlo ? <MonteCarloBlock mc={monteCarlo} /> : <div style={highlightBox}>Monte Carlo pendent: no hi ha suficient historial per estimar distribucions robustes.</div>}
          </>
        ) : (
          <div style={highlightBox}>Backtest/Drawdown/Monte Carlo no disponibles: dades reals pendents de connexió.</div>
        )}
      </Panel>

      <Panel title="Fiabilitat de dades i actualització">
        <div style={{ ...paragraph, margin: 0 }}>
          <strong>Font actual:</strong> {dades.font}.<br />
          <strong>Actualització:</strong> {dades.actualitzacio}.<br />
          {dades.nota}
          {backtestData && (
            <>
              <br />
              <strong>Productes amb dades disponibles:</strong> {backtestData.availability.ambDades.join(", ") || "Cap"}.
              <br />
              <strong>Productes pendents de validació:</strong> {backtestData.availability.pendents.join(", ") || "Cap"}.
              <br />
              <strong>Cobertura de dades (cartera):</strong> {coveragePct}%.
              <br />
              <strong>Estat claus API:</strong> {backtestData.missingApiKeys.length > 0 ? `Pendents (${backtestData.missingApiKeys.join(", ")})` : "Configurades o no requerides"}.
              <br />
              <strong>Llegenda d’origen:</strong> Real · Estimada · Simulada · Pendent de dades · No disponible.
              <br />
              {backtestData.missingApiKeys.length > 0 && (
                <>
                  <strong>Claus API pendents:</strong> {backtestData.missingApiKeys.join(", ")}. Sense aquestes claus, la cobertura de dades pot ser parcial.
                  <br />
                </>
              )}
              <strong>Avís:</strong> eina de suport a la decisió i simulació educativa/professional; no constitueix recomanació d’inversió personalitzada regulada.
            </>
          )}
        </div>
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

function PdfReportDocument({ result, backtestData, metricsData }: { result: ClientResult; backtestData: BacktestApi | null; metricsData: PortfolioMetricsApi | null }) {
  const productes = productesPerPerfil(result.perfilFinal);
  const hasRealData = Boolean(backtestData?.realDataSufficient);
  const benchmark = backtestData
    ? {
        composicio: backtestData.benchmark.composicio.map((c) => ({ component: c.component, pes: c.pes, r: 0, v: 0 })),
        rendibilitat: backtestData.benchmarkMetrics.rendibilitatAnualitzada,
        volatilitat: backtestData.benchmarkMetrics.volatilitat,
      }
    : { composicio: [], rendibilitat: 0, volatilitat: 0 };
  const backtest = hasRealData && backtestData
    ? {
        data: backtestData.data.map((d, idx) => ({ any: idx === 0 ? "Inici" : d.date, cartera: d.cartera, benchmark: d.benchmark })),
        metrics: backtestData.metrics,
        benchmarkMetrics: backtestData.benchmarkMetrics,
      }
    : { data: [], metrics: { rendibilitatAnualitzada: 0, volatilitat: 0, maxDrawdown: 0, sharpe: 0 }, benchmarkMetrics: { rendibilitatAnualitzada: 0, volatilitat: 0, maxDrawdown: 0, sharpe: 0 } };
  const compClasse = benchmark.composicio.length ? comparacioClasseActiu(result.cartera, benchmark) : [];
  const taulaComparacio = hasRealData ? metriquesComparatives(backtest, benchmark) : [["Estat", "Dades pendents de connexió", "-"]];
  const blocData = productesPerBloc(productes);
  const drawdowns = backtestData?.data.map((d, idx) => ({ any: idx === 0 ? "Inici" : d.date, carteraDD: d.carteraDD, benchmarkDD: d.benchmarkDD })) ?? [];
  const riskReturn = backtestData?.riskReturn ?? [];
  const riskContribution = backtestData?.riskContribution ?? [];
  const correlations = backtestData?.correlations ?? [];
  const mc = metricsData?.monteCarlo
    ? {
        trajectoria: metricsData.monteCarlo!.trajectoria,
        probAssolir:
          Number(result.row.importObjectiu || 0) > 0
            ? Math.round(
                Math.max(
                  0,
                  Math.min(100, (metricsData.monteCarlo!.percentils.p50 / Number(result.row.importObjectiu || 1)) * 100),
                ),
              )
            : 0,
        valorFinalEsperat: metricsData.monteCarlo!.percentils.p50,
        rang: { min: metricsData.monteCarlo!.percentils.p10, max: metricsData.monteCarlo!.percentils.p90 },
        anys: metricsData.monteCarlo!.trajectoria.length - 1,
      }
    : null;
  const alternatives = PRODUCT_UNIVERSE.filter((p) => p.perfils.includes(result.perfilFinal) && !productes.some((x) => x.id === p.id)).slice(0, 5);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#1a1a1a", background: "white" }}>
      <section style={{ borderBottom: "3px solid #0c2d2a", paddingBottom: 10, marginBottom: 16 }}>
        <div style={{ color: "#0c2d2a", fontWeight: 800, letterSpacing: 1.4 }}>ROBOADVISOR · INFORME INDEPENDENT</div>
        <h1 style={{ margin: "8px 0 4px", fontSize: 26, color: "#0c2d2a" }}>Informe financer personalitzat</h1>
        <div style={{ color: "#666", fontSize: 13 }}>Client: {result.row.nom || "Client"} · Perfil: {result.perfilFinal} · Score: {result.scoreFinal}/100</div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Resum executiu</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 13 }}>
          <li>Objectiu principal: {result.row.objectiuPrincipal || "pendent"}.</li>
          <li>Horitzó temporal: {result.row.horitzoAnys || "-"} anys.</li>
          <li>Asset allocation: RV {result.cartera.rendaVariable}% · RF {result.cartera.rendaFixa}% · Liquidesa {result.cartera.liquiditat}% · Alternatius {result.cartera.alternatius}%.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Cartera recomanada (productes finals)</h2>
        <SimpleTable
          headers={["Classe d’actiu", "Producte", "Gestora", "ISIN", "Tipus", "Gestió", "Pes", "Rol", "Benchmark", "Funció"]}
          rows={productes.map((p) => [p.blocActiu, p.nom, p.gestora || "-", p.isin || "pendent de validació", p.tipus, p.gestio, `${p.percentatge}%`, p.rol, p.benchmarkRef, p.dataAvailable ? p.justificacio : "Només informatiu: pendent de validació de dades"])}
        />
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Benchmark compost</h2>
        <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.6 }}>
          El benchmark compost és la referència utilitzada per comparar la cartera. No és un únic índex, sinó una combinació ponderada coherent amb el perfil inversor.
        </p>
        <SimpleTable headers={["Índex", "Ticker", "Pes", "Per què s'utilitza"]} rows={benchmark.composicio.map((c: { component: string; pes: number; ticker?: string; rationale?: string }) => [c.component, c.ticker || "-", `${c.pes}%`, c.rationale || "-"])} />
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Comparació cartera vs benchmark</h2>
        <SimpleTable headers={["Classe d’actiu", "Cartera", "Benchmark"]} rows={compClasse.map((r) => [r.classe, `${r.cartera}%`, `${r.benchmark.toFixed(1)}%`])} />
        <div style={{ height: 8 }} />
        <SimpleTable headers={["Mètrica", "Cartera", "Benchmark compost"]} rows={taulaComparacio} />
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Visualitzacions clau de cartera</h2>
        <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.6 }}>Els gràfics següents mostren composició, evolució i risc de la cartera. S’interpreten com a eines de decisió, no com a predicció de resultats.</p>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={blocData} dataKey="pes" nameKey="bloc" innerRadius={40} outerRadius={85} label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p style={{ margin: "6px 0 10px", fontSize: 12 }}>Interpretació: aquest gràfic mostra el pes estructural per blocs d’actiu i el nivell de risc agregat implícit del perfil.</p>
        {!!hasRealData && (
          <>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={backtest.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="any" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatEuro(Number(v))} />
                  <Line dataKey="cartera" stroke="#0c2d2a" dot={false} />
                  <Line dataKey="benchmark" stroke="#b39b72" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 12 }}>Interpretació: evolució històrica real de 10.000 € comparant cartera i benchmark compost.</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={drawdowns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="any" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Area dataKey="carteraDD" stroke="#0c2d2a" fill="#d6e7e1" />
                  <Area dataKey="benchmarkDD" stroke="#b39b72" fill="#f2e9da" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 12 }}>Interpretació: drawdown mesura la caiguda des de màxim i ajuda a validar la tolerància real al risc.</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis dataKey="risc" />
                  <YAxis dataKey="rendiment" />
                  <ZAxis dataKey="pes" range={[50, 300]} />
                  <Tooltip />
                  <Scatter data={riskReturn} fill="#0c2d2a" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 12 }}>Interpretació: relació risc-rendibilitat dels actius validats i pes relatiu a cartera.</p>
            {!!riskContribution.length && <SimpleTable headers={["Actiu", "Contribució al risc"]} rows={riskContribution.map((r) => [r.nom, `${r.contribucio.toFixed(1)}%`])} />}
            {!!correlations.length && <SimpleTable headers={["Actiu A", "Actiu B", "Correlació"]} rows={correlations.slice(0, 12).map((c) => [c.x, c.y, c.value.toFixed(2)])} />}
          </>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Simulació Monte Carlo</h2>
        {mc ? (
          <SimpleTable
            headers={["Mètrica", "Valor"]}
            rows={[
              ["Percentil P10", formatEuro(mc.rang.min)],
              ["Percentil P50", formatEuro(mc.valorFinalEsperat)],
              ["Percentil P90", formatEuro(mc.rang.max)],
              ["Probabilitat estimada d’assolir objectiu", `${mc.probAssolir}%`],
            ]}
          />
        ) : (
          <p style={{ fontSize: 13, color: "#555" }}>Dades pendents de connexió: no hi ha base real suficient per executar Monte Carlo.</p>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Alternatives complementàries (resum)</h2>
        <SimpleTable headers={["Producte", "Categoria", "Tipus", "Risc", "Rol"]} rows={alternatives.map((a) => [a.nom, a.categoria, a.tipus, a.risc, a.rol])} />
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 8px", fontSize: 18 }}>Fiabilitat, fonts de dades i data d’actualització</h2>
        <SimpleTable
          headers={["Camp", "Valor"]}
          rows={[
            ["Font de dades", backtestData?.dataSource || "Dades pendents de connexió"],
            ["Última actualització", backtestData?.updatedAt ? new Date(backtestData.updatedAt).toLocaleString("ca-ES") : "-"],
            ["Estat de dades", backtestData?.dataStatus || "pending"],
            ["Cobertura de dades", `${productes.length ? ((productes.filter((p) => p.dataStatus === "validated").length / productes.length) * 100).toFixed(1) : "0.0"}%`],
            ["Productes validats", backtestData?.availability.ambDades.join(", ") || "Cap"],
            ["Productes pendents", backtestData?.availability.pendents.join(", ") || "Cap"],
          ]}
        />
      </section>

      <section style={{ borderTop: "1px solid #d7e0de", paddingTop: 12 }}>
        <h2 style={{ color: "#0c2d2a", margin: "0 0 6px", fontSize: 18 }}>Conclusió</h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }}>
          La cartera s’ajusta al perfil {result.perfilFinal.toLowerCase()} i prioritza coherència entre risc, horitzó i objectiu.
          Les simulacions són orientatives i no garanteixen resultats futurs.
        </p>
      </section>

      <div style={{ marginTop: 12, fontSize: 11.5, color: "#555", background: "#fff8e8", border: "1px solid #e7dcc0", padding: 10 }}>
        Aquesta proposta té finalitat acadèmica i educativa. No constitueix assessorament financer personalitzat regulat ni recomanació d’inversió real.
      </div>
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
        El procés diferencia dues decisions: primer, l’asset allocation estratègica, que determina el nivell de risc assumit; i segon, la implementació principal amb fons d’inversió, escollits per criteris de diversificació global, cost, qualitat de gestora, liquiditat i adequació al client.
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
          ["Percentil P10 (final)", formatEuro(mc.rang.min)],
          ["Percentil P50 (final)", formatEuro(mc.valorFinalEsperat)],
          ["Percentil P90 (final)", formatEuro(mc.rang.max)],
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
  const tesi =
    result.perfilFinal === "Conservador"
      ? "Aquesta proposta prioritza preservació de capital i estabilitat."
      : result.perfilFinal === "Moderat"
      ? "Aquesta proposta equilibra creixement i control de volatilitat."
      : result.perfilFinal === "Dinàmic"
      ? "Aquesta proposta busca creixement sostingut assumint volatilitat moderada-alta."
      : "Aquesta proposta maximitza potencial de creixement assumint elevada volatilitat.";
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: "#fafcfb", padding: 18 }}>
      <SectionBadge text="Conclusió final" />
      <ul style={{ margin: 0, paddingLeft: 20, color: COLORS.textMedium, lineHeight: 1.8, fontSize: 14 }}>
        <li>Perfil detectat: <strong>{result.perfilFinal}</strong>. {tesi}</li>
        <li>Encaix de cartera: combina actius core i satèl·lits en proporcions coherents amb la teva tolerància i capacitat de risc.</li>
        <li>Riscos principals: volatilitat de mercat, possibles drawdowns temporals i desviacions respecte retorn esperat.</li>
        <li>Horitzó recomanat: mínim {Math.max(3, Number(result.row.horitzoAnys || 5))} anys per maximitzar la consistència de la proposta.</li>
        <li>Revisió recomanada: trimestral i sempre que canviï situació personal, objectiu o tolerància al risc.</li>
        <li>Recordatori: és una proposta acadèmica; la simulació no garanteix resultats futurs.</li>
      </ul>
    </div>
  );
}

function BenchmarkCompositionPanel({ benchmark }: { benchmark: ReturnType<typeof benchmarkCompost> }) {
  if (!benchmark.composicio.length) {
    return <div style={highlightBox}>Benchmark compost pendent: dades de mercat encara no validades per al perfil seleccionat.</div>;
  }
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, padding: 18 }}>
      <h3 style={sectionTitle}>Benchmark compost per perfil</h3>
      <p style={paragraph}>
        El benchmark no és un únic índex; és una combinació ponderada d’índexs representatius segons perfil de risc. És una referència comparable de risc-rendibilitat, no un objectiu a batre sempre.
      </p>
      <SimpleTable
        headers={["Component de benchmark", "Pes", "Rendibilitat anualitzada", "Volatilitat anualitzada"]}
        rows={benchmark.composicio.map((c) => [c.component, `${c.pes}%`, c.r ? formatPct(c.r) : "-", c.v ? formatPct(c.v) : "-"])}
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
  correlations,
  riskContribution,
}: {
  blocData: Array<{ bloc: string; pes: number }>;
  productes: ProducteCartera[];
  backtest: ReturnType<typeof generarBacktestSimulat>;
  riscReturn: Array<{ nom: string; risc: number; rendiment: number; pes: number; serie: string }>;
  drawdowns: Array<{ any: string; carteraDD: number; benchmarkDD: number }>;
  benchmark: ReturnType<typeof benchmarkCompost>;
  correlations: Array<{ x: string; y: string; value: number }>;
  riskContribution: Array<{ nom: string; contribucio: number }>;
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
          <p style={{ ...paragraph, marginTop: 8, fontSize: 12.5 }}>
            Aquest gràfic mostra com la cartera proposada i els seus satèl·lits se situen en relació amb el benchmark compost: més a la dreta implica més volatilitat, més amunt implica major rendibilitat esperada.
          </p>
        </div>
      </div>

      <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
        <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Evolució històrica real (cartera vs benchmark)</h4>
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

      {!!riskContribution.length && (
        <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
          <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Contribució de risc per actiu</h4>
          <div style={{ height: "clamp(220px, 48vw, 280px)" }}>
            <ResponsiveContainer>
              <BarChart data={riskContribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" />
                <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Bar dataKey="contribucio" fill={COLORS.danger} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!!correlations.length && (
        <div style={{ border: `1px solid ${COLORS.border}`, padding: 12 }}>
          <h4 style={{ margin: "0 0 10px 0", color: COLORS.primaryDark }}>Matriu de correlacions (parelles principals)</h4>
          <SimpleTable
            headers={["Actiu A", "Actiu B", "Correlació"]}
            rows={correlations.slice(0, 12).map((c) => [c.x, c.y, c.value.toFixed(2)])}
          />
        </div>
      )}
    </div>
  );
}

function CriteriaGrid() {
  const criteris = [
    ["Diversificació", "Exposició a diferents geografies, sectors, capitalitzacions i classes d’actiu."],
    ["Consistència de perfil", "Els pesos i blocs s’ajusten al perfil de risc detectat i a l’horitzó temporal."],
    ["Cost", "TER/ongoing cost controlat per minimitzar l’erosió de rendibilitat neta a llarg termini."],
    ["Qualitat de gestora", "Preferència per gestores amb procés robust, risc controlat i historial contrastable."],
    ["Tracking error", "En fons indexats, es controla la desviació respecte al benchmark de referència."],
    ["Benchmark", "Cada fons es vincula a un benchmark coherent per mesurar risc i rendiment."],
    ["Historial disponible", "Només s’utilitzen per càlcul real productes amb sèrie històrica suficient i validada."],
    ["Liquiditat", "Selecció de classes i vehicles amb liquiditat adequada per reequilibri periòdic."],
    ["Risc", "Pesos ajustats al perfil inversor, horitzó temporal i tolerància psicològica."],
    ["Divisa", "Control de risc de canvi i coherència de divisa segons objectius del client."],
    ["Adequació al client", "Coherència entre objectiu, situació financera, coneixement i comportament inversor."],
  ];

  return (
    <div>
      <h3 style={sectionTitle}>Criteris de selecció dels fons d’inversió</h3>
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
      <h3 style={sectionTitle}>Backtest històric cartera vs benchmark compost</h3>
      <p style={paragraph}>
        Mètriques calculades amb dades històriques disponibles. Si la cartera queda per sota del benchmark en rendibilitat, la lectura s’ha de fer juntament amb volatilitat, drawdown i objectiu de prudència del perfil.
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
        headers={["Mètrica", "Cartera recomanada", "Benchmark compost", "Origen"]}
        rows={[
          ["Rendibilitat anualitzada", formatPct(backtest.metrics.rendibilitatAnualitzada), formatPct(backtest.benchmarkMetrics.rendibilitatAnualitzada), "Calculat amb dades històriques reals"],
          ["Volatilitat", formatPct(backtest.metrics.volatilitat), formatPct(backtest.benchmarkMetrics.volatilitat), "Calculat amb dades històriques reals"],
          ["Drawdown màxim", formatPct(backtest.metrics.maxDrawdown), formatPct(backtest.benchmarkMetrics.maxDrawdown), "Calculat amb dades històriques reals"],
          ["Sharpe", backtest.metrics.sharpe.toFixed(2), backtest.benchmarkMetrics.sharpe.toFixed(2), "Estimació basada en sèrie històrica disponible"],
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
        La cartera no respon a una selecció subjectiva, sinó a un procés estructurat basat en perfil de risc, horitzó temporal, capacitat financera i criteris de diversificació. Els fons d’inversió seleccionats permeten controlar el risc específic, gestionar costos i implementar una cartera global coherent. La proposta és acadèmica i no constitueix assessorament financer regulat ni execució d’ordres.
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
          Sistema acadèmic de perfilació inversora, scoring, suitability i proposta de cartera model basada en asset allocation, diversificació i criteris de selecció de fons d’inversió.
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

function DataStatusBadge({ status }: { status: "validated" | "partial" | "pending" | "unavailable" }) {
  const palette =
    status === "validated"
      ? { bg: "#e8f6ef", color: "#1d6b45", text: "validat" }
      : status === "partial"
      ? { bg: "#eef3ff", color: "#3f57a3", text: "parcial" }
      : status === "pending"
      ? { bg: "#fff5e6", color: "#9a5b00", text: "pendent" }
      : { bg: "#fdecec", color: "#8f2a2a", text: "no disponible" };
  return <span style={{ background: palette.bg, color: palette.color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{palette.text}</span>;
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
