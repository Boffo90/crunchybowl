import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { getHorariosFresh } from "@/lib/horarios-db";
import { flowDisponible } from "@/lib/flow";

export default async function CheckoutPage() {
  const supabase = createClient();
  const horarios = await getHorariosFresh();
  const { data: { user } } = await supabase.auth.getUser();

  let nombreInicial = "";
  let telefonoInicial = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, telefono, email")
      .eq("id", user.id)
      .single();
    nombreInicial = profile?.nombre ?? "";
    telefonoInicial = profile?.telefono ?? "";
  }

  return (
    <CheckoutForm
      userId={user?.id ?? null}
      nombreInicial={nombreInicial}
      telefonoInicial={telefonoInicial}
      horarios={horarios}
      flowHabilitado={flowDisponible()}
    />
  );
}
