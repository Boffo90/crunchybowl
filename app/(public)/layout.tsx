import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getDescuento } from "@/lib/horarios-db";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const descuento = await getDescuento();

  return (
    <>
      {descuento.activo && (
        <div className="bg-crunchy-accent px-4 py-2 text-center text-sm font-bold text-white">
          🎉 {descuento.motivo || "Promo"}: {descuento.porcentaje}% OFF en toda la carta 🎉
        </div>
      )}
      <Navbar />
      <main className="min-h-[calc(100vh-200px)]">{children}</main>
      <Footer />
    </>
  );
}
