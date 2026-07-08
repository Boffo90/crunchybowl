import { Bike, Clock, Home } from "lucide-react";
import { formatearHorarioSemanal } from "@/lib/horarios";

export function InfoStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card-kawaii flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <Bike className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-crunchy-dark">Delivery en Pucón</h4>
            <p className="text-sm text-crunchy-muted">Tarifa desde $1.500 dentro de rotondas. $3.000 + por distancia fuera.</p>
          </div>
        </div>
        <div className="card-kawaii flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <Clock className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-crunchy-dark">Horarios</h4>
            <p className="text-sm text-crunchy-muted">{formatearHorarioSemanal()}</p>
          </div>
        </div>
        <div className="card-kawaii flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crunchy-pink-soft">
            <Home className="h-6 w-6 text-crunchy-accent" />
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-crunchy-dark">Retiro en casa</h4>
            <p className="text-sm text-crunchy-muted">Calle Cuatro 905, Pucón</p>
          </div>
        </div>
      </div>
    </section>
  );
}
