"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-crunchy-cream px-6 py-16 text-center">
      <div className="max-w-md rounded-kawaii bg-white p-8 shadow-kawaii">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-crunchy-accent">
          Ups, algo salió mal
        </p>
        <h2 className="mb-3 font-display text-2xl font-bold text-crunchy-dark">
          No pudimos cargar esta vista
        </h2>
        <p className="mb-6 text-sm text-crunchy-muted">
          Intenta nuevamente en unos segundos o vuelve al inicio.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-full bg-crunchy-accent px-5 py-2 font-semibold text-white transition hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
