import Link from "next/link";
import Image from "next/image";
import { Instagram, MapPin, Clock, Phone } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatearHorarioSemanal } from "@/lib/horarios";
import { getHorarios } from "@/lib/horarios-db";

export async function Footer() {
  const horarios = await getHorarios();
  return (
    <footer className="mt-20 border-t-2 border-crunchy-pink-soft bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Image src="/brand/logo.webp" alt="CrunchyBowl" width={48} height={48} className="rounded-full" />
            <span className="font-display text-xl font-bold text-crunchy-accent">CrunchyBowl</span>
          </div>
          <p className="text-sm text-crunchy-muted">Comida coreana hecha en casa. Solo en Pucón.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-crunchy-dark">Explora</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href={ROUTES.CARTA} className="text-crunchy-muted hover:text-crunchy-accent">Carta</Link></li>
            <li><Link href={ROUTES.COMO_FUNCIONA} className="text-crunchy-muted hover:text-crunchy-accent">Cómo funciona</Link></li>
            <li><Link href={ROUTES.FIDELIDAD} className="text-crunchy-muted hover:text-crunchy-accent">Fidelidad</Link></li>
            <li><Link href={ROUTES.NOSOTROS} className="text-crunchy-muted hover:text-crunchy-accent">Nosotros</Link></li>
            <li><Link href={ROUTES.CONTACTO} className="text-crunchy-muted hover:text-crunchy-accent">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-crunchy-dark">Contáctanos</h4>
          <ul className="space-y-2 text-sm text-crunchy-muted">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Calle Cuatro 905, Pucón</li>
            <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0" /> {formatearHorarioSemanal(horarios)}</li>
            <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /> WhatsApp</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-crunchy-dark">Síguenos</h4>
          <a href="https://instagram.com/crunchybowl.cl" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-crunchy-muted hover:text-crunchy-accent">
            <Instagram className="h-5 w-5" /> @crunchybowl.cl
          </a>
        </div>
      </div>
      <div className="border-t border-crunchy-pink-soft py-4 text-center text-xs text-crunchy-muted">
        © {new Date().getFullYear()} CrunchyBowl · Pucón, Chile
      </div>
    </footer>
  );
}
