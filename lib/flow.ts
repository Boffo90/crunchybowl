import { createHmac } from "crypto";

// Cliente minimo de la API de Flow.cl (pagos). SOLO USO EN SERVIDOR.
// Docs: https://www.flow.cl/docs/api.html

const FLOW_API_URL = process.env.FLOW_API_URL ?? "https://www.flow.cl/api";

export function flowDisponible(): boolean {
  const key = process.env.FLOW_API_KEY;
  const secret = process.env.FLOW_SECRET_KEY;
  return Boolean(key && secret && !key.includes("xxxx") && !secret.includes("xxxx"));
}

// Firma requerida por Flow: HMAC-SHA256 (hex) sobre los parametros
// concatenados nombre+valor, ordenados alfabeticamente por nombre.
function firmar(params: Record<string, string>): string {
  const cadena = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join("");
  return createHmac("sha256", process.env.FLOW_SECRET_KEY!).update(cadena).digest("hex");
}

export type FlowEstado = {
  flowOrder: number;
  commerceOrder: string;
  status: number; // 1 pendiente, 2 pagada, 3 rechazada, 4 anulada
  amount: number;
};

export async function crearPagoFlow(args: {
  commerceOrder: string;
  subject: string;
  amount: number;
  email?: string | null;
}): Promise<{ redirectUrl: string; token: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.crunchybowl.cl";
  const params: Record<string, string> = {
    apiKey: process.env.FLOW_API_KEY!,
    commerceOrder: args.commerceOrder,
    subject: args.subject,
    currency: "CLP",
    amount: String(args.amount),
    urlConfirmation: `${siteUrl}/api/flow/confirmacion`,
    urlReturn: `${siteUrl}/api/flow/retorno`,
  };
  if (args.email) params.email = args.email;
  params.s = firmar(params);

  const res = await fetch(`${FLOW_API_URL}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url || !data.token) {
    throw new Error(data.message ?? `Flow respondio ${res.status}`);
  }
  return { redirectUrl: `${data.url}?token=${data.token}`, token: data.token };
}

export async function estadoPagoFlow(token: string): Promise<FlowEstado> {
  const params: Record<string, string> = {
    apiKey: process.env.FLOW_API_KEY!,
    token,
  };
  params.s = firmar(params);

  const res = await fetch(`${FLOW_API_URL}/payment/getStatus?` + new URLSearchParams(params), {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? `Flow getStatus respondio ${res.status}`);
  return data as FlowEstado;
}

/**
 * Estado del pago buscando por el numero de orden nuestro (el id del pedido).
 * Sirve para los pedidos creados antes de que se guardara el flow_token.
 * Flow responde 404 cuando nunca se creo un pago para esa orden.
 */
export async function estadoPagoFlowPorPedido(pedidoId: string): Promise<FlowEstado | null> {
  const params: Record<string, string> = {
    apiKey: process.env.FLOW_API_KEY!,
    commerceId: pedidoId,
  };
  params.s = firmar(params);

  const res = await fetch(
    `${FLOW_API_URL}/payment/getStatusByCommerceId?` + new URLSearchParams(params),
    { cache: "no-store" }
  );
  if (res.status === 404) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? `Flow getStatusByCommerceId respondio ${res.status}`);
  return data as FlowEstado;
}
