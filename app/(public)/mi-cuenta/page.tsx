import { redirect } from "next/navigation";
import Link from "next/link";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/public/LogoutButton";
import { ROUTES } from "@/lib/routes";

export default async function MiCuentaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  // RLS bloquea profiles y pedidos incluso para su propio dueño, asi que se
  // leen con service role filtrando por el id del usuario ya autenticado
  // (mismo patron que /pedido/[id]). Sin esto el cliente veia su tarjeta
  // siempre en 0 y "aun no has hecho pedidos".
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: config, error: configError } = await admin
    .from("configuracion")
    .select("value")
    .eq("key", "fidelidad")
    .maybeSingle();

  const meta = (config?.value as { sellos_meta?: number } | null)?.sellos_meta ?? 10;
  const sellos = profile?.sellos ?? 0;
  const progreso = Math.min(sellos, meta);

  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, numero, total, estado, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const hasConfig = !configError && Boolean(config);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-crunchy-dark">Hola, {profile?.nombre ?? "cliente"}</h1>
          <p className="text-crunchy-muted">{profile?.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-8 rounded-kawaii bg-gradient-to-br from-crunchy-pink-soft to-crunchy-lavender p-6 shadow-kawaii">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-kawaii">
            <Award className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-crunchy-dark">Tu tarjeta de fidelidad</h2>
            <p className="text-sm text-crunchy-muted">Cada compra suma un sello. A {meta} sellos, plato gratis</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {Array.from({ length: meta }).map((_, i) => (
            <div
              key={i}
              className={
                "flex aspect-square items-center justify-center rounded-full border-2 text-lg font-bold transition-all " +
                (i < progreso
                  ? "border-crunchy-accent bg-crunchy-accent text-white shadow-kawaii"
                  : "border-crunchy-pink-soft bg-white text-crunchy-pink-soft")
              }
            >
              {i < progreso ? "OK" : i + 1}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center font-semibold text-crunchy-dark">
          {sellos} / {meta} sellos
        </p>

        {sellos >= meta && (
          <div className="mt-4 rounded-2xl bg-white p-4 text-center">
            <p className="font-display text-lg font-bold text-crunchy-accent">
              🎁 ¡Tarjeta completa!
            </p>
            <p className="text-sm text-crunchy-muted">
              En tu próximo pedido eliges un plato de la carta y va gratis.
            </p>
            <Link href={ROUTES.CARTA}>
              <Button size="sm" className="mt-3">Ir a la carta</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-kawaii bg-white p-6 shadow-kawaii">
        <h2 className="mb-4 font-display text-2xl font-bold text-crunchy-dark">Ultimos pedidos</h2>
        {!pedidos || pedidos.length === 0 ? (
          <p className="py-8 text-center text-crunchy-muted">Aun no has hecho pedidos.</p>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => (
              <Link
                key={p.id}
                href={ROUTES.PEDIDO(p.id)}
                className="flex items-center justify-between rounded-2xl border border-crunchy-pink-soft p-4 hover:bg-crunchy-cream"
              >
                <div>
                  <p className="font-semibold text-crunchy-dark">Pedido #{p.numero}</p>
                  <p className="text-sm text-crunchy-muted">
                    {new Date(p.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-crunchy-accent">${p.total.toLocaleString("es-CL")}</p>
                  <p className="text-xs capitalize text-crunchy-muted">{p.estado}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
