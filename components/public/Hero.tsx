import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";

const HERO_IMAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/hero-bibimbap.jpg`;

export function Hero() {
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
        <div className="relative">
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-full bg-gradient-to-br from-crunchy-pink-soft to-crunchy-lavender shadow-kawaii-lg">
            <Image
              src={HERO_IMAGE_URL}
              alt="Chica feliz comiendo un bowl de bibimbap CrunchyBowl"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
