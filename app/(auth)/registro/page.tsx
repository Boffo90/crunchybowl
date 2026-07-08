"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/lib/routes";

export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear la cuenta");
      }

      toast.success("Cuenta creada correctamente. Ya puedes iniciar sesión.");
      window.location.href = ROUTES.LOGIN;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrarse";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-kawaii bg-white p-8 shadow-kawaii">
      <h1 className="mb-2 text-center font-display text-3xl font-bold text-crunchy-dark">Crear cuenta</h1>
      <p className="mb-6 text-center text-sm text-crunchy-muted">
        Regístrate y comienza a acumular sellos de fidelidad
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre completo"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          placeholder="Tu nombre"
        />
        <Input
          label="Teléfono"
          name="telefono"
          type="tel"
          value={form.telefono}
          onChange={handleChange}
          required
          placeholder="+56 9 1234 5678"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="tu@email.com"
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
        />

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-crunchy-muted">
        Ya tienes cuenta?{" "}
        <Link href={ROUTES.LOGIN} className="font-semibold text-crunchy-accent hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
