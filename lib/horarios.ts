export type HorariosConfig = {
  lun: [number, number]; mar: [number, number]; mie: [number, number];
  jue: [number, number]; vie: [number, number]; sab: [number, number];
  dom: [number, number];
};

export const HORARIOS_DEFAULT: HorariosConfig = {
  lun: [720, 1200], mar: [720, 1200], mie: [720, 1200],
  jue: [720, 1200], vie: [720, 1200],
  sab: [720, 1320], dom: [720, 1320],
};

export const DIAS: (keyof HorariosConfig)[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

export const DIA_LABEL: Record<keyof HorariosConfig, string> = {
  lun: "Lunes", mar: "Martes", mie: "Miércoles", jue: "Jueves",
  vie: "Viernes", sab: "Sábado", dom: "Domingo",
};

// El servidor (Vercel) corre en UTC: siempre calcular "ahora" en hora de Chile.
export function ahoraEnChile(): { dia: keyof HorariosConfig; minutos: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, keyof HorariosConfig> = {
    Sun: "dom", Mon: "lun", Tue: "mar", Wed: "mie", Thu: "jue", Fri: "vie", Sat: "sab",
  };
  const dia = weekdayMap[get("weekday")] ?? "lun";
  // "24" puede aparecer para medianoche con hourCycle h24 en algunos runtimes
  const hora = Number(get("hour")) % 24;
  const minutos = hora * 60 + Number(get("minute"));
  return { dia, minutos };
}

// Valida y normaliza el value guardado en la tabla configuracion (key=horarios).
export function parseHorarios(value: unknown): HorariosConfig {
  if (!value || typeof value !== "object") return HORARIOS_DEFAULT;
  const v = value as Record<string, unknown>;
  const out = { ...HORARIOS_DEFAULT };
  for (const dia of DIAS) {
    const par = v[dia];
    if (
      Array.isArray(par) && par.length === 2 &&
      typeof par[0] === "number" && typeof par[1] === "number" &&
      par[0] >= 0 && par[1] <= 1440 && par[0] < par[1]
    ) {
      out[dia] = [par[0], par[1]];
    }
  }
  return out;
}

export function estaAbiertoAhora(config: HorariosConfig = HORARIOS_DEFAULT): boolean {
  const { dia, minutos } = ahoraEnChile();
  const [apertura, cierre] = config[dia];
  return minutos >= apertura && minutos < cierre;
}

export function minutosAHora(min: number): string {
  return Math.floor(min / 60).toString().padStart(2, "0") + ":" + (min % 60).toString().padStart(2, "0");
}

export function proximaApertura(config: HorariosConfig = HORARIOS_DEFAULT): string {
  const { dia, minutos } = ahoraEnChile();
  const diaIdx = DIAS.indexOf(dia);

  for (let i = 0; i < 7; i++) {
    const d = DIAS[(diaIdx + i) % 7];
    const [apertura, cierre] = config[d];
    const min = i === 0 ? minutos : 0;
    if (min < apertura) {
      const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : "el " + DIA_LABEL[d].toLowerCase();
      return cuando + " a las " + minutosAHora(apertura);
    }
    if (i === 0 && min < cierre) return "ahora";
  }
  return "próximamente";
}

// Rango de apertura/cierre de la proxima vez que este abierto (para reservas).
export function proximaVentana(config: HorariosConfig = HORARIOS_DEFAULT): { dia: string; apertura: string; cierre: string } {
  const { dia, minutos } = ahoraEnChile();
  const diaIdx = DIAS.indexOf(dia);

  for (let i = 0; i < 7; i++) {
    const d = DIAS[(diaIdx + i) % 7];
    const [apertura, cierre] = config[d];
    const min = i === 0 ? minutos : 0;
    if (min < cierre) {
      const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : DIA_LABEL[d].toLowerCase();
      return { dia: cuando, apertura: minutosAHora(Math.max(apertura, min > apertura ? min : apertura)), cierre: minutosAHora(cierre) };
    }
  }
  const [a, c] = config.lun;
  return { dia: "lunes", apertura: minutosAHora(a), cierre: minutosAHora(c) };
}

// Ventana horaria de un producto especifico (ej: Crunchy Lunch solo 12:00-14:00).
export type VentanaProducto = [number, number];

export function dentroDeVentana(ventana: VentanaProducto): boolean {
  const { minutos } = ahoraEnChile();
  return minutos >= ventana[0] && minutos < ventana[1];
}

export function formatoVentana(ventana: VentanaProducto): string {
  return minutosAHora(ventana[0]) + " a " + minutosAHora(ventana[1]);
}

export function parseVentanasProductos(value: unknown): Record<string, VentanaProducto> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, VentanaProducto> = {};
  for (const [slug, par] of Object.entries(value as Record<string, unknown>)) {
    if (
      Array.isArray(par) && par.length === 2 &&
      typeof par[0] === "number" && typeof par[1] === "number" &&
      par[0] >= 0 && par[1] <= 1440 && par[0] < par[1]
    ) {
      out[slug] = [par[0], par[1]];
    }
  }
  return out;
}

export function formatearHorarioSemanal(config: HorariosConfig = HORARIOS_DEFAULT): string {
  const [aLun, cLun] = config.lun;
  const [aSab, cSab] = config.sab;
  return `Lun a Vie ${minutosAHora(aLun)} - ${minutosAHora(cLun)} · Sáb y Dom ${minutosAHora(aSab)} - ${minutosAHora(cSab)}`;
}
