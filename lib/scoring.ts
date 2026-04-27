export type Perfil = "Conservador" | "Moderat" | "Dinàmic" | "Agressiu";

type ObjectiuPrincipal = "creixer_patrimoni" | "jubilacio" | "habitatge" | "preservar_capital";
type ConeixementFinancer = "baix" | "basic" | "mitja" | "alt";
type ExperienciaInversora = "mai" | "conservadors" | "fons_etfs" | "alta_volatilitat";
type ReaccioCaiguda = "vendre_tot" | "reduir_risc" | "mantenir" | "aportar_mes";
type TempsPerdues = "menys_1_mes" | "1_6_mesos" | "6_24_mesos" | "mes_2_anys";
type MercatCau = "sortir" | "reduir" | "mantenir" | "oportunitat";
type InversioPuja = "comprar_mes" | "mantenir" | "revisar" | "reequilibrar";

export type Client = {
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
  objectiuPrincipal: ObjectiuPrincipal | string;
  importObjectiu: string;
  horitzoAnys: string;
  percentatgeEstalviInvertir: string;
  coneixementFinancer: ConeixementFinancer | string;
  experienciaInversora: ExperienciaInversora | string;
  anysInvertint: string;
  reaccioCaiguda10: ReaccioCaiguda | string;
  reaccioCaiguda25: ReaccioCaiguda | string;
  perduaMaximaTolerable: string;
  tempsAguantariaPerdues: TempsPerdues | string;
  mercatCau: MercatCau | string;
  inversioPujaRapid: InversioPuja | string;
  frequenciaRevisio: string;
  preferenciaESG: string;
};

type ScoringMetrics = {
  ingressos: number;
  despesesTotals: number;
  excedentMensual: number;
  taxaEstalvi: number;
  ratioDeuteIngressos: number;
  fonsEmergenciaMesos: number;
};

type ScoringDimensions = {
  capacitat: number;
  tolerancia: number;
  necessitat: number;
  coneixement: number;
};

