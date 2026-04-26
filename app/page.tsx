"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

type Perfil = "Conservador" | "Moderat" | "Dinàmic" | "Agressiu";

type Client = {
  nom: string;
  edat: string;
  ingressosMensualsNets: string;
  despesesFixesMensuals: string;
  despesesVariablesMensuals: string;
  estalviMensual: string;
  estalviLiquid: string;
  patrimoniInvertit: string;
  deuteTotal: string;
  quotaMensualDeutes: string;
  objectiuPrincipal: string;
  importObjectiu: string;
  horitzoAnys: string;
  percentatgeEstalviInvertir: string;
  coneixementFinancer: string;
  experienciaInversora: string;
  anysInvertint: string;
  reaccioCaiguda10: string;
  reaccioCaiguda25: string;
  perduaMaximaTolerable: string;
  tempsAguantariaPerdues: string;
  mercatCau: string;
  inversioPujaRapid: string;
  frequenciaRevisio: string;
  preferenciaESG: string;
};

type CarteraModel = {
  rendaVariable: number;
  rendaFixa: number;
  liquiditat: number;
  alternatius: number;
};

type ProducteCartera = {
  nom: string;
  tickerOrientatiu: string;
  tipus: string;
  percentatge: number;
  criteri: string;
  justificacio: string;
};

