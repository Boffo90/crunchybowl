"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  opciones: Record<string, string | string[]>;
  notas?: string;
  subtotal: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "subtotal">) => void;
  removeItem: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;
  clear: () => void;
  getSubtotal: () => number;
  getCount: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const id = crypto.randomUUID();
        const subtotal = item.precio_unitario * item.cantidad;
        set((state) => ({ items: [...state.items, { ...item, id, subtotal }] }));
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateCantidad: (id, cantidad) => {
        if (cantidad < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, cantidad, subtotal: i.precio_unitario * cantidad } : i
          ),
        }));
      },
      clear: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((acc, i) => acc + i.subtotal, 0),
      getCount: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    { name: "crunchybowl-cart" }
  )
);
