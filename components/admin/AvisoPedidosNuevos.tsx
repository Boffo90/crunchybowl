"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatCLP } from "@/lib/utils";

const INTERVALO_MS = 15_000;
const CLAVE_AVISOS = "crunchybowl:avisos-pedidos";

type PedidoNuevo = {
  id: string;
  numero: number;
  nombre: string;
  total: number;
  tipo_entrega: "retiro" | "delivery";
  created_at: string;
};

/**
 * Sondea pedidos nuevos mientras el panel este abierto y avisa con sonido +
 * notificacion del navegador. Reemplaza al aviso por WhatsApp entrante, que no
 * es posible sin la API oficial de Meta.
 */
export function AvisoPedidosNuevos() {
  const router = useRouter();
  const [activo, setActivo] = useState(false);
  const desdeRef = useRef<string>(new Date().toISOString());
  const audioRef = useRef<AudioContext | null>(null);
  const tituloBaseRef = useRef<string>("");

  /** Crea el AudioContext si falta. Debe llamarse desde un gesto del usuario. */
  const prepararAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    try {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (Ctor) audioRef.current = new Ctor();
    } catch {
      /* sin audio igual quedan la notificacion y el toast */
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    tituloBaseRef.current = document.title;
    // Se recuerda la eleccion del local: si ya activo los avisos y el permiso
    // del navegador sigue concedido, arranca solo sin tener que apretar nada.
    const guardado = localStorage.getItem(CLAVE_AVISOS) === "si";
    if (!guardado || typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }
    setActivo(true);

    // Al restaurar no hubo clic, y sin gesto previo el navegador no deja sonar:
    // se ceba el audio con la primera interaccion que haya en el panel.
    const cebar = () => {
      void prepararAudio()?.resume();
    };
    window.addEventListener("pointerdown", cebar, { once: true });
    window.addEventListener("keydown", cebar, { once: true });
    return () => {
      window.removeEventListener("pointerdown", cebar);
      window.removeEventListener("keydown", cebar);
    };
  }, [prepararAudio]);

  const sonar = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    // El navegador suspende el contexto cuando la pestania pasa a segundo plano.
    if (ctx.state === "suspended") void ctx.resume();

    // Campanilla de tres notas, generada sin archivo de audio.
    [0, 0.18, 0.36].forEach((retardo, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = [880, 1108, 1318][i];
      const t = ctx.currentTime + retardo;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }, []);

  const activar = useCallback(async () => {
    // El AudioContext debe crearse dentro del gesto del click: si no, el
    // navegador bloquea la reproduccion automatica y el aviso queda mudo.
    await prepararAudio()?.resume();

    const soportaNotificaciones = typeof Notification !== "undefined";
    if (soportaNotificaciones && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    localStorage.setItem(CLAVE_AVISOS, "si");
    setActivo(true);
    sonar();

    // Sin permiso solo se pierde la notificacion del sistema: el sonido, el
    // toast y el contador del titulo siguen andando. Hay que decirlo, si no
    // el boton en verde da a entender que esta todo listo.
    if (!soportaNotificaciones || Notification.permission !== "granted") {
      toast.warning("Avisos activados con sonido, pero el navegador bloqueó las notificaciones.", {
        description: "Habilítalas en el candado de la barra de direcciones para que también avisen con la pestaña de fondo.",
        duration: 12_000,
      });
    } else {
      toast.success("Avisos activados. Deja esta pestaña abierta.");
    }
  }, [sonar, prepararAudio]);

  const desactivar = useCallback(() => {
    localStorage.setItem(CLAVE_AVISOS, "no");
    setActivo(false);
    document.title = tituloBaseRef.current;
    toast.info("Avisos desactivados");
  }, []);

  useEffect(() => {
    if (!activo) return;
    let vivo = true;

    const revisar = async () => {
      try {
        const res = await fetch(
          `/api/admin/pedidos/nuevos?desde=${encodeURIComponent(desdeRef.current)}`,
          { cache: "no-store" }
        );
        if (!res.ok || !vivo) return;
        const data: { nuevos: PedidoNuevo[]; sinAtender: number; ahora: string } = await res.json();

        // El reloj del servidor manda: evita repetir o perder avisos por desfase.
        desdeRef.current = data.ahora;

        document.title = data.sinAtender > 0
          ? `(${data.sinAtender}) ${tituloBaseRef.current}`
          : tituloBaseRef.current;

        for (const p of data.nuevos) {
          sonar();
          const detalle = `${p.nombre} · ${formatCLP(p.total)} · ${p.tipo_entrega}`;

          toast.success(`🍜 Pedido nuevo #${p.numero}`, {
            description: detalle,
            duration: 30_000,
            action: { label: "Ver", onClick: () => router.push(ROUTES.ADMIN_PEDIDO(p.id)) },
          });

          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const n = new Notification(`🍜 Pedido nuevo #${p.numero}`, {
              body: detalle,
              tag: p.id,
              icon: "/favicon.ico",
            });
            n.onclick = () => {
              window.focus();
              router.push(ROUTES.ADMIN_PEDIDO(p.id));
              n.close();
            };
          }
        }
      } catch {
        /* caida de red puntual: el proximo sondeo reintenta */
      }
    };

    void revisar();
    const id = setInterval(revisar, INTERVALO_MS);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [activo, router, sonar]);

  return (
    <button
      onClick={activo ? desactivar : activar}
      title={activo ? "Avisos de pedidos activados" : "Activar avisos de pedidos nuevos"}
      className={
        "fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-kawaii transition-all hover:-translate-y-0.5 " +
        (activo
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-white text-crunchy-dark border-2 border-crunchy-pink hover:bg-crunchy-pink-soft")
      }
    >
      {activo ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {activo ? "Avisos activados" : "Activar avisos"}
    </button>
  );
}
