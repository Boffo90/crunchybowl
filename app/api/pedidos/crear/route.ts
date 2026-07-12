import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { dentroDeVentana, estaAbiertoAhora, formatoVentana, parseHorarios, parseVentanasProductos } from "@/lib/horarios";
import { crearPagoFlow, flowDisponible } from "@/lib/flow";
import { calcularDescuento, parseDescuento } from "@/lib/descuento";
import { geocodificarDireccion } from "@/lib/geocodificar";
import { calcularDelivery } from "@/lib/delivery";
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
  direccion: z.string().trim().min(1).max(200).nullable(),
  referencia: z.string().trim().max(200).nullable().optional(),
  delivery_modo: z.enum(["zona", "distancia"]).nullable().optional(),
  zona_id: z.string().nullable().optional(),
  metodo_pago: z.enum(["flow", "efectivo", "transferencia"]),
  email: z.string().trim().email().nullable().optional(),
  notas_generales: z.string().max(300).nullable().optional(),
  hora_entrega: z.string().trim().max(40).nullable().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  try {
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

    if (body.metodo_pago === "flow" && !flowDisponible()) {
      return NextResponse.json({ error: "El pago con Flow no esta disponible por ahora" }, { status: 400 });
    }

    // Flow exige el email del pagador: cuenta con sesion o campo del formulario.
    const emailPagador = user?.email ?? body.email ?? null;
    if (body.metodo_pago === "flow" && !emailPagador) {
      return NextResponse.json({ error: "Ingresa tu email para pagar con Flow" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Horarios configurables desde el admin. Si esta cerrado, el pedido se acepta
    // igual como RESERVA, pero exige la hora a la que el cliente lo quiere.
    const { data: configHorarios } = await admin
      .from("configuracion")
      .select("value")
      .eq("key", "horarios")
      .maybeSingle();
    const horarios = parseHorarios(configHorarios?.value);
    const abierto = estaAbiertoAhora(horarios);

    if (!abierto && !body.hora_entrega) {
      return NextResponse.json(
        { error: "Estamos cerrados: indica a que hora quieres tu pedido para dejarlo reservado." },
        { status: 400 }
      );
    }

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

    // Productos con ventana horaria propia (ej: Crunchy Lunch 12:00-14:00).
    const { data: ventanasRow } = await admin
      .from("configuracion")
      .select("value")
      .eq("key", "horarios_productos")
      .maybeSingle();
    const ventanas = parseVentanasProductos(ventanasRow?.value);
    for (const p of productos) {
      const ventana = ventanas[p.slug];
      if (ventana && !dentroDeVentana(ventana)) {
        return NextResponse.json(
          { error: `${p.nombre} está disponible solo de ${formatoVentana(ventana)} hrs` },
          { status: 400 }
        );
      }
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
      // Compatibilidad: sin delivery_modo se asume zona (pedidos desde la pagina antigua).
      const modo = body.delivery_modo ?? "zona";
      if (modo === "zona") {
        const zona = getZona(body.zona_id ?? "");
        if (!zona) return NextResponse.json({ error: "Zona de delivery invalida" }, { status: 400 });
        costoDelivery = zona.tarifa;
      } else {
        // Tarifa por distancia: se geocodifica y recalcula en el servidor;
        // nunca se confia en el costo que muestre el navegador.
        const geo = await geocodificarDireccion(body.direccion!);
        if (!geo) {
          return NextResponse.json(
            { error: "No pudimos ubicar tu direccion. Elige tu zona manualmente." },
            { status: 400 }
          );
        }
        const delivery = calcularDelivery(geo.lat, geo.lng);
        if (!delivery.disponible) {
          return NextResponse.json(
            { error: delivery.mensaje ?? "Tu direccion esta fuera de nuestro radio de delivery" },
            { status: 400 }
          );
        }
        costoDelivery = delivery.costo;
      }
    }

    // Descuento global configurable desde el admin, calculado en el servidor.
    const { data: descuentoRow } = await admin
      .from("configuracion")
      .select("value")
      .eq("key", "descuento")
      .maybeSingle();
    const montoDescuento = calcularDescuento(subtotal, parseDescuento(descuentoRow?.value));

    const total = subtotal + costoDelivery - montoDescuento;

    // Pedido fuera de horario: queda como reserva con la hora pedida, visible para el admin.
    const notasFinal = [
      !abierto && body.hora_entrega ? `⏰ RESERVA — entregar a las ${body.hora_entrega}` : null,
      body.notas_generales || null,
    ].filter(Boolean).join("\n") || null;

    const { data: pedido, error: e1 } = await admin
      .from("pedidos")
      .insert({
        user_id: effectiveUserId,
        nombre: body.nombre,
        telefono: body.telefono,
        tipo_entrega: body.tipo_entrega,
        direccion: body.tipo_entrega === "delivery"
          ? body.direccion + (body.referencia ? ` (${body.referencia})` : "")
          : null,
        costo_delivery: costoDelivery,
        subtotal,
        descuento: montoDescuento,
        total,
        metodo_pago: body.metodo_pago,
        estado: "pendiente",
        notas_generales: notasFinal,
      })
      .select("id, numero")
      .single();

    if (e1 || !pedido) return NextResponse.json({ error: e1?.message ?? "Error al crear pedido" }, { status: 500 });

    const { error: e2 } = await admin
      .from("pedido_items")
      .insert(itemsPayload.map((i) => ({ ...i, pedido_id: pedido.id })));
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

    // Pago con Flow: crear la orden de pago y redirigir. Si Flow falla,
    // se elimina el pedido para no dejar pedidos sin via de pago.
    let flowUrl: string | null = null;
    if (body.metodo_pago === "flow") {
      try {
        const pago = await crearPagoFlow({
          commerceOrder: pedido.id,
          subject: `Pedido #${pedido.numero} CrunchyBowl`,
          amount: total,
          email: emailPagador,
        });
        flowUrl = pago.redirectUrl;
      } catch (err) {
        console.error("Error creando pago Flow:", err);
        await admin.from("pedido_items").delete().eq("pedido_id", pedido.id);
        await admin.from("pedidos").delete().eq("id", pedido.id);
        return NextResponse.json(
          { error: "No se pudo iniciar el pago con Flow. Intenta con otro metodo." },
          { status: 502 }
        );
      }
    }

    // Aviso por correo al admin. Nunca debe hacer fallar el pedido.
    try {
      await notificarPedidoPorCorreo({
        numero: pedido.numero,
        id: pedido.id,
        nombre: body.nombre,
        telefono: body.telefono,
        tipoEntrega: body.tipo_entrega,
        direccion: body.direccion,
        metodoPago: body.metodo_pago,
        total,
        notas: notasFinal,
        items: itemsPayload.map((i) => `${i.cantidad}x ${i.nombre_producto}`),
      });
    } catch (e) {
      console.error("Fallo el envio de correo del pedido", pedido.numero, e);
    }

    return NextResponse.json({ pedido_id: pedido.id, numero: pedido.numero, flow_url: flowUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function notificarPedidoPorCorreo(p: {
  numero: number;
  id: string;
  nombre: string;
  telefono: string;
  tipoEntrega: string;
  direccion: string | null;
  metodoPago: string;
  total: number;
  notas: string | null;
  items: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.EMAIL_ADMIN;
  // Sin key real configurada: se omite en silencio (el pedido ya quedo guardado).
  if (!apiKey || apiKey.includes("xxxx") || !destino) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.crunchybowl.cl";
  const totalCLP = "$" + p.total.toLocaleString("es-CL");
  const html = `
    <div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#FF6B9D">🍜 Nuevo pedido #${p.numero}</h2>
      ${p.notas?.includes("RESERVA") ? `<p style="background:#FFF3CD;padding:8px 12px;border-radius:8px"><b>${p.notas.split("\n")[0]}</b></p>` : ""}
      <p><b>Cliente:</b> ${p.nombre}<br/>
      <b>Teléfono:</b> ${p.telefono}<br/>
      <b>Entrega:</b> ${p.tipoEntrega === "retiro" ? "Retiro en local" : "Delivery — " + (p.direccion ?? "")}<br/>
      <b>Pago:</b> ${p.metodoPago}<br/>
      <b>Total:</b> ${totalCLP}</p>
      <p><b>Productos:</b><br/>${p.items.join("<br/>")}</p>
      ${p.notas ? `<p><b>Notas:</b><br/>${p.notas.replace(/\n/g, "<br/>")}</p>` : ""}
      <p><a href="${siteUrl}/admin/pedidos/${p.id}" style="background:#FF6B9D;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Ver pedido en el panel</a></p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "CrunchyBowl <onboarding@resend.dev>",
      to: [destino],
      subject: `Nuevo pedido #${p.numero} — ${p.nombre} (${totalCLP})`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend respondio", res.status, await res.text());
  }
}
