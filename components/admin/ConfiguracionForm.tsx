"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ConfiguracionForm({ metaInicial }: { metaInicial: number }) {
  const router = useRouter();
  const [meta, setMeta] = useState(metaInicial);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellos_meta: meta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      toast.success("Configuracion guardada");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii">
      <Input
        label="Sellos para plato gratis"
        type="number"
        min={1}
        max={100}
        value={meta}
        onChange={(e) => setMeta(Number(e.target.value))}
        required
      />
      <p className="text-sm text-crunchy-muted">
        Cuantos pedidos confirmados necesita un cliente para ganar un plato gratis.
      </p>
      <Button type="submit" loading={loading}>Guardar</Button>
    </form>
  );
}
