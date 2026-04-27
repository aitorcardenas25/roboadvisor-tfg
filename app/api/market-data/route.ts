import { NextResponse } from "next/server";
import { PRODUCT_UNIVERSE } from "@/lib/portfolio";
import { getDailySeries } from "@/lib/marketData";

export async function GET() {
  try {
    const realProducts = PRODUCT_UNIVERSE.filter((p) => p.dataAvailable && p.tickerYahoo);
    const quotes = await Promise.all(
      realProducts.map(async (p) => {
        const quote = await getDailySeries(p.tickerYahoo!, 40, p.provider === "fmp" ? "fmp" : "yahoo");
        return {
          id: p.id,
          nom: p.nom,
          ticker: p.tickerYahoo,
          provider: quote.provider,
          lastPrice: quote.lastPrice,
          lastUpdate: quote.lastUpdate,
        };
      }),
    );

    return NextResponse.json({
      status: "ok",
      updatedAt: new Date().toISOString(),
      quotes,
      pendingValidation: PRODUCT_UNIVERSE.filter((p) => !p.dataAvailable).map((p) => p.nom),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "No s'han pogut obtenir dades de mercat",
      },
      { status: 502 },
    );
  }
}
