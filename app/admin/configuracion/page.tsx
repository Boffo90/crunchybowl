import { createAdminClient } from "@/lib/supabase/admin";
import { ConfiguracionForm } from "@/components/admin/ConfiguracionForm";
import { parseHorarios } from "@/lib/horarios";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const supabase = createAdminClient();
  const [{ data: fidelidad }, { data: horariosRow }] = await Promise.all([
    supabase.from("configuracion").select("value").eq("key", "fidelidad").maybeSingle(),
    supabase.from("configuracion").select("value").eq("key", "horarios").maybeSingle(),
  ]);

  const meta = (fidelidad?.value as { sellos_meta?: number } | null)?.sellos_meta ?? 10;
  const horarios = parseHorarios(horariosRow?.value);

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Configuración</h1>
      <ConfiguracionForm metaInicial={meta} horariosIniciales={horarios} />
    </div>
  );
}
