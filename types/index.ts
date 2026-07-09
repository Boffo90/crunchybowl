export type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
};

export type Producto = {
  id: string;
  categoria_id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  tipo: 'bibimbap' | 'japchae' | 'pollo' | 'otro';
  activo: boolean;
  orden: number;
};

export type Opcion = {
  id: string;
  producto_id: string;
  grupo: string;
  nombre: string;
  precio_extra: number;
  max_seleccion: number;
  requerido: boolean;
  orden: number;
  activo: boolean;
};

export type Profile = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  rol: 'cliente' | 'admin';
  sellos: number;
  sellos_canjeados: number;
};

export type EstadoPedido =
  | 'pendiente'
  | 'pagado'
  | 'preparando'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type Pedido = {
  id: string;
  numero: number;
  user_id: string;
  nombre: string;
  telefono: string;
  tipo_entrega: 'retiro' | 'delivery';
  direccion: string | null;
  costo_delivery: number;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: 'flow' | 'efectivo' | 'transferencia';
  estado: EstadoPedido;
  notas_generales: string | null;
  created_at: string;
};

