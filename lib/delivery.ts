export const ORIGEN = { lat: -39.2833, lng: -71.9556 };

// El centro de Pucon (tarifa base $1.500) es la franja urbana delimitada por
// las rotondas: Rotonda Poniente / Costanera (-71.9791) al oeste, Rotonda
// Matus / Camino Internacional (-71.9496) al este y la rotonda del acceso
// sur (-39.2912). Coordenadas tomadas de OpenStreetMap.
const CENTRO = {
  latMin: -39.2912, // rotonda acceso sur (Miguel Astroza)
  latMax: -39.2680, // costanera / lago
  lngMin: -71.9791, // Rotonda Poniente
  lngMax: -71.9496, // Rotonda Matus
};

const RADIO_MAX_KM = 10;
const TARIFA_CENTRO = 1500;
const TARIFA_FUERA_BASE = 3000;
const KM_BASE_FUERA = 2.5;
const PRECIO_KM_EXTRA = 300;

export function distanciaHaversine(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function dentroDelCentro(lat: number, lng: number): boolean {
  return (
    lat >= CENTRO.latMin && lat <= CENTRO.latMax &&
    lng >= CENTRO.lngMin && lng <= CENTRO.lngMax
  );
}

export type DeliveryResult = {
  disponible: boolean;
  distancia_km: number;
  fuera_de_rotondas: boolean;
  costo: number;
  mensaje?: string;
};

export function calcularDelivery(lat: number, lng: number): DeliveryResult {
  const dist = distanciaHaversine(ORIGEN.lat, ORIGEN.lng, lat, lng);
  const distRedonda = Math.round(dist * 10) / 10;

  if (dist > RADIO_MAX_KM) {
    return {
      disponible: false,
      distancia_km: distRedonda,
      fuera_de_rotondas: true,
      costo: 0,
      mensaje: "Estás a " + distRedonda + " km. Nuestro radio máximo es " + RADIO_MAX_KM + " km.",
    };
  }

  if (dentroDelCentro(lat, lng)) {
    return {
      disponible: true,
      distancia_km: distRedonda,
      fuera_de_rotondas: false,
      costo: TARIFA_CENTRO,
    };
  }

  // Fuera de las rotondas la tarifa parte en $3.000 aunque la distancia sea
  // corta, y suma $300 por cada km sobre los 2,5 km.
  const kmExtra = Math.max(0, Math.ceil(dist - KM_BASE_FUERA));
  const costo = TARIFA_FUERA_BASE + kmExtra * PRECIO_KM_EXTRA;
  return {
    disponible: true,
    distancia_km: distRedonda,
    fuera_de_rotondas: true,
    costo,
  };
}
