import type { Perfil } from "@/lib/scoring";

export type CarteraModel = {
  rendaVariable: number;
  rendaFixa: number;
  liquiditat: number;
  alternatius: number;
};

export type UniverseProduct = {
  id: string;
  nom: string;
  isin: string;
  tickerOrientatiu: string;
  tickerYahoo?: string;
  tickerFMP?: string;
  benchmarkTicker?: string;
  gestora?: string;
  categoria: string;
  tipus: string;
  gestio?: "Activa" | "Indexada" | "Passiva";
  risc: "Baix" | "Mitjà" | "Alt" | "Molt alt";
  perfils: Perfil[];
  rol: "Core" | "Satellite" | "Thematic/high risk" | "Income/dividend" | "Defensive/liquidity";
  blocActiu: "Renda variable" | "Renda fixa" | "Liquiditat" | "Alternatius";
  currency: string;
  exchange: string;
  provider: "yahoo" | "fmp" | "alpha-vantage" | "manual";
  dataAvailable: boolean;
  dataStatus: "validated" | "pending" | "no_data";
  lastPrice?: number | null;
  lastUpdate?: string | null;
  ongoingCost?: number | null;
};

export type ProducteCartera = {
  id: string;
  nom: string;
  isin: string;
  tickerOrientatiu: string;
  tickerYahoo?: string;
  tickerFMP?: string;
  gestora?: string;
  categoria: string;
  tipus: string;
  gestio: "Activa" | "Indexada" | "Passiva";
  risc: string;
  perfilRecomanat: string;
  rol: string;
  blocActiu: string;
  benchmarkRef: string;
  terAnual?: number | null;
  percentatge: number;
  criteri: string;
  justificacio: string;
  dataAvailable: boolean;
  dataStatus: "validated" | "pending" | "no_data";
  lastUpdate?: string | null;
};

