/**
 * Fetch a historical FX rate from the Frankfurter API (ECB rates, free, no key).
 * Returns the rate to convert 1 unit of `from` into JPY.
 * Frankfurter supports historical rates and falls back to the nearest business day.
 */
export async function getFxRateToJpy(
  fromCurrency: string,
  date: string
): Promise<{ rate: number; date: string }> {
  if (fromCurrency === "JPY") {
    return { rate: 1, date };
  }

  const url = `https://api.frankfurter.dev/v1/${date}?base=${fromCurrency}&symbols=JPY`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch FX rate: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    amount: number;
    base: string;
    date: string;
    rates: { JPY: number };
  };

  if (!data.rates?.JPY) {
    throw new Error(`No JPY rate returned for ${fromCurrency} on ${date}`);
  }

  return { rate: data.rates.JPY, date: data.date };
}
