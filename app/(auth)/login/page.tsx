"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/routes";
import { esAdmin } from "@/lib/admin";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Credenciales inválidas");
      }
      toast.success("Bienvenida de vuelta");
      window.location.href = esAdmin(form.email) ? ROUTES.ADMIN : ROUTES.MI_CUENTA;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Credenciales inválidas";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-kawaii bg-white p-8 shadow-kawaii">
      <h1 className="mb-2 text-center font-display text-3xl font-bold text-crunchy-dark">Iniciar sesión</h1>
      <p className="mb-6 text-center text-sm text-crunchy-muted">
        Qué bueno tenerte de vuelta
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Tu contraseña"
        />

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-crunchy-muted">
        No tienes cuenta?{" "}
        <Link href={ROUTES.REGISTRO} className="font-semibold text-crunchy-accent hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
