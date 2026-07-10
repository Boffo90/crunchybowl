import Link from "next/link";
import { readdirSync } from "fs";
import { join } from "path";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { PromoCarousel, type PromoSlide } from "@/components/public/PromoCarousel";

const HERO_IMAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/hero-bibimbap.jpg`;

// Toda imagen en public/promos/ se suma automaticamente al carrusel del hero.
function slidesPromos(): PromoSlide[] {
  try {
    return readdirSync(join(process.cwd(), "public", "promos"))
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .sort()
      .map((f) => ({ src: `/promos/${f}`, alt: "Promoción CrunchyBowl" }));
  } catch {
    return [];
  }
}

export function Hero() {
  // Solo promos en el carrusel; la ilustracion queda de respaldo si no hay ninguna.
  const promos = slidesPromos();
  const slides: PromoSlide[] = promos.length > 0
    ? promos
    : [{ src: HERO_IMAGE_URL, alt: "Chica feliz comiendo un bowl de bibimbap CrunchyBowl" }];

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="relative z-10">
          <div className="mb-6 inline-block rounded-full bg-crunchy-pink-soft px-4 py-1 text-sm font-semibold text-crunchy-accent">
            Solo delivery y retiro en Pucón
          </div>
          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-crunchy-dark md:text-6xl">
            Comida coreana <br />
            hecha en casa <br />
            con <span className="text-crunchy-accent">mucho amor</span>
          </h1>
          <p className="mb-8 max-w-md text-lg text-crunchy-muted">
            Crunchy por fuera, tierno por dentro, feliz por siempre. Bibimbap, Japchae y Pollo Frito Coreano recién hechos.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={ROUTES.CARTA}>
              <Button size="lg">Ver carta</Button>
            </Link>
            <Link href={ROUTES.CARTA}>
              <Button size="lg" variant="secondary">Quiero pedir</Button>
            </Link>
          </div>
        </div>
        <div className="relative pb-8">
          <PromoCarousel slides={slides} />
        </div>
      </div>
    </section>
  );
}
