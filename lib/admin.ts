/**
 * Cuentas con acceso al panel. Unica fuente de verdad: middleware, layout,
 * route handlers y el redirect del login leen todos de aca.
 */
export const ADMIN_EMAILS = [
  "annelid@gmail.com",
  "camilabfh@gmail.com",
] as const;

/** Compara normalizando: el correo puede venir con mayusculas o espacios. */
export function esAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizado = email.trim().toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(normalizado);
}
