"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center bg-crunchy-cream px-6 py-16 text-center">
          <div className="max-w-md rounded-kawaii bg-white p-8 shadow-kawaii">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-crunchy-accent">
              Error inesperado
            </p>
            <h2 className="mb-3 font-display text-2xl font-bold text-crunchy-dark">
              La aplicación se cayó
            </h2>
            <p className="mb-6 text-sm text-crunchy-muted">
              Recarga la página o vuelve a intentarlo.
            </p>
            <button
              onClick={() => reset()}
              className="rounded-full bg-crunchy-accent px-5 py-2 font-semibold text-white transition hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
