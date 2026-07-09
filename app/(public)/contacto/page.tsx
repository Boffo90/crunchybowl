import { Instagram, MapPin, Clock, MessageCircle } from "lucide-react";
import { formatearHorarioSemanal } from "@/lib/horarios";

function whatsappHref() {
  const numero = (process.env.WHATSAPP_ADMIN ?? "").replace(/[^\d]/g, "");
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent("Hola! Quiero hacer una consulta sobre CrunchyBowl 🍜")}`;
}

export default function ContactoPage() {
  const wa = whatsappHref();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 font-display text-4xl font-bold text-crunchy-dark md:text-5xl">Contáctanos</h1>
        <p className="text-lg text-crunchy-muted">¿Dudas sobre tu pedido o la carta? Escríbenos.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <MapPin className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-crunchy-dark">Retiro en casa</h3>
            <p className="text-sm text-crunchy-muted">Calle Cuatro 905, Pucón</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-kawaii bg-white p-6 shadow-kawaii">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <Clock className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-crunchy-dark">Horario de atención</h3>
            <p className="text-sm text-crunchy-muted">{formatearHorarioSemanal()}</p>
          </div>
        </div>

        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-kawaii bg-white p-6 shadow-kawaii transition-shadow hover:shadow-kawaii-lg"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
              <MessageCircle className="h-6 w-6 text-crunchy-accent" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-crunchy-dark">WhatsApp</h3>
              <p className="text-sm text-crunchy-muted">Escríbenos directo, respondemos rápido</p>
            </div>
          </a>
        )}

        <a
          href="https://instagram.com/crunchybowl.cl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-kawaii bg-white p-6 shadow-kawaii transition-shadow hover:shadow-kawaii-lg"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <Instagram className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-crunchy-dark">Instagram</h3>
            <p className="text-sm text-crunchy-muted">@crunchybowl.cl</p>
          </div>
        </a>
      </div>
    </div>
  );
}
