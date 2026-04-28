export type PricePoint = { date: string; close: number };
export type QuoteData = { ticker: string; series: PricePoint[]; lastPrice: number | null; lastUpdate: string | null; provider: string };
export type QuoteResult =
  | { ok: true; data: QuoteData; warnings: string[] }
  | { ok: false; ticker: string; errors: string[]; missingKeys: string[] };

type CacheValue = { expiry: number; value: QuoteData };
const DAY_MS = 24 * 60 * 60 * 1000;
const memCache = new Map<string, CacheValue>();

function buildKey(ticker: string, days: number) {
  return `${ticker}:${days}`;
}

async function fetchYahoo(ticker: string, days: number): Promise<QuoteData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${Math.max(5, days)}d&interval=1d&events=history`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
  const json = await response.json();
  const result = json?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp || [];
  const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close || [];
  const series = timestamps
    .map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] }))
    .filter((x): x is { date: string; close: number } => typeof x.close === "number" && Number.isFinite(x.close));
  if (!series.length) throw new Error(`No series for ${ticker}`);
  return {
    ticker,
    series,
    lastPrice: series[series.length - 1]?.close ?? null,
    lastUpdate: series[series.length - 1]?.date ?? null,
    provider: "yahoo",
  };
}

async function fetchFmp(ticker: string, days: number): Promise<QuoteData> {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY not configured");
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(ticker)}?timeseries=${days}&apikey=${key}`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`FMP HTTP ${response.status}`);
  const data = await response.json();
  const series = (data?.historical || [])
    .map((item: { date: string; close: number }) => ({ date: item.date, close: item.close }))
    .filter((x: { close: number }) => typeof x.close === "number")
    .sort((a: PricePoint, b: PricePoint) => a.date.localeCompare(b.date));
  if (!series.length) throw new Error(`No FMP data for ${ticker}`);
  return {
    ticker,
    series,
    lastPrice: series[series.length - 1]?.close ?? null,
    lastUpdate: series[series.length - 1]?.date ?? null,
    provider: "fmp",
  };
}

async function fetchAlphaVantage(ticker: string): Promise<QuoteData> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY not configured");
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(ticker)}&outputsize=full&apikey=${key}`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`Alpha Vantage HTTP ${response.status}`);
  const data = await response.json();
  const raw = data?.["Time Series (Daily)"] || {};
  const series = Object.entries(raw)
    .map(([date, value]) => ({ date, close: Number((value as { "4. close": string })["4. close"]) }))
    .filter((x) => Number.isFinite(x.close))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!series.length) throw new Error(`No AlphaVantage data for ${ticker}`);
  return {
    ticker,
    series,
    lastPrice: series[series.length - 1]?.close ?? null,
    lastUpdate: series[series.length - 1]?.date ?? null,
    provider: "alpha-vantage",
  };
}

export async function getDailySeries(ticker: string, days = 756, preferredProvider?: "yahoo" | "fmp" | "alpha-vantage") {
  const key = buildKey(ticker, days);
  const cached = memCache.get(key);
  const now = Date.now();
  if (cached && cached.expiry > now) return cached.value;

  const providers: Array<() => Promise<QuoteData>> = [];
  if (preferredProvider === "fmp") providers.push(() => fetchFmp(ticker, days));
  if (preferredProvider === "alpha-vantage") providers.push(() => fetchAlphaVantage(ticker));
  providers.push(() => fetchYahoo(ticker, days));
  if (preferredProvider !== "fmp") providers.push(() => fetchFmp(ticker, days));
  if (preferredProvider !== "alpha-vantage") providers.push(() => fetchAlphaVantage(ticker));

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const value = await provider();
      memCache.set(key, { value, expiry: now + DAY_MS });
      return value;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(`No data provider available for ${ticker}. Errors: ${errors.join(" | ")}`);
}

export async function getDailySeriesSafe(ticker: string, days = 756, preferredProvider?: "yahoo" | "fmp" | "alpha-vantage"): Promise<QuoteResult> {
  const errors: string[] = [];
  const missingKeys: string[] = [];
  try {
    const data = await getDailySeries(ticker, days, preferredProvider);
    return { ok: true, data, warnings: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    if (message.includes("FMP_API_KEY")) missingKeys.push("FMP_API_KEY");
    if (message.includes("ALPHA_VANTAGE_API_KEY")) missingKeys.push("ALPHA_VANTAGE_API_KEY");
    return { ok: false, ticker, errors, missingKeys };
  }
}
