"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PromoSlide = { src: string; alt: string };

export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const [actual, setActual] = useState(0);

  const avanzar = useCallback(
    () => setActual((a) => (a + 1) % slides.length),
    [slides.length]
  );
  const retroceder = () => setActual((a) => (a - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(avanzar, 5000);
    return () => clearInterval(id);
  }, [avanzar, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="relative h-full w-full overflow-hidden rounded-kawaii bg-gradient-to-br from-crunchy-pink-soft to-crunchy-lavender shadow-kawaii-lg">
        {slides.map((s, i) => (
          <div
            key={s.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === actual ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-contain"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={retroceder}
            aria-label="Promoción anterior"
            className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-kawaii transition-transform hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5 text-crunchy-accent" />
          </button>
          <button
            type="button"
            onClick={avanzar}
            aria-label="Promoción siguiente"
            className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-kawaii transition-transform hover:scale-110"
          >
            <ChevronRight className="h-5 w-5 text-crunchy-accent" />
          </button>

          <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ir a la promoción ${i + 1}`}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  i === actual ? "w-6 bg-crunchy-accent" : "w-2.5 bg-crunchy-pink"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
