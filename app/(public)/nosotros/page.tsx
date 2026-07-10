import Link from "next/link";
import Image from "next/image";
import { Heart, ChefHat, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";

const HERO_IMAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/hero-bibimbap.jpg`;

export const metadata = {
  title: "Nosotros — CrunchyBowl",
  description: "Conoce la historia de CrunchyBowl, comida coreana hecha en casa en Pucón.",
};

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-3 font-display text-4xl font-bold text-crunchy-dark md:text-5xl">Nosotros</h1>
        <p className="text-lg text-crunchy-muted">La historia detrás de cada bowl</p>
      </div>

      <div className="mb-12 grid items-center gap-8 md:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-kawaii shadow-kawaii-lg">
          <Image
            src={HERO_IMAGE_URL}
            alt="CrunchyBowl — comida coreana hecha en casa"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold text-crunchy-dark">Hola, soy Camila 👋</h2>
          <p className="mb-4 text-crunchy-muted">
            Soy Camila Figueroa, vivo en Pucón y la cocina siempre ha sido mi hobby favorito:
            ese momento del día donde todo lo demás desaparece y solo importa lo que está pasando en la olla.
          </p>
          <p className="text-crunchy-muted">
            CrunchyBowl nació de una observación simple: en Pucón hay comida asiática rica — sushi por todos
            lados, comida china también — pero faltaba la coreana. El bibimbap, el japchae, ese pollo frito
            crujiente con salsas que enamoran... nadie lo estaba haciendo. Así que decidí hacerlo yo,
            desde mi casa, plato por plato.
          </p>
        </div>
      </div>

      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-kawaii bg-white p-6 text-center shadow-kawaii">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <ChefHat className="h-7 w-7 text-crunchy-accent" />
          </div>
          <h3 className="mb-1 font-semibold text-crunchy-dark">Hecho en casa</h3>
          <p className="text-sm text-crunchy-muted">Cada pedido se cocina al momento, como para la familia.</p>
        </div>
        <div className="rounded-kawaii bg-white p-6 text-center shadow-kawaii">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <Heart className="h-7 w-7 text-crunchy-accent" />
          </div>
          <h3 className="mb-1 font-semibold text-crunchy-dark">De hobby a oficio</h3>
          <p className="text-sm text-crunchy-muted">Un hobby que se convirtió en el proyecto más rico de todos.</p>
        </div>
        <div className="rounded-kawaii bg-white p-6 text-center shadow-kawaii">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <MapPin className="h-7 w-7 text-crunchy-accent" />
          </div>
          <h3 className="mb-1 font-semibold text-crunchy-dark">Desde Pucón</h3>
          <p className="text-sm text-crunchy-muted">La primera cocina coreana de la zona, para llevar o delivery.</p>
        </div>
      </div>

      <div className="text-center">
        <Link href={ROUTES.CARTA}>
          <Button size="lg">Conoce la carta</Button>
        </Link>
      </div>
    </div>
  );
}