type ClientResult = {
  row: Client;
  scoreFinal: number;
  scoreCapacitat: number;
  scoreTolerancia: number;
  scoreConeixement: number;
  scoreHoritzo: number;
  perfilFinal: Perfil;
  confiança: number;
  motius: string[];
  alertes: string[];
  cartera: CarteraModel;
  metriques: {
    ingressos: number;
    despesesTotals: number;
    excedentMensual: number;
    taxaEstalvi: number;
    ratioDeuteIngressos: number;
    fonsEmergenciaMesos: number;
  };
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

function parseNumber(value?: string, fallback = 0) {
  if (!value) return fallback;
  const normalized = String(value).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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

function scoreToPerfil(score: number): Perfil {
  if (score >= 80) return "Agressiu";
  if (score >= 60) return "Dinàmic";
  if (score >= 40) return "Moderat";
  return "Conservador";
}

function carteraPerPerfil(perfil: Perfil): CarteraModel {
  if (perfil === "Conservador") return { rendaVariable: 20, rendaFixa: 65, liquiditat: 10, alternatius: 5 };
  if (perfil === "Moderat") return { rendaVariable: 45, rendaFixa: 45, liquiditat: 5, alternatius: 5 };
  if (perfil === "Dinàmic") return { rendaVariable: 70, rendaFixa: 20, liquiditat: 5, alternatius: 5 };
  return { rendaVariable: 90, rendaFixa: 5, liquiditat: 0, alternatius: 5 };
}

function productesPerPerfil(perfil: Perfil): ProducteCartera[] {
  if (perfil === "Conservador") {
    return [
      {
        nom: "Fons monetari EUR",
        tickerOrientatiu: "Monetari EUR",
        tipus: "Liquiditat",
        percentatge: 10,
        criteri: "Preservació de capital",
        justificacio:
          "Reserva de liquiditat amb volatilitat molt baixa. Permet mantenir disponibilitat immediata i redueix el risc global de la cartera.",
      },
      {
        nom: "ETF renda fixa governamental EUR curt termini",
        tickerOrientatiu: "IBGS / similar",
        tipus: "Renda fixa",
        percentatge: 30,
        criteri: "Baixa durada",
        justificacio:
          "Actua com a bloc defensiu. La durada curta redueix la sensibilitat davant canvis en els tipus d’interès.",
      },
      {
        nom: "ETF renda fixa global coberta a EUR",
        tickerOrientatiu: "AGGH / similar",
        tipus: "Renda fixa",
        percentatge: 35,
        criteri: "Diversificació global",
        justificacio:
          "Aporta exposició a bons globals i redueix el risc de divisa mitjançant cobertura a euros.",
      },
      {
        nom: "ETF MSCI World",
        tickerOrientatiu: "IWDA / SWDA",
        tipus: "Renda variable global",
        percentatge: 15,
        criteri: "Creixement controlat",
        justificacio:
          "Permet participar en el creixement de mercats desenvolupats sense concentrar el risc en accions individuals.",
      },
      {
        nom: "ETF REIT global",
        tickerOrientatiu: "IWDP / similar",
        tipus: "Alternatius líquids",
        percentatge: 5,
        criteri: "Diversificació immobiliària",
        justificacio:
          "Aporta exposició immobiliària cotitzada amb liquiditat diària i baixa ponderació per controlar la volatilitat.",
      },
      {
        nom: "ETF renda variable Europa",
        tickerOrientatiu: "IMEU / similar",
        tipus: "Renda variable regional",
        percentatge: 5,
        criteri: "Complement regional",
        justificacio:
          "Introdueix exposició europea moderada, coherent amb un inversor resident a la zona euro.",
      },
    ];
  }

  if (perfil === "Moderat") {
    return [
      {
        nom: "ETF MSCI World",
        tickerOrientatiu: "IWDA / SWDA",
        tipus: "Renda variable global",
        percentatge: 32,
        criteri: "Nucli de creixement",
        justificacio:
          "És el principal motor de rendibilitat esperada, amb exposició diversificada a empreses de països desenvolupats.",
      },
      {
        nom: "ETF renda fixa global coberta a EUR",
        tickerOrientatiu: "AGGH / similar",
        tipus: "Renda fixa",
        percentatge: 30,
        criteri: "Estabilització",
        justificacio:
          "Redueix la volatilitat global de la cartera i aporta estabilitat davant escenaris adversos de mercat.",
      },
      {
        nom: "ETF renda fixa curt termini EUR",
        tickerOrientatiu: "IBGS / similar",
        tipus: "Renda fixa",
        percentatge: 15,
        criteri: "Control de durada",
        justificacio:
          "Limita el risc de tipus d’interès i reforça el component defensiu de la cartera.",
      },
      {
        nom: "ETF MSCI Emerging Markets",
        tickerOrientatiu: "EIMI / similar",
        tipus: "Renda variable emergent",
        percentatge: 8,
        criteri: "Creixement emergent",
        justificacio:
          "Afegeix exposició a economies amb major potencial de creixement, però amb un pes limitat pel seu risc superior.",
      },
      {
        nom: "ETF renda variable Europa",
        tickerOrientatiu: "IMEU / similar",
        tipus: "Renda variable regional",
        percentatge: 5,
        criteri: "Biaix europeu",
        justificacio:
          "Complementa l’exposició global amb presència europea i redueix la dependència exclusiva dels Estats Units.",
      },
      {
        nom: "Fons monetari EUR",
        tickerOrientatiu: "Monetari EUR",
        tipus: "Liquiditat",
        percentatge: 5,
        criteri: "Reserva operativa",
        justificacio:
          "Manté liquiditat disponible i redueix la necessitat de vendre actius en moments desfavorables.",
      },
      {
        nom: "ETF REIT global",
        tickerOrientatiu: "IWDP / similar",
        tipus: "Alternatius líquids",
        percentatge: 5,
        criteri: "Diversificació immobiliària",
        justificacio:
          "Aporta una font de rendibilitat diferent de la renda variable i la renda fixa tradicionals.",
      },
    ];
  }

  if (perfil === "Dinàmic") {
    return [
      {
        nom: "ETF MSCI World",
        tickerOrientatiu: "IWDA / SWDA",
        tipus: "Renda variable global desenvolupada",
        percentatge: 45,
        criteri: "Nucli global",
        justificacio:
          "Actua com a nucli de la cartera. Ofereix exposició global, diversificació sectorial i reducció del risc específic.",
      },
      {
        nom: "ETF MSCI Emerging Markets",
        tickerOrientatiu: "EIMI / similar",
        tipus: "Renda variable emergent",
        percentatge: 12,
        criteri: "Potencial de creixement",
        justificacio:
          "Afegeix exposició a països emergents, assumint més volatilitat però amb potencial de rendibilitat superior a llarg termini.",
      },
      {
        nom: "ETF Small Caps Global",
        tickerOrientatiu: "IUSN / similar",
        tipus: "Renda variable small caps",
        percentatge: 8,
        criteri: "Diversificació per mida",
        justificacio:
          "Permet exposició a empreses de menor capitalització, ampliant l’univers d’inversió més enllà de grans companyies.",
      },
      {
        nom: "ETF renda variable Europa",
        tickerOrientatiu: "IMEU / similar",
        tipus: "Renda variable regional",
        percentatge: 5,
        criteri: "Complement europeu",
        justificacio:
          "Introdueix un biaix europeu moderat, útil per equilibrar la composició geogràfica de la renda variable.",
      },
      {
        nom: "ETF renda fixa global coberta a EUR",
        tickerOrientatiu: "AGGH / similar",
        tipus: "Renda fixa",
        percentatge: 20,
        criteri: "Bloc estabilitzador",
        justificacio:
          "Redueix parcialment la volatilitat i millora la resistència de la cartera davant caigudes de mercat.",
      },
      {
        nom: "Fons monetari EUR",
        tickerOrientatiu: "Monetari EUR",
        tipus: "Liquiditat",
        percentatge: 5,
        criteri: "Liquiditat mínima",
        justificacio:
          "Permet mantenir una petita reserva sense alterar excessivament l’objectiu de creixement.",
      },
      {
        nom: "ETF REIT global",
        tickerOrientatiu: "IWDP / similar",
        tipus: "Alternatius líquids",
        percentatge: 5,
        criteri: "Diversificació alternativa",
        justificacio:
          "Aporta exposició immobiliària cotitzada i diversificació addicional dins d’una cartera orientada al creixement.",
      },
    ];
  }

  return [
    {
      nom: "ETF MSCI World",
      tickerOrientatiu: "IWDA / SWDA",
      tipus: "Renda variable global desenvolupada",
      percentatge: 55,
      criteri: "Nucli de creixement global",
      justificacio:
        "Actua com a nucli de la cartera. Ofereix exposició diversificada a empreses de països desenvolupats, redueix el risc específic i captura el creixement global a llarg termini.",
    },
    {
      nom: "ETF MSCI Emerging Markets",
      tickerOrientatiu: "EIMI / similar",
      tipus: "Renda variable emergent",
      percentatge: 15,
      criteri: "Creixement emergent",
      justificacio:
        "Afegeix exposició a economies emergents amb major potencial de creixement, assumint més volatilitat. El pes es limita per controlar risc polític, regulatori i de divisa.",
    },
    {
      nom: "ETF Small Caps Global",
      tickerOrientatiu: "IUSN / similar",
      tipus: "Renda variable global small caps",
      percentatge: 10,
      criteri: "Diversificació per capitalització",
      justificacio:
        "Incrementa la diversificació per mida empresarial i permet exposició a companyies de menor capitalització amb potencial de rendibilitat superior a llarg termini.",
    },
    {
      nom: "ETF renda variable Europa",
      tickerOrientatiu: "IMEU / similar",
      tipus: "Renda variable regional",
      percentatge: 10,
      criteri: "Biaix europeu moderat",
      justificacio:
        "Complementa l’exposició global amb presència europea, útil per a un inversor resident a la zona euro i per reduir dependència exclusiva dels Estats Units.",
    },
    {
      nom: "ETF renda fixa global coberta a EUR",
      tickerOrientatiu: "AGGH / similar",
      tipus: "Renda fixa",
      percentatge: 5,
      criteri: "Estabilització mínima",
      justificacio:
        "Funciona com a bloc estabilitzador mínim. La cobertura a EUR redueix el risc de divisa i aporta certa protecció en escenaris de caiguda de renda variable.",
    },
    {
      nom: "ETF REIT global",
      tickerOrientatiu: "IWDP / similar",
      tipus: "Alternatius líquids",
      percentatge: 5,
      criteri: "Diversificació immobiliària",
      justificacio:
        "Aporta exposició immobiliària cotitzada i una font de rendibilitat diferent de la renda variable tradicional, mantenint liquiditat mitjançant format ETF.",
    },
  ];
}

function calcularClient(client: Client): ClientResult {
  const ingressos = parseNumber(client.ingressosMensualsNets);
  const fixes = parseNumber(client.despesesFixesMensuals);
  const variables = parseNumber(client.despesesVariablesMensuals);
  const estalviMensual = parseNumber(client.estalviMensual);
  const estalviLiquid = parseNumber(client.estalviLiquid);
  const quotaDeutes = parseNumber(client.quotaMensualDeutes);
  const edat = parseNumber(client.edat);
  const horitzo = parseNumber(client.horitzoAnys);
  const perduaMax = parseNumber(client.perduaMaximaTolerable);
  const anysInvertint = parseNumber(client.anysInvertint);

  const despesesTotals = fixes + variables;
  const excedentMensual = ingressos - despesesTotals - quotaDeutes;
  const taxaEstalvi = ingressos > 0 ? (estalviMensual / ingressos) * 100 : 0;
  const ratioDeuteIngressos = ingressos > 0 ? (quotaDeutes / ingressos) * 100 : 0;
  const fonsEmergenciaMesos = despesesTotals > 0 ? estalviLiquid / despesesTotals : 0;

  let capacitat = 50;
  capacitat += edat < 35 ? 12 : edat < 50 ? 6 : edat < 65 ? -4 : -12;
  capacitat += taxaEstalvi >= 30 ? 18 : taxaEstalvi >= 15 ? 10 : taxaEstalvi >= 5 ? 2 : -14;
  capacitat += fonsEmergenciaMesos >= 9 ? 14 : fonsEmergenciaMesos >= 6 ? 10 : fonsEmergenciaMesos >= 3 ? 2 : -18;
  capacitat += ratioDeuteIngressos <= 10 ? 10 : ratioDeuteIngressos <= 25 ? 3 : ratioDeuteIngressos <= 40 ? -8 : -22;
  capacitat += excedentMensual > 0 ? 8 : -20;
  capacitat = clamp(capacitat, 0, 100);

  let tolerancia = 50;
  tolerancia += client.reaccioCaiguda10 === "aportar_mes" ? 16 : client.reaccioCaiguda10 === "mantenir" ? 8 : client.reaccioCaiguda10 === "reduir_risc" ? -8 : -22;
  tolerancia += client.reaccioCaiguda25 === "aportar_mes" ? 20 : client.reaccioCaiguda25 === "mantenir" ? 10 : client.reaccioCaiguda25 === "reduir_risc" ? -12 : -28;
  tolerancia += perduaMax >= 30 ? 18 : perduaMax >= 20 ? 10 : perduaMax >= 10 ? 0 : -18;
  tolerancia += client.tempsAguantariaPerdues === "mes_2_anys" ? 16 : client.tempsAguantariaPerdues === "6_24_mesos" ? 8 : client.tempsAguantariaPerdues === "1_6_mesos" ? -6 : -16;
  tolerancia += client.mercatCau === "oportunitat" ? 16 : client.mercatCau === "mantenir" ? 8 : client.mercatCau === "reduir" ? -7 : -18;
  tolerancia += client.inversioPujaRapid === "reequilibrar" ? 12 : client.inversioPujaRapid === "revisar" ? 8 : client.inversioPujaRapid === "mantenir" ? 2 : -6;
  tolerancia = clamp(tolerancia, 0, 100);

  let coneixement = 50;
  coneixement += client.coneixementFinancer === "alt" ? 22 : client.coneixementFinancer === "mitja" ? 12 : client.coneixementFinancer === "basic" ? -3 : -20;
  coneixement += client.experienciaInversora === "alta_volatilitat" ? 18 : client.experienciaInversora === "fons_etfs" ? 10 : client.experienciaInversora === "conservadors" ? -5 : -18;
  coneixement += anysInvertint >= 5 ? 14 : anysInvertint >= 2 ? 6 : anysInvertint > 0 ? 2 : -8;
  coneixement = clamp(coneixement, 0, 100);

  let horitzoScore = 50;
  horitzoScore += horitzo >= 15 ? 25 : horitzo >= 10 ? 18 : horitzo >= 5 ? 8 : horitzo >= 3 ? -5 : -25;
  horitzoScore += client.objectiuPrincipal === "creixer_patrimoni" ? 12 : client.objectiuPrincipal === "jubilacio" ? 10 : client.objectiuPrincipal === "habitatge" ? -4 : 0;
  horitzoScore = clamp(horitzoScore, 0, 100);

  const scoreFinal = Math.round(capacitat * 0.35 + tolerancia * 0.3 + horitzoScore * 0.2 + coneixement * 0.15);
  let perfilFinal = scoreToPerfil(scoreFinal);
  const alertes: string[] = [];

  if (fonsEmergenciaMesos < 3) {
    perfilFinal = perfilFinal === "Agressiu" || perfilFinal === "Dinàmic" ? "Moderat" : perfilFinal;
    alertes.push("Fons d’emergència inferior a 3 mesos: el model limita el risc recomanat.");
  }

  if (ratioDeuteIngressos > 40 || excedentMensual <= 0) {
    perfilFinal = "Conservador";
    alertes.push("La situació financera requereix prioritzar sanejament abans d’assumir risc.");
  }

  if (horitzo < 3) {
    perfilFinal = "Conservador";
    alertes.push("Horitzó inferior a 3 anys: no és adequat assumir alta volatilitat.");
  }

  const motius = [
    capacitat >= 70 ? "capacitat financera elevada" : capacitat >= 45 ? "capacitat financera mitjana" : "capacitat financera limitada",
    tolerancia >= 70 ? "tolerància psicològica alta a la volatilitat" : tolerancia >= 45 ? "tolerància psicològica moderada" : "tolerància psicològica baixa",
    horitzo >= 10 ? "horitzó temporal llarg" : horitzo >= 5 ? "horitzó temporal mitjà" : "horitzó temporal curt",
    fonsEmergenciaMesos >= 6 ? "fons d’emergència suficient" : "fons d’emergència ajustat",
    taxaEstalvi >= 15 ? "taxa d’estalvi saludable" : "taxa d’estalvi moderada",
    ratioDeuteIngressos <= 25 ? "nivell d’endeutament controlat" : "endeutament rellevant",
  ];

  return {
    row: client,
    scoreFinal,
    scoreCapacitat: Math.round(capacitat),
    scoreTolerancia: Math.round(tolerancia),
    scoreConeixement: Math.round(coneixement),
    scoreHoritzo: Math.round(horitzoScore),
    perfilFinal,
    confiança: alertes.length ? 92 : 98,
    motius,
    alertes,
    cartera: carteraPerPerfil(perfilFinal),
    metriques: {
      ingressos,
      despesesTotals,
      excedentMensual,
      taxaEstalvi,
      ratioDeuteIngressos,
      fonsEmergenciaMesos,
    },
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
    <main style={{ minHeight: "100vh", background: COLORS.bg, padding: "32px 20px", color: COLORS.textDark }}>
      <div style={{ maxWidth: 1380, margin: "0 auto" }}>
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
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 24 }}>
              <SummaryCard title="Perfil final" value={resultat.perfilFinal} note={`Score ${resultat.scoreFinal}/100`} color={perfilColor(resultat.perfilFinal)} />
              <SummaryCard title="Capacitat" value={`${resultat.scoreCapacitat}/100`} note="Risc assumible objectiu" color={COLORS.green} />
              <SummaryCard title="Tolerància" value={`${resultat.scoreTolerancia}/100`} note="Reacció davant volatilitat" color={COLORS.gold} />
              <SummaryCard title="Horitzó" value={`${resultat.scoreHoritzo}/100`} note="Temps disponible" color="#315d9c" />
              <SummaryCard title="Coneixement" value={`${resultat.scoreConeixement}/100`} note="Experiència inversora" color={COLORS.danger} />
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)", gap: 24, marginTop: 24 }}>
              <Panel title="2. Asset allocation proposada">
                <div style={{ height: 320 }}>
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

            <section style={{ marginTop: 24 }}>
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

      <MethodologyBox />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <MiniMetric title="Renda variable" value={`${result.cartera.rendaVariable}%`} />
        <MiniMetric title="Renda fixa" value={`${result.cartera.rendaFixa}%`} />
        <MiniMetric title="Liquiditat" value={`${result.cartera.liquiditat}%`} />
        <MiniMetric title="Alternatius" value={`${result.cartera.alternatius}%`} />
      </div>

      <ProfessionalBox
        title="Lectura de l’asset allocation"
        text={`La cartera ${result.perfilFinal.toLowerCase()} assigna el pes principal a les classes d’actiu coherents amb el nivell de risc detectat. L’assignació separa la decisió estratègica de risc —asset allocation— de la selecció concreta d’instruments —ETFs—, seguint una metodologia pròpia dels serveis de gestió indexada i RoboAdvisors.`}
      />

      <CriteriaGrid />

      <div>
        <h3 style={sectionTitle}>Univers d’inversió seleccionat</h3>
        <SimpleTable
          headers={["Instrument", "Ticker", "Tipus", "Pes", "Criteri", "Justificació"]}
          rows={productes.map((p) => [
            p.nom,
            p.tickerOrientatiu,
            p.tipus,
            `${p.percentatge}%`,
            p.criteri,
            p.justificacio,
          ])}
        />
      </div>

      <ProfessionalBox
        title="Decisió de prudència"
        text={
          result.perfilFinal === "Agressiu"
            ? "Tot i que el perfil detectat és agressiu, el model manté un petit percentatge en renda fixa i actius alternatius per evitar una concentració absoluta en renda variable. Aquesta decisió respon a un criteri de prudència i diversificació, ja que fins i tot en perfils d’alt risc és recomanable limitar l’exposició a una única font de rendiment."
            : "La cartera manté una combinació entre actius de creixement i actius estabilitzadors per adaptar-se al perfil de risc detectat, evitant concentracions excessives i buscant coherència entre rendibilitat esperada, volatilitat i horitzó temporal."
        }
      />

      <BacktestBlock backtest={backtest} />

      <ProfessionalBox
        title="Explicació final per al client"
        text={`Es recomana una cartera ${result.perfilFinal.toLowerCase()} perquè el model detecta ${result.motius.join(", ")}. La proposta no executa inversions reals i té finalitat acadèmica. Serveix per mostrar com un RoboAdvisor pot transformar informació financera i conductual en una cartera model coherent, diversificada i defensable.`}
      />

      <DefenseBox />
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
      <h3 style={sectionTitle}>Simulació històrica orientativa vs benchmark</h3>
      <p style={paragraph}>
        La simulació no utilitza dades reals de mercat descarregades automàticament, sinó una aproximació acadèmica basada en paràmetres esperats de rendibilitat, volatilitat i drawdown per perfil. Serveix per il·lustrar el comportament esperat de la cartera, però no constitueix una predicció ni una recomanació d’inversió real.
      </p>

      <div style={{ height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={backtest.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="any" />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatEuro(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="cartera" name="Cartera recomanada" stroke="#0c2d2a" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="benchmark" name="Benchmark global" stroke="#b39b72" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SimpleTable
        headers={["Mètrica", "Cartera recomanada", "Benchmark global"]}
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

function Header() {
  return (
    <section style={{ background: COLORS.white, boxShadow: "0 5px 40px rgba(0,0,0,0.08)", border: `1px solid ${COLORS.border}`, marginBottom: 28 }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primaryDark}, ${COLORS.gold})` }} />
      <div style={{ padding: "44px 48px 32px 48px" }}>
        <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 24, letterSpacing: 2, color: COLORS.primaryDark, textTransform: "uppercase", marginBottom: 28 }}>
          <strong>FACTOR</strong> OTC
        </div>
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 34, fontWeight: 500, color: COLORS.primaryDark, margin: 0 }}>
          ROBOADVISOR FINANCER INTEL·LIGENT
        </h1>
        <p style={{ marginTop: 18, marginBottom: 0, maxWidth: 980, color: COLORS.textMedium, fontSize: 14, lineHeight: 1.8 }}>
          Sistema acadèmic de perfilació inversora, scoring, suitability i proposta de cartera model basada en asset allocation, diversificació i criteris de selecció d’ETFs.
        </p>
      </div>
    </section>
  );
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, padding: 18, background: "#fafcfb" }}>
      <h3 style={{ margin: "0 0 16px 0", color: COLORS.primaryDark, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 20 }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>{children}</div>
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
    <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, boxShadow: "0 5px 30px rgba(0,0,0,0.05)", padding: 22 }}>
      <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
        <h2 style={{ margin: 0, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 18, fontWeight: 500, color: COLORS.primaryDark }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ title, value, note, color }: { title: string; value: string; note: string; color: string }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, padding: "22px 18px", position: "relative" }}>
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

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
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
    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.primaryDark, borderBottom: `1px solid ${COLORS.border}` }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMedium, fontSize: 13, lineHeight: 1.6, verticalAlign: "top" }}>
      {children}
    </td>
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
  padding: "10px 12px",
  border: `1px solid ${COLORS.border}`,
  background: COLORS.white,
  color: COLORS.textDark,
  fontSize: 14,
};

const buttonStyle = {
  background: COLORS.primaryDark,
  color: "white",
  border: "none",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
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
