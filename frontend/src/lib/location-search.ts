import { browserTimezone } from "@/lib/prayer";

export type LocationSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  countryCode: string | null;
  timezone: string;
};

type NominatimResult = {
  place_id?: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    country_code?: string;
  };
};

/**
 * City search via OpenStreetMap Nominatim — free, no API key.
 * Timezone is resolved via Open-Meteo (also free, no key) with a browser fallback.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=5`,
    {
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error("Location search failed. Please try again.");
  }

  const data = (await response.json()) as NominatimResult[];
  if (!Array.isArray(data) || data.length === 0) return [];

  const browserTz = browserTimezone();
  const suggestions = await Promise.all(
    data.map(async (item, index) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      const timezone =
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? await resolveTimezoneForCoordinates(latitude, longitude, browserTz, signal)
          : browserTz;

      return {
        id: String(item.place_id ?? `${latitude},${longitude},${index}`),
        label: item.display_name ?? trimmed,
        latitude,
        longitude,
        countryCode: item.address?.country_code?.toUpperCase() ?? null,
        timezone,
      } satisfies LocationSuggestion;
    }),
  );

  return suggestions.filter(
    (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
  );
}

async function resolveTimezoneForCoordinates(
  latitude: number,
  longitude: number,
  fallback: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
      `&longitude=${longitude}&current=temperature_2m&timezone=auto`;
    const response = await fetch(url, { signal });
    if (!response.ok) return fallback;
    const payload = (await response.json()) as { timezone?: string };
    if (payload.timezone && payload.timezone.includes("/")) {
      return payload.timezone;
    }
  } catch {
    // Network / abort — fall through to browser timezone.
  }
  return fallback;
}
