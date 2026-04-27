import { NextRequest, NextResponse } from "next/server";
import type { Perfil } from "@/lib/scoring";
import { buildBacktest } from "@/lib/backtest";

const VALID: Perfil[] = ["Conservador", "Moderat", "Dinàmic", "Agressiu"];

export async function GET(request: NextRequest) {
  const perfil = request.nextUrl.searchParams.get("perfil") as Perfil | null;
  if (!perfil || !VALID.includes(perfil)) {
    return NextResponse.json({ status: "error", message: "Perfil no vàlid" }, { status: 400 });
  }

  try {
    const data = await buildBacktest(perfil);
    return NextResponse.json({ status: "ok", ...data });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Error en càlcul de backtest" },
      { status: 502 },
    );
  }
}
