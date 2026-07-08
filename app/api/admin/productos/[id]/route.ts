import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "annelid@gmail.com";

const fieldsSchema = z.object({
  nombre: z.string().trim().min(1),
  descripcion: z.string().trim().nullable(),
  precio_base: z.coerce.number().int().min(0),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const parsed = fieldsSchema.safeParse({
    nombre: form.get("nombre"),
    descripcion: form.get("descripcion")?.toString().trim() || null,
    precio_base: form.get("precio_base"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    ...parsed.data,
    activo: form.get("activo") === "true",
  };

  const foto = form.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const buffer = Buffer.from(await foto.arrayBuffer());
    const ext = foto.type === "image/png" ? "png" : "jpg";
    const path = `${params.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("productos")
      .upload(path, buffer, { contentType: foto.type || "image/jpeg", upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: pub } = admin.storage.from("productos").getPublicUrl(path);
    updates.imagen_url = pub.publicUrl;
  }

  const { error } = await admin.from("productos").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, imagen_url: updates.imagen_url ?? null });
}
