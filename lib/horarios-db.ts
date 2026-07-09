import { createClient } from "@supabase/supabase-js";
import { HORARIOS_DEFAULT, parseHorarios, type HorariosConfig } from "@/lib/horarios";

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
