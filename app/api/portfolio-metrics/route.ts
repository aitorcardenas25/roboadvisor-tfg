import { NextRequest, NextResponse } from "next/server";
import type { Perfil } from "@/lib/scoring";
import { buildBacktest } from "@/lib/backtest";
import { simulateMonteCarloFromReturns } from "@/lib/monteCarlo";

const VALID: Perfil[] = ["Conservador", "Moderat", "Dinàmic", "Agressiu"];

export async function GET(request: NextRequest) {
  const perfil = request.nextUrl.searchParams.get("perfil") as Perfil | null;
  const horizon = Number(request.nextUrl.searchParams.get("horizon") || 10);
  const annualContribution = Number(request.nextUrl.searchParams.get("annualContribution") || 0);

  if (!perfil || !VALID.includes(perfil)) {
    return NextResponse.json({ status: "error", message: "Perfil no vàlid" }, { status: 400 });
  }

  try {
    const backtest = await buildBacktest(perfil);
    const returns = backtest.data.slice(1).map((row, idx) => row.cartera / backtest.data[idx].cartera - 1);
    const mc = simulateMonteCarloFromReturns({
      returns,
      years: horizon,
      initial: 10000,
      yearlyContribution: annualContribution,
      trials: 2500,
    });

    return NextResponse.json({
      status: "ok",
      updatedAt: backtest.updatedAt,
      monteCarlo: {
        trajectoria: mc.trajectoria,
        percentils: { p10: Math.round(mc.p10), p50: Math.round(mc.p50), p90: Math.round(mc.p90) },
        params: { rendibilitatAnual: mc.mu * 100, volatilitatAnual: mc.sigma * 100 },
      },
      riskReturn: backtest.riskReturn,
      correlations: backtest.correlations,
      riskContribution: backtest.riskContribution,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Error en mètriques de cartera" },
      { status: 502 },
    );
  }
}