export type ScoringResult = {
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
  dimensions: ScoringDimensions;
  metriques: ScoringMetrics;
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

function scoreToPerfil(score: number): Perfil {
  if (score >= 80) return "Agressiu";
  if (score >= 60) return "Dinàmic";
  if (score >= 40) return "Moderat";
  return "Conservador";
}

function subscoreByBands(value: number, bands: Array<{ min: number; score: number }>) {
  for (const band of bands) {
    if (value >= band.min) return band.score;
  }
  return 0;
}

function applyPerfilCap(current: Perfil, cap: Perfil): Perfil {
  const order: Perfil[] = ["Conservador", "Moderat", "Dinàmic", "Agressiu"];
  return order.indexOf(current) > order.indexOf(cap) ? cap : current;
}

export function calcularScoringClient(client: Client): ScoringResult {
  const ingressos = parseNumber(client.ingressosMensualsNets);
  const fixes = parseNumber(client.despesesFixesMensuals);
  const variables = parseNumber(client.despesesVariablesMensuals);
  const estalviMensual = parseNumber(client.estalviMensual);
  const estalviLiquid = parseNumber(client.estalviLiquid);
  const patrimoniInvertit = parseNumber(client.patrimoniInvertit);
  const quotaDeutes = parseNumber(client.quotaMensualDeutes);
  const edat = parseNumber(client.edat);
  const horitzo = parseNumber(client.horitzoAnys);
  const perduaMax = parseNumber(client.perduaMaximaTolerable);
  const anysInvertint = parseNumber(client.anysInvertint);
  const importObjectiu = parseNumber(client.importObjectiu);
  const percentatgeEstalviInvertir = parseNumber(client.percentatgeEstalviInvertir, 0);

  const despesesTotals = fixes + variables;
  const excedentMensual = ingressos - despesesTotals - quotaDeutes;
  const taxaEstalvi = ingressos > 0 ? (estalviMensual / ingressos) * 100 : 0;
  const ratioDeuteIngressos = ingressos > 0 ? (quotaDeutes / ingressos) * 100 : 0;
  const fonsEmergenciaMesos = despesesTotals > 0 ? estalviLiquid / despesesTotals : 0;

  const capacitatLiquidity = subscoreByBands(fonsEmergenciaMesos, [
    { min: 9, score: 100 },
    { min: 6, score: 85 },
    { min: 3, score: 60 },
    { min: 0, score: 30 },
  ]);
  const capacitatDebt = subscoreByBands(-ratioDeuteIngressos, [
    { min: -10, score: 100 },
    { min: -25, score: 75 },
    { min: -40, score: 45 },
    { min: -100, score: 10 },
  ]);
  const capacitatSavings = subscoreByBands(taxaEstalvi, [
    { min: 30, score: 100 },
    { min: 20, score: 80 },
    { min: 10, score: 60 },
    { min: 5, score: 40 },
    { min: 0, score: 15 },
  ]);
  const excedentSobreIngressos = ingressos > 0 ? (excedentMensual / ingressos) * 100 : 0;
  const capacitatSurplus = subscoreByBands(excedentSobreIngressos, [
    { min: 30, score: 100 },
    { min: 20, score: 80 },
    { min: 10, score: 60 },
    { min: 0, score: 40 },
    { min: -99999999, score: 5 },
  ]);
  const capacitatAge = edat <= 35 ? 90 : edat <= 50 ? 75 : edat <= 65 ? 50 : 30;
  const capacitatInvestible = subscoreByBands(100 - percentatgeEstalviInvertir, [
    { min: 70, score: 95 },
    { min: 50, score: 80 },
    { min: 30, score: 65 },
    { min: 10, score: 45 },
    { min: -99999999, score: 25 },
  ]);

  const capacitat =
    capacitatLiquidity * 0.28 +
    capacitatDebt * 0.23 +
    capacitatSavings * 0.2 +
    capacitatSurplus * 0.14 +
    capacitatAge * 0.1 +
    capacitatInvestible * 0.05;

  const toleranciaDrop10 =
    client.reaccioCaiguda10 === "aportar_mes" ? 100 : client.reaccioCaiguda10 === "mantenir" ? 75 : client.reaccioCaiguda10 === "reduir_risc" ? 40 : 10;
  const toleranciaDrop25 =
    client.reaccioCaiguda25 === "aportar_mes" ? 100 : client.reaccioCaiguda25 === "mantenir" ? 70 : client.reaccioCaiguda25 === "reduir_risc" ? 35 : 5;
  const toleranciaLoss = subscoreByBands(perduaMax, [
    { min: 30, score: 100 },
    { min: 20, score: 80 },
    { min: 10, score: 55 },
    { min: 0, score: 25 },
  ]);
  const toleranciaTime =
    client.tempsAguantariaPerdues === "mes_2_anys" ? 100 : client.tempsAguantariaPerdues === "6_24_mesos" ? 75 : client.tempsAguantariaPerdues === "1_6_mesos" ? 45 : 20;
  const toleranciaMarket = client.mercatCau === "oportunitat" ? 100 : client.mercatCau === "mantenir" ? 75 : client.mercatCau === "reduir" ? 45 : 15;
  const toleranciaMomentum =
    client.inversioPujaRapid === "reequilibrar" ? 85 : client.inversioPujaRapid === "revisar" ? 70 : client.inversioPujaRapid === "mantenir" ? 55 : 40;

  const tolerancia =
    toleranciaDrop10 * 0.2 +
    toleranciaDrop25 * 0.25 +
    toleranciaLoss * 0.2 +
    toleranciaTime * 0.15 +
    toleranciaMarket * 0.1 +
    toleranciaMomentum * 0.1;

  const coneixementTeoric =
    client.coneixementFinancer === "alt" ? 95 : client.coneixementFinancer === "mitja" ? 75 : client.coneixementFinancer === "basic" ? 50 : 20;
  const coneixementExperiencia =
    client.experienciaInversora === "alta_volatilitat"
      ? 95
      : client.experienciaInversora === "fons_etfs"
      ? 75
      : client.experienciaInversora === "conservadors"
      ? 55
      : 20;
  const coneixementAny = subscoreByBands(anysInvertint, [
    { min: 7, score: 100 },
    { min: 3, score: 75 },
    { min: 1, score: 55 },
    { min: 0, score: 25 },
  ]);
  const coneixement = coneixementTeoric * 0.45 + coneixementExperiencia * 0.35 + coneixementAny * 0.2;

  const necessitatHoritzo = subscoreByBands(horitzo, [
    { min: 15, score: 100 },
    { min: 10, score: 80 },
    { min: 5, score: 60 },
    { min: 3, score: 40 },
    { min: 0, score: 20 },
  ]);
  const objectiuScore =
    client.objectiuPrincipal === "creixer_patrimoni"
      ? 80
      : client.objectiuPrincipal === "jubilacio"
      ? 70
      : client.objectiuPrincipal === "habitatge"
      ? 45
      : 35;
  const capitalProjectat = patrimoniInvertit + estalviMensual * 12 * Math.max(horitzo, 0);
  const gapRelatiu = importObjectiu > 0 ? (importObjectiu - capitalProjectat) / importObjectiu : 0;
  const necessitatRetorn = gapRelatiu <= 0 ? 20 : gapRelatiu <= 0.2 ? 45 : gapRelatiu <= 0.4 ? 65 : gapRelatiu <= 0.6 ? 80 : 95;
  const necessitatCompromis = subscoreByBands(percentatgeEstalviInvertir, [
    { min: 50, score: 90 },
    { min: 30, score: 75 },
    { min: 15, score: 60 },
    { min: 5, score: 45 },
    { min: 0, score: 30 },
  ]);

  const necessitat = necessitatHoritzo * 0.4 + necessitatRetorn * 0.35 + objectiuScore * 0.15 + necessitatCompromis * 0.1;

  const scoreFinal = Math.round(capacitat * 0.35 + tolerancia * 0.3 + necessitat * 0.25 + coneixement * 0.1);
  let perfilFinal = scoreToPerfil(scoreFinal);
  const alertes: string[] = [];

  if (fonsEmergenciaMesos < 3) {
    perfilFinal = applyPerfilCap(perfilFinal, "Moderat");
    alertes.push("Restricció prudencial: fons d’emergència inferior a 3 mesos (perfil màxim Moderat).");
  }
  if (ratioDeuteIngressos > 40 || excedentMensual <= 0) {
    perfilFinal = "Conservador";
    alertes.push("Restricció prudencial: endeutament elevat o excedent mensual nul/negatiu.");
  }
  if (horitzo < 3) {
    perfilFinal = "Conservador";
    alertes.push("Restricció prudencial: horitzó temporal inferior a 3 anys.");
  }
  if (coneixement < 30 && perfilFinal === "Agressiu") {
    perfilFinal = "Dinàmic";
    alertes.push("Restricció prudencial: coneixement inversor limitat per a perfil agressiu.");
  }
  if (edat >= 72) {
    perfilFinal = applyPerfilCap(perfilFinal, "Moderat");
    alertes.push("Restricció prudencial: edat avançada amb control de volatilitat (perfil màxim Moderat).");
  }

  const motius = [
    `capacitat de risc ${Math.round(capacitat) >= 70 ? "alta" : Math.round(capacitat) >= 45 ? "mitjana" : "baixa"}`,
    `tolerància al risc ${Math.round(tolerancia) >= 70 ? "alta" : Math.round(tolerancia) >= 45 ? "moderada" : "baixa"}`,
    `necessitat de risc ${Math.round(necessitat) >= 70 ? "alta" : Math.round(necessitat) >= 45 ? "moderada" : "baixa"}`,
    `coneixement financer ${Math.round(coneixement) >= 70 ? "sòlid" : Math.round(coneixement) >= 45 ? "intermedi" : "limitat"}`,
  ];

  return {
    row: client,
    scoreFinal,
    scoreCapacitat: Math.round(clamp(capacitat, 0, 100)),
    scoreTolerancia: Math.round(clamp(tolerancia, 0, 100)),
    scoreConeixement: Math.round(clamp(coneixement, 0, 100)),
    scoreHoritzo: Math.round(clamp(necessitat, 0, 100)),
    perfilFinal,
    confiança: clamp(97 - alertes.length * 3, 80, 99),
    motius,
    alertes,
    dimensions: {
      capacitat: Math.round(clamp(capacitat, 0, 100)),
      tolerancia: Math.round(clamp(tolerancia, 0, 100)),
      necessitat: Math.round(clamp(necessitat, 0, 100)),
      coneixement: Math.round(clamp(coneixement, 0, 100)),
    },
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
