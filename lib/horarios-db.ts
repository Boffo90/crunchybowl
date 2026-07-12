import { createClient } from "@supabase/supabase-js";
import {
  HORARIOS_DEFAULT,
  parseHorarios,
  parseVentanasProductos,
  type HorariosConfig,
  type VentanaProducto,
} from "@/lib/horarios";
import { DESCUENTO_INACTIVO, parseDescuento, type DescuentoConfig } from "@/lib/descuento";

// SOLO USO EN SERVIDOR. Lee configuracion con el service role porque RLS
// bloquea la tabla para el rol anon (y su contenido no es sensible: horarios).
function serverClient(fetchOptions: RequestInit) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, ...fetchOptions }),
      },
    }
  );
}

async function fetchHorarios(fetchOptions: RequestInit): Promise<HorariosConfig> {
  try {
    const { data } = await serverClient(fetchOptions)
      .from("configuracion")
      .select("value")
      .eq("key", "horarios")
      .maybeSingle();
    return parseHorarios(data?.value);
  } catch {
    return HORARIOS_DEFAULT;
  }
}

// Con cache de 60s: para footer y paginas informativas.
export async function getHorarios(): Promise<HorariosConfig> {
  return fetchHorarios({ next: { revalidate: 60 } } as RequestInit);
}

// Sin cache: para el checkout, donde el estado abierto/cerrado debe ser exacto.
export async function getHorariosFresh(): Promise<HorariosConfig> {
  return fetchHorarios({ cache: "no-store" });
}

async function fetchDescuento(fetchOptions: RequestInit): Promise<DescuentoConfig> {
  try {
    const { data } = await serverClient(fetchOptions)
      .from("configuracion")
      .select("value")
      .eq("key", "descuento")
      .maybeSingle();
    return parseDescuento(data?.value);
  } catch {
    return DESCUENTO_INACTIVO;
  }
}

// Con cache de 60s: para el banner del sitio.
export async function getDescuento(): Promise<DescuentoConfig> {
  return fetchDescuento({ next: { revalidate: 60 } } as RequestInit);
}

// Sin cache: para el checkout, donde el monto mostrado debe ser exacto.
export async function getDescuentoFresh(): Promise<DescuentoConfig> {
  return fetchDescuento({ cache: "no-store" });
}

// Ventanas horarias por producto (ej: crunchy-lunch solo 12:00-14:00). Cache 60s.
export async function getVentanasProductos(): Promise<Record<string, VentanaProducto>> {
  try {
    const { data } = await serverClient({ next: { revalidate: 60 } } as RequestInit)
      .from("configuracion")
      .select("value")
      .eq("key", "horarios_productos")
      .maybeSingle();
    return parseVentanasProductos(data?.value);
  } catch {
    return {};
  }
}
