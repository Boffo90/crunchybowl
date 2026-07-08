import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { ROUTES } from "@/lib/routes";

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, telefono, email")
    .eq("id", user.id)
    .single();

  return (
    <CheckoutForm
      userId={user.id}
      nombreInicial={profile?.nombre ?? ""}
      telefonoInicial={profile?.telefono ?? ""}
    />
  );
}
