import { NextResponse } from "next/server";
import { PRODUCT_UNIVERSE } from "@/lib/portfolio";
import { getDailySeriesSafe } from "@/lib/marketData";

export async function GET() {
  const withTicker = PRODUCT_UNIVERSE.filter((p) => p.tickerYahoo || p.tickerFMP);
  const quotes = await Promise.all(
    withTicker.map(async (p) => {
      const preferred = p.provider === "fmp" ? "fmp" : "yahoo";
      const ticker = p.tickerYahoo || p.tickerFMP!;
      const result = await getDailySeriesSafe(ticker, 40, preferred);
      if (result.ok) {
        return {
          id: p.id,
          nom: p.nom,
          tickerYahoo: p.tickerYahoo || null,
          tickerFMP: p.tickerFMP || null,
          dataAvailable: true,
          dataStatus: "validated",
          provider: result.data.provider,
          lastPrice: result.data.lastPrice,
          lastUpdate: result.data.lastUpdate,
          message: null,
        };
      }
      return {
        id: p.id,
        nom: p.nom,
        tickerYahoo: p.tickerYahoo || null,
        tickerFMP: p.tickerFMP || null,
        dataAvailable: false,
        dataStatus: p.dataStatus === "pending" ? "pending" : "unavailable",
        provider: null,
        lastPrice: null,
        lastUpdate: null,
        message: result.missingKeys.length
          ? `Connexió incompleta: falten claus API (${result.missingKeys.join(", ")})`
          : "Sense dades disponibles amb els proveïdors configurats.",
      };
    }),
  );

  const missingKeys = [...new Set(quotes.flatMap((q) => (q.message?.includes("claus API") ? q.message.match(/FMP_API_KEY|ALPHA_VANTAGE_API_KEY/g) || [] : [])))];

  return NextResponse.json({
    status: "ok",
    updatedAt: new Date().toISOString(),
    quotes,
    missingApiKeys: missingKeys,
    providerNotice:
      missingKeys.length > 0
        ? `Dades parcials: falta configurar ${missingKeys.join(", ")}. L'app continua operativa i marca aquests productes com pendents.`
        : "Dades obtingudes dels proveïdors disponibles.",
    pendingValidation: PRODUCT_UNIVERSE.filter((p) => !p.dataAvailable).map((p) => p.nom),
  });
}
