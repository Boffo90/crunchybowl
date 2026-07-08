"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PRODUCTO_LABELS } from "@/lib/utils";
import type { Producto } from "@/types";

export function ProductoEditForm({ producto }: { producto: Producto }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(producto.imagen_url);
  const [form, setForm] = useState({
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? "",
    precio_base: producto.precio_base,
    activo: producto.activo,
  });
  const [foto, setFoto] = useState<File | null>(null);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFoto(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      body.set("nombre", form.nombre);
      body.set("descripcion", form.descripcion);
      body.set("precio_base", String(form.precio_base));
      body.set("activo", String(form.activo));
      if (foto) body.set("foto", foto);

      const res = await fetch(`/api/admin/productos/${producto.id}`, { method: "PATCH", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      toast.success("Producto actualizado");
      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-kawaii bg-gradient-to-br from-crunchy-pink-soft to-crunchy-cream shadow-kawaii">
          {preview ? (
            <Image src={preview} alt={form.nombre} fill sizes="300px" className="object-cover" unoptimized={preview.startsWith("blob:")} />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl font-bold text-crunchy-accent">
              {PRODUCTO_LABELS[producto.tipo] ?? "MENU"}
            </div>
          )}
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-crunchy-dark">Reemplazar foto</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFoto}
            className="w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-crunchy-pink-soft file:px-3 file:py-1 file:text-sm file:font-semibold"
          />
        </label>
      </div>

      <div className="space-y-4 rounded-kawaii bg-white p-6 shadow-kawaii md:col-span-2">
        <Input
          label="Nombre"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          required
        />
        <div>
          <label className="mb-2 block text-sm font-semibold text-crunchy-dark">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-3 outline-none transition-colors focus:border-crunchy-accent"
          />
        </div>
        <Input
          label="Precio base (CLP)"
          type="number"
          min={0}
          value={form.precio_base}
          onChange={(e) => setForm((f) => ({ ...f, precio_base: Number(e.target.value) }))}
          required
        />
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            className="h-5 w-5 accent-crunchy-accent"
          />
          <span className="font-semibold text-crunchy-dark">Producto activo (visible en la carta)</span>
        </label>

        <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
