export type Zona = {
  id: string;
  nombre: string;
  descripcion: string;
  tarifa: number;
};

export const ZONAS_DELIVERY: Zona[] = [
  { id: "centro", nombre: "Centro (dentro de rotondas)", descripcion: "Zona urbana centro de Pucon", tarifa: 1500 },
  { id: "peninsula", nombre: "Peninsula", descripcion: "Sector Peninsula de Pucon", tarifa: 2000 },
  { id: "candelaria", nombre: "Candelaria", descripcion: "Sector Candelaria", tarifa: 2500 },
  { id: "villarrica", nombre: "Camino a Villarrica (hasta Km 5)", descripcion: "Ruta 199 hacia Villarrica", tarifa: 3000 },
  { id: "caburgua", nombre: "Camino a Caburgua (hasta Km 5)", descripcion: "Ruta hacia lago Caburgua", tarifa: 3000 },
  { id: "internacional", nombre: "Camino Internacional (hasta Km 5)", descripcion: "Ruta 199 hacia Argentina", tarifa: 3500 },
];

export function getZona(id: string): Zona | undefined {
  return ZONAS_DELIVERY.find((z) => z.id === id);
}
