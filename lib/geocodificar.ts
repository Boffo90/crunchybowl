// Geocodificacion gratuita con Nominatim (OpenStreetMap). SOLO USO EN SERVIDOR.
// Politica de uso: incluir User-Agent identificable y volumen bajo (1 req/s).

export type ResultadoGeo = {
  lat: number;
  lng: number;
  direccion: string;
};

export async function geocodificarDireccion(consulta: string): Promise<ResultadoGeo | null> {
  const limpia = consulta.trim();
  if (!limpia) return null;

  // Sesgar la busqueda a Pucon si el cliente no lo escribio.
  const q = /puc[oó]n/i.test(limpia) ? limpia : `${limpia}, Pucón, Chile`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "cl");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CrunchyBowl/1.0 (https://www.crunchybowl.cl)" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
    const r = data?.[0];
    if (!r?.lat || !r?.lon) return null;
    return {
      lat: Number(r.lat),
      lng: Number(r.lon),
      direccion: r.display_name ?? limpia,
    };
  } catch {
    return null;
  }
}