export const PRODUCT_UNIVERSE: UniverseProduct[] = [
  { id: "world-core", nom: "iShares MSCI ACWI UCITS ETF", isin: "IE00B6R52259", tickerOrientatiu: "MSCI ACWI", tickerYahoo: "SSAC.L", tickerFMP: "SSAC.L", benchmarkTicker: "ACWI", categoria: "Global Equity", tipus: "ETF indexat", gestio: "Indexada", risc: "Mitjà", perfils: ["Conservador", "Moderat", "Dinàmic", "Agressiu"], rol: "Core", blocActiu: "Renda variable", currency: "USD", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.2 },
  { id: "aggh", nom: "iShares Core Global Aggregate Bond UCITS ETF EUR Hedged", isin: "IE00BDBRDM35", tickerOrientatiu: "AGGH", tickerYahoo: "AGGH.L", tickerFMP: "AGGH.L", benchmarkTicker: "AGGH.L", categoria: "Global Bonds", tipus: "ETF indexat", gestio: "Indexada", risc: "Baix", perfils: ["Conservador", "Moderat", "Dinàmic", "Agressiu"], rol: "Defensive/liquidity", blocActiu: "Renda fixa", currency: "EUR", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.1 },
  { id: "ibgs", nom: "iShares € Govt Bond 1-3yr UCITS ETF", isin: "IE00B3VTMJ91", tickerOrientatiu: "IBGS", tickerYahoo: "IBGS.L", tickerFMP: "IBGS.L", benchmarkTicker: "IBGS.L", categoria: "Government Bonds", tipus: "ETF indexat", gestio: "Indexada", risc: "Baix", perfils: ["Conservador", "Moderat"], rol: "Defensive/liquidity", blocActiu: "Renda fixa", currency: "EUR", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.15 },
  { id: "cash", nom: "Invesco Euro Cash 3 Months UCITS ETF", isin: "IE00B3BPCH51", tickerOrientatiu: "CSH2", tickerYahoo: "CSH2.L", tickerFMP: "CSH2.L", benchmarkTicker: "CSH2.L", categoria: "Liquidity", tipus: "ETF monetari", risc: "Baix", perfils: ["Conservador", "Moderat", "Dinàmic", "Agressiu"], rol: "Defensive/liquidity", blocActiu: "Liquiditat", currency: "EUR", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.1 },
  { id: "reits", nom: "iShares Developed Markets Property Yield", isin: "IE00B1FZS350", tickerOrientatiu: "IWDP", tickerYahoo: "IWDP.L", tickerFMP: "IWDP.L", benchmarkTicker: "IWDP.L", categoria: "Real Estate", tipus: "ETF", risc: "Mitjà", perfils: ["Moderat", "Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Alternatius", currency: "USD", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.59 },
  { id: "small-global-vg", nom: "Vanguard Global Small-Cap Index", isin: "IE00B42W4L06", tickerOrientatiu: "Vanguard Small Cap", tickerYahoo: "0P0000XVMX.F", tickerFMP: "VSGAX", categoria: "Global Small Caps", tipus: "Fons indexat", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable", currency: "EUR", exchange: "FUND", provider: "yahoo", dataAvailable: false, dataStatus: "pending", ongoingCost: 0.29 },
  { id: "em-vg", nom: "Vanguard Emerging Markets", isin: "IE0031786696", tickerOrientatiu: "Vanguard EM", tickerYahoo: "VFEM.L", tickerFMP: "VFEM.L", benchmarkTicker: "EEM", categoria: "Mercats emergents", tipus: "ETF indexat", risc: "Alt", perfils: ["Moderat", "Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable", currency: "USD", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.22 },
  { id: "nasdaq-my", nom: "Invesco EQQQ Nasdaq-100 UCITS", isin: "IE0032077012", tickerOrientatiu: "Nasdaq-100", tickerYahoo: "EQQQ.L", tickerFMP: "EQQQ.L", benchmarkTicker: "QQQ", categoria: "NASDAQ 100", tipus: "ETF indexat", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable", currency: "USD", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.3 },
  { id: "ai-polar", nom: "Polar Capital Artificial Intelligence", isin: "IE00BF0GL329", tickerOrientatiu: "Polar AI", categoria: "Tecnologia i IA", tipus: "Fons actiu", risc: "Molt alt", perfils: ["Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable", currency: "EUR", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "no_data", ongoingCost: 1.15 },
  { id: "energy-bgf", nom: "BlackRock World Energy Fund", isin: "LU0252963896", tickerOrientatiu: "BGF World Energy", categoria: "Energia", tipus: "Fons actiu", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable", currency: "EUR", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "no_data", ongoingCost: 1.02 },
  { id: "div-jpm", nom: "JPM Global Dividend", isin: "LU0714179727", tickerOrientatiu: "JPM Global Dividend", categoria: "Dividends", tipus: "Fons actiu", risc: "Mitjà", perfils: ["Conservador", "Dinàmic"], rol: "Income/dividend", blocActiu: "Renda variable", currency: "EUR", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "no_data", ongoingCost: 0.95 },
  { id: "div-vg", nom: "Vanguard FTSE All-World High Dividend", isin: "IE00B8GKDB10", tickerOrientatiu: "VHYL", tickerYahoo: "VHYL.L", tickerFMP: "VHYL.L", benchmarkTicker: "VHYL.L", categoria: "Dividends", tipus: "ETF", risc: "Mitjà", perfils: ["Moderat", "Dinàmic"], rol: "Income/dividend", blocActiu: "Renda variable", currency: "USD", exchange: "LSE", provider: "yahoo", dataAvailable: true, dataStatus: "validated", ongoingCost: 0.29 },
  { id: "fund-global-equity", nom: "Vanguard Global Stock Index Fund Investor EUR", isin: "IE00B03HD191", tickerOrientatiu: "Vanguard Global Stock Fund", tickerYahoo: "0P0000YENP.F", gestora: "Vanguard", categoria: "Global Equity", tipus: "Fons indexat", risc: "Mitjà", perfils: ["Moderat", "Dinàmic", "Agressiu"], rol: "Core", blocActiu: "Renda variable", currency: "EUR", exchange: "FUND", provider: "yahoo", dataAvailable: false, dataStatus: "pending", ongoingCost: 0.18 },
  { id: "fund-global-bond", nom: "PIMCO GIS Global Bond Fund", isin: "IE00B11XZ103", tickerOrientatiu: "PIMCO Global Bond", gestora: "PIMCO", categoria: "Global Bonds", tipus: "Fons actiu", risc: "Baix", perfils: ["Conservador", "Moderat"], rol: "Defensive/liquidity", blocActiu: "Renda fixa", currency: "EUR", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "pending", ongoingCost: 0.55 },
  { id: "fund-short-bond", nom: "JPM Euro Short Duration Bond Fund", isin: "LU0159052710", tickerOrientatiu: "JPM Short Duration Bond", gestora: "J.P. Morgan AM", categoria: "Government Bonds", tipus: "Fons actiu", risc: "Baix", perfils: ["Conservador", "Moderat"], rol: "Defensive/liquidity", blocActiu: "Renda fixa", currency: "EUR", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "pending", ongoingCost: 0.45 },
  { id: "fund-emerging", nom: "Fidelity Emerging Markets Fund", isin: "LU0048575426", tickerOrientatiu: "Fidelity EM Fund", gestora: "Fidelity", categoria: "Mercats emergents", tipus: "Fons actiu", risc: "Alt", perfils: ["Moderat", "Dinàmic", "Agressiu"], rol: "Satellite", blocActiu: "Renda variable", currency: "USD", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "pending", ongoingCost: 0.95 },
  { id: "fund-tech", nom: "BlackRock Global Funds World Technology", isin: "LU0171310443", tickerOrientatiu: "BGF World Technology", gestora: "BlackRock", categoria: "Tecnologia global", tipus: "Fons actiu", risc: "Alt", perfils: ["Dinàmic", "Agressiu"], rol: "Thematic/high risk", blocActiu: "Renda variable", currency: "USD", exchange: "FUND", provider: "manual", dataAvailable: false, dataStatus: "no_data", ongoingCost: 1.2 },
];

export const PROFILE_SELECTION: Record<Perfil, Array<{ id: string; percentatge: number; criteri: string; justificacio: string }>> = {
  Conservador: [
    { id: "cash", percentatge: 18, criteri: "Reserva de liquiditat", justificacio: "Cobertura d’imprevistos i reducció del risc de venda forçada." },
    { id: "fund-short-bond", percentatge: 37, criteri: "Defensa de curta durada", justificacio: "Fons de durada curta amb enfocament defensiu." },
    { id: "fund-global-bond", percentatge: 30, criteri: "Estabilització global", justificacio: "Nucli principal de renda fixa mitjançant fons d’inversió." },
    { id: "fund-global-equity", percentatge: 10, criteri: "Renda variable mínima", justificacio: "Exposició global limitada per preservar capital." },
    { id: "div-jpm", percentatge: 5, criteri: "Income prudent", justificacio: "Petit complement de rendes en perfil conservador." },
  ],
  Moderat: [
    { id: "fund-global-equity", percentatge: 33, criteri: "Nucli global", justificacio: "Fons global diversificat com a motor principal de creixement." },
    { id: "fund-global-bond", percentatge: 30, criteri: "Estabilització", justificacio: "Redueix la volatilitat total de cartera amb renda fixa global." },
    { id: "fund-short-bond", percentatge: 15, criteri: "Durada curta", justificacio: "Amortidor en entorns de tipus d’interès." },
    { id: "fund-emerging", percentatge: 8, criteri: "Creixement emergent", justificacio: "Potencial estructural amb pes limitat." },
    { id: "div-vg", percentatge: 6, criteri: "Income", justificacio: "Component de dividends per estabilitzar retorns." },
    { id: "cash", percentatge: 5, criteri: "Liquiditat tàctica", justificacio: "Marge per reequilibris." },
    { id: "reits", percentatge: 3, criteri: "Diversificació real asset", justificacio: "Petit satèl·lit immobiliari." },
  ],
  Dinàmic: [
    { id: "fund-global-equity", percentatge: 38, criteri: "Core global", justificacio: "Base principal de renda variable global amb fons indexat." },
    { id: "fund-emerging", percentatge: 14, criteri: "Emergents", justificacio: "Creixement addicional a llarg termini." },
    { id: "small-global-vg", percentatge: 12, criteri: "Small caps", justificacio: "Prima de mida i diversificació." },
    { id: "nasdaq-my", percentatge: 10, criteri: "Tecnologia moderada", justificacio: "Exposició tecnològica controlada." },
    { id: "fund-global-bond", percentatge: 10, criteri: "Control de risc", justificacio: "Bloc de renda fixa reduït però estabilitzador." },
    { id: "reits", percentatge: 5, criteri: "Alternatiu líquid", justificacio: "Diversificació de fonts de retorn." },
    { id: "div-jpm", percentatge: 5, criteri: "Income quality", justificacio: "Empreses madures amb dividends." },
    { id: "cash", percentatge: 6, criteri: "Gestió tàctica", justificacio: "Reserva per reequilibris i oportunitats." },
  ],
  Agressiu: [
    { id: "fund-global-equity", percentatge: 32, criteri: "Core global", justificacio: "Base principal amb elevada exposició a creixement global." },
    { id: "fund-emerging", percentatge: 16, criteri: "Emergents", justificacio: "Potencial elevat amb volatilitat superior." },
    { id: "small-global-vg", percentatge: 14, criteri: "Small caps", justificacio: "Més beta i potencial de llarg termini." },
    { id: "nasdaq-my", percentatge: 12, criteri: "Tecnologia", justificacio: "Exposició forta a tecnologia nord-americana." },
    { id: "fund-tech", percentatge: 10, criteri: "IA/tecnologia", justificacio: "Satèl·lit d’alt risc per disrupció." },
    { id: "energy-bgf", percentatge: 8, criteri: "Sectorial energia", justificacio: "Satèl·lit cíclic per diversificar drivers de retorn." },
    { id: "fund-global-bond", percentatge: 5, criteri: "Renda fixa residual", justificacio: "Mínim coixí defensiu." },
    { id: "cash", percentatge: 3, criteri: "Liquiditat mínima", justificacio: "Reserva operativa bàsica." },
  ],
};

export function carteraPerPerfil(perfil: Perfil): CarteraModel {
  if (perfil === "Conservador") return { rendaVariable: 20, rendaFixa: 65, liquiditat: 10, alternatius: 5 };
  if (perfil === "Moderat") return { rendaVariable: 45, rendaFixa: 45, liquiditat: 5, alternatius: 5 };
  if (perfil === "Dinàmic") return { rendaVariable: 70, rendaFixa: 20, liquiditat: 5, alternatius: 5 };
  return { rendaVariable: 90, rendaFixa: 5, liquiditat: 0, alternatius: 5 };
}

export function benchmarkPerCategoria(categoria: string) {
  if (categoria.includes("Global Equity")) return "MSCI ACWI";
  if (categoria.includes("Global Bonds")) return "Bloomberg Global Aggregate Bond EUR Hedged";
  if (categoria.includes("Government Bonds")) return "Euro Govt 1-3Y";
  if (categoria.includes("Liquidity")) return "€STR";
  if (categoria.includes("Real Estate")) return "FTSE EPRA/NAREIT";
  if (categoria.includes("Small Caps")) return "MSCI World Small Cap";
  if (categoria.includes("emergents") || categoria.includes("Mercats emergents")) return "MSCI Emerging Markets";
  if (categoria.includes("NASDAQ")) return "NASDAQ-100";
  if (categoria.includes("Tecnologia")) return "MSCI World Information Technology";
  if (categoria.includes("Energia")) return "MSCI World Energy";
  if (categoria.includes("Dividends")) return "MSCI World High Dividend Yield";
  return "Benchmark sectorial equivalent";
}

export function gestioPerTipus(producte: UniverseProduct): "Activa" | "Indexada" | "Passiva" {
  if (producte.gestio) return producte.gestio;
  if (producte.tipus.toLowerCase().includes("index")) return "Indexada";
  if (producte.tipus.toLowerCase().includes("etf")) return "Passiva";
  return "Activa";
}

export function productesPerPerfil(perfil: Perfil): ProducteCartera[] {
  const picks = PROFILE_SELECTION[perfil];
  return picks.slice(0, 8).map((pick) => {
    const producte = PRODUCT_UNIVERSE.find((x) => x.id === pick.id);
    if (!producte) throw new Error(`Producte no trobat: ${pick.id}`);
    return {
      id: producte.id,
      nom: producte.nom,
      isin: producte.isin,
      tickerOrientatiu: producte.tickerOrientatiu,
      tickerYahoo: producte.tickerYahoo,
      tickerFMP: producte.tickerFMP,
      gestora: producte.gestora,
      categoria: producte.categoria,
      tipus: producte.tipus,
      gestio: gestioPerTipus(producte),
      risc: producte.risc,
      perfilRecomanat: producte.perfils.join(", "),
      rol: producte.rol,
      blocActiu: producte.blocActiu,
      benchmarkRef: benchmarkPerCategoria(producte.categoria),
      terAnual: producte.ongoingCost ?? null,
      percentatge: pick.percentatge,
      criteri: pick.criteri,
      justificacio: pick.justificacio,
      dataAvailable: producte.dataAvailable,
      dataStatus: producte.dataStatus,
      lastUpdate: producte.lastUpdate,
    } satisfies ProducteCartera;
  });
}

export function benchmarkPerPerfil(perfil: Perfil) {
  if (perfil === "Conservador") {
    return [
      { component: "Global Aggregate Bond EUR Hedged", ticker: "AGGH.L", pes: 55, rationale: "Nucli defensiu renda fixa global coberta" },
      { component: "Euro Govt 1-3y", ticker: "IBGS.L", pes: 25, rationale: "Control de durada i volatilitat" },
      { component: "MSCI ACWI", ticker: "ACWI", pes: 15, rationale: "Exposició global a renda variable" },
      { component: "Cash EUR", ticker: "CSH2.L", pes: 5, rationale: "Liquiditat i estabilitat" },
    ];
  }
  if (perfil === "Moderat") {
    return [
      { component: "MSCI ACWI", ticker: "ACWI", pes: 45, rationale: "Motor de creixement" },
      { component: "Global Aggregate Bond EUR Hedged", ticker: "AGGH.L", pes: 40, rationale: "Estabilitzador" },
      { component: "Euro Govt 1-3y", ticker: "IBGS.L", pes: 10, rationale: "Defensa curt termini" },
      { component: "Global REIT", ticker: "REET", pes: 5, rationale: "Diversificació real assets" },
    ];
  }
  if (perfil === "Dinàmic") {
    return [
      { component: "MSCI ACWI", ticker: "ACWI", pes: 60, rationale: "Core global" },
      { component: "MSCI EM", ticker: "EEM", pes: 12, rationale: "Prima de creixement emergent" },
      { component: "MSCI World Small Cap", ticker: "IUSN.L", pes: 8, rationale: "Exposició small caps" },
      { component: "Global Aggregate Bond EUR Hedged", ticker: "AGGH.L", pes: 15, rationale: "Control parcial de risc" },
      { component: "Global REIT", ticker: "REET", pes: 5, rationale: "Diversificació" },
    ];
  }
  return [
    { component: "MSCI ACWI", ticker: "ACWI", pes: 55, rationale: "Base global de renda variable" },
    { component: "NASDAQ 100", ticker: "QQQ", pes: 15, rationale: "Biaix creixement/tecnologia" },
    { component: "MSCI EM", ticker: "EEM", pes: 12, rationale: "Emergents" },
    { component: "MSCI World Small Cap", ticker: "IUSN.L", pes: 10, rationale: "Small caps" },
    { component: "Global Aggregate Bond EUR Hedged", ticker: "AGGH.L", pes: 8, rationale: "Petita part defensiva" },
  ];
}
