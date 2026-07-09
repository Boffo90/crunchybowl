import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { estaAbiertoAhora, proximaApertura } from "@/lib/horarios";
import { getZona } from "@/lib/zonas";
import type { Opcion, Producto } from "@/types";

const itemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().min(1).max(50),
  opciones_seleccionadas: z.record(z.union([z.string(), z.array(z.string())])),
  notas: z.string().max(300).optional().nullable(),
});

const bodySchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  nombre: z.string().trim().min(1),
  telefono: z.string().trim().min(1),
  tipo_entrega: z.enum(["retiro", "delivery"]),
  direccion: z.string().trim().min(1).nullable(),
  zona_id: z.string().nullable().optional(),
  metodo_pago: z.enum(["flow", "efectivo", "transferencia"]),
  notas_generales: z.string().max(300).nullable().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    if (!estaAbiertoAhora()) {
      return NextResponse.json(
        { error: "Estamos cerrados en este momento. Abrimos " + proximaApertura() + "." },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de pedido invalidos" }, { status: 400 });
    }
    const body = parsed.data;

    // Invitado: user_id null. Con sesion: se ignora lo que mande el cliente y se usa el user real.
    if (user && body.user_id && body.user_id !== user.id) {
      return NextResponse.json({ error: "Usuario invalido" }, { status: 403 });
    }
    const effectiveUserId = user ? user.id : null;

    if (body.tipo_entrega === "delivery" && !body.direccion) {
      return NextResponse.json({ error: "Direccion requerida para delivery" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Recalcular precios en el servidor a partir de la base de datos: nunca confiar
    // en precio_unitario/subtotal/total enviados por el cliente.
    const productoIds = [...new Set(body.items.map((i) => i.producto_id))];
    const { data: productosData, error: eProductos } = await admin
      .from("productos")
      .select("*")
      .in("id", productoIds)
      .eq("activo", true);
    if (eProductos) return NextResponse.json({ error: eProductos.message }, { status: 500 });

    const productos = (productosData ?? []) as Producto[];
    const productosPorId = new Map(productos.map((p) => [p.id, p]));

    if (productos.length !== productoIds.length) {
      return NextResponse.json({ error: "Uno o mas productos ya no estan disponibles" }, { status: 400 });
    }

    const { data: opcionesData, error: eOpciones } = await admin
      .from("opciones")
      .select("*")
      .in("producto_id", productoIds)
      .eq("activo", true);
    if (eOpciones) return NextResponse.json({ error: eOpciones.message }, { status: 500 });

    const opciones = (opcionesData ?? []) as Opcion[];

    let subtotal = 0;
    const itemsPayload: Array<{
      producto_id: string;
      nombre_producto: string;
      precio_unitario: number;
      cantidad: number;
      opciones_seleccionadas: Record<string, string | string[]>;
      notas: string | null;
      subtotal: number;
    }> = [];

    for (const i of body.items) {
      const producto = productosPorId.get(i.producto_id)!;
      const opcionesProducto = opciones.filter((o) => o.producto_id === i.producto_id);

      // Validar reglas de opciones (grupos requeridos y maximo por grupo) en el servidor.
      const grupos = [...new Set(opcionesProducto.map((o) => o.grupo))];
      for (const grupo of grupos) {
        const opcionesGrupo = opcionesProducto.filter((o) => o.grupo === grupo);
        const requerido = opcionesGrupo.some((o) => o.requerido);
        const maxSeleccion = Math.max(...opcionesGrupo.map((o) => o.max_seleccion || 1), 1);

        const valor = i.opciones_seleccionadas[grupo];
        const seleccionados = Array.isArray(valor) ? valor : valor ? [valor] : [];

        if (requerido && seleccionados.length < 1) {
          return NextResponse.json(
            { error: `Debes elegir ${grupo} para ${producto.nombre}` },
            { status: 400 }
          );
        }
        if (seleccionados.length > maxSeleccion) {
          return NextResponse.json(
            { error: `Maximo ${maxSeleccion} en ${grupo} para ${producto.nombre}` },
            { status: 400 }
          );
        }
        for (const nombre of seleccionados) {
          if (!opcionesGrupo.some((o) => o.nombre === nombre)) {
            return NextResponse.json(
              { error: `Opcion invalida en ${grupo} para ${producto.nombre}` },
              { status: 400 }
            );
          }
        }
      }

      let extra = 0;
      for (const [grupo, valor] of Object.entries(i.opciones_seleccionadas)) {
        const nombresSeleccionados = Array.isArray(valor) ? valor : [valor];
        for (const nombre of nombresSeleccionados) {
          const opcion = opcionesProducto.find((o) => o.grupo === grupo && o.nombre === nombre);
          if (opcion) extra += opcion.precio_extra;
        }
      }

      const precioUnitario = producto.precio_base + extra;
      const itemSubtotal = precioUnitario * i.cantidad;
      subtotal += itemSubtotal;

      itemsPayload.push({
        producto_id: i.producto_id,
        nombre_producto: producto.nombre,
        precio_unitario: precioUnitario,
        cantidad: i.cantidad,
        opciones_seleccionadas: i.opciones_seleccionadas,
        notas: i.notas ?? null,
        subtotal: itemSubtotal,
      });
    }

    let costoDelivery = 0;
    if (body.tipo_entrega === "delivery") {
      const zona = getZona(body.zona_id ?? "");
      if (!zona) return NextResponse.json({ error: "Zona de delivery invalida" }, { status: 400 });
      costoDelivery = zona.tarifa;
    }

    const total = subtotal + costoDelivery;

    const { data: pedido, error: e1 } = await admin
      .from("pedidos")
      .insert({
        user_id: effectiveUserId,
        nombre: body.nombre,
        telefono: body.telefono,
        tipo_entrega: body.tipo_entrega,
        direccion: body.tipo_entrega === "delivery" ? body.direccion : null,
        costo_delivery: costoDelivery,
        subtotal,
        descuento: 0,
        total,
        metodo_pago: body.metodo_pago,
        estado: "pendiente",
        notas_generales: body.notas_generales || null,
      })
      .select("id, numero")
      .single();

    if (e1 || !pedido) return NextResponse.json({ error: e1?.message ?? "Error al crear pedido" }, { status: 500 });

    const { error: e2 } = await admin
      .from("pedido_items")
      .insert(itemsPayload.map((i) => ({ ...i, pedido_id: pedido.id })));
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

    return NextResponse.json({ pedido_id: pedido.id, numero: pedido.numero });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
