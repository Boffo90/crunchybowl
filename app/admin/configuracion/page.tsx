import { createClient } from "@/lib/supabase/server";
import { ConfiguracionForm } from "@/components/admin/ConfiguracionForm";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const supabase = createClient();
  const { data: config } = await supabase
    .from("configuracion")
    .select("value")
    .eq("key", "fidelidad")
    .maybeSingle();

  const meta = (config?.value as { sellos_meta?: number } | null)?.sellos_meta ?? 10;

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Configuración</h1>
      <ConfiguracionForm metaInicial={meta} />
    </div>
  );
}
