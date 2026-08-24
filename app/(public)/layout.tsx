import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getAviso, getDescuento } from "@/lib/horarios-db";
import { DESCUENTO_MONTO_MINIMO } from "@/lib/descuento";
import { formatCLP } from "@/lib/utils";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [descuento, aviso] = await Promise.all([getDescuento(), getAviso()]);

  return (
    <>
      <div className="sticky top-0 z-50">
        {aviso.activo && (
          <div
            className={
              "px-4 py-2 text-center text-sm font-bold " +
              (aviso.tono === "alerta"
                ? "bg-orange-500 text-white"
                : "bg-crunchy-dark text-white")
            }
          >
            {aviso.texto}
          </div>
        )}
        {descuento.activo && (
          <div className="bg-crunchy-accent px-4 py-2 text-center text-sm font-bold text-white">
            🎉 {descuento.motivo || "Promo"}: {descuento.porcentaje}% OFF en toda la carta (compras sobre {formatCLP(DESCUENTO_MONTO_MINIMO)}) 🎉
          </div>
        )}
        <Navbar />
      </div>
      <main className="min-h-[calc(100vh-200px)]">{children}</main>
      <Footer />
    </>
  );
}
