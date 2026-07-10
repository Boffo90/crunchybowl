// Dibujito kawaii para cada opcion de producto, buscado por nombre.
// Reglas en orden: gana la primera coincidencia (los mas especificos primero).
const REGLAS: [string, string][] = [
  // Salsas
  ["gochujang extra", "🔥"],
  ["gochujang", "🌶️"],
  ["soja", "🍯"],
  ["soya", "🧄"],
  ["sin salsa", "🚫"],
  ["salsa de la casa", "🏡"],

  // Proteinas / bowls ("repollo" antes que "pollo" para no confundirlos)
  ["repollo", "💜"],
  ["bulgogi", "🐮"],
  ["sweet", "🐥"],
  ["pollo", "🍗"],
  ["carne", "🥩"],
  ["tofu", "🌱"],

  // Arroz
  ["arroz picante", "🌶️"],
  ["arroz", "🍚"],

  // Toppings
  ["huevo", "🍳"],
  ["zapallo", "🥒"],
  ["champi", "🍄"],
  ["choclo", "🌽"],
  ["pepino", "🥒"],
  ["zanahoria", "🥕"],
  ["espinaca", "🥬"],
  ["brocoli", "🥦"],
  ["repollo", "💜"],
  ["nori", "🍙"],
  ["alga", "🍙"],
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function iconoOpcion(nombre: string): string {
  const n = normalizar(nombre);
  for (const [patron, emoji] of REGLAS) {
    if (n.includes(patron)) return emoji;
  }
  return "🍜";
}
