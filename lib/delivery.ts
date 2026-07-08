export const ORIGEN = { lat: -39.2833, lng: -71.9556 };

const ROTONDA_RADIO_KM = 2.5;
const RADIO_MAX_KM = 10;
const TARIFA_ROTONDAS = 1500;
const TARIFA_FUERA_BASE = 3000;
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

  if (dist <= ROTONDA_RADIO_KM) {
    return {
      disponible: true,
      distancia_km: distRedonda,
      fuera_de_rotondas: false,
      costo: TARIFA_ROTONDAS,
    };
  }

  const kmExtra = Math.ceil(dist - ROTONDA_RADIO_KM);
  const costo = TARIFA_FUERA_BASE + kmExtra * PRECIO_KM_EXTRA;
  return {
    disponible: true,
    distancia_km: distRedonda,
    fuera_de_rotondas: true,
    costo,
  };
}
