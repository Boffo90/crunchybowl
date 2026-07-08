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

const DIAS: (keyof HorariosConfig)[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

export function estaAbiertoAhora(config: HorariosConfig = HORARIOS_DEFAULT): boolean {
  const ahora = new Date();
  const dia = DIAS[ahora.getDay()];
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const [apertura, cierre] = config[dia];
  return minutos >= apertura && minutos < cierre;
}

export function formatearHorarioSemanal(config: HorariosConfig = HORARIOS_DEFAULT): string {
  const fmt = (min: number) =>
    Math.floor(min / 60).toString().padStart(2, "0") + ":" + (min % 60).toString().padStart(2, "0");
  const [aLun, cLun] = config.lun;
  const [aSab, cSab] = config.sab;
  return `Lun a Vie ${fmt(aLun)} - ${fmt(cLun)} · Sáb y Dom ${fmt(aSab)} - ${fmt(cSab)}`;
}

export function proximaApertura(config: HorariosConfig = HORARIOS_DEFAULT): string {
  const ahora = new Date();
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(ahora.getDate() + i);
    const dia = DIAS[fecha.getDay()];
    const [apertura, cierre] = config[dia];
    const minutos = i === 0 ? ahora.getHours() * 60 + ahora.getMinutes() : 0;
    if (minutos < apertura) {
      const h = Math.floor(apertura / 60);
      const m = apertura % 60;
      const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : fecha.toLocaleDateString("es-CL", { weekday: "long" });
      return cuando + " a las " + h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0");
    }
    if (minutos < cierre && i === 0) return "ahora";
  }
  return "próximamente";
}
