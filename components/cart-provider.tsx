"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CART_STORAGE_KEY, CartLine, cleanStoredCart, findCartProduct } from "@/lib/trip-cart";

type CartContextValue = { lines: CartLine[]; ready: boolean; storageNotice: string; add: (id: string) => void; update: (id: string, patch: Partial<Pick<CartLine, "quantity" | "date">>) => void; remove: (id: string) => void; complete: (submitted: CartLine[]) => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const currentLines = useRef<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  useEffect(() => {
    function restore(value: string | null) {
      const restored = cleanStoredCart(JSON.parse(value || "[]"));
      currentLines.current = restored;
      setLines(restored);
    }
    try { restore(localStorage.getItem(CART_STORAGE_KEY)); }
    catch { setStorageNotice("Your browser could not restore your trip plan. You can still choose experiences in this tab."); }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      try { restore(event.newValue); } catch { /* Keep this cart when stored data is invalid. */ }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const change = useCallback((fn: (current: CartLine[]) => CartLine[]) => {
    const next = fn(currentLines.current);
    currentLines.current = next;
    setLines(next);
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next)); }
    catch { setStorageNotice("Your trip plan is available in this tab, but this browser could not save it for later."); }
  }, []);
  const add = useCallback((id: string) => { if (findCartProduct(id)) change(current => current.some(line => line.productId === id) ? current : [...current, { productId: id, quantity: 1, date: "" }]); }, [change]);
  const update = useCallback((id: string, patch: Partial<Pick<CartLine, "quantity" | "date">>) => change(current => current.map(line => line.productId === id ? { ...line, ...patch } : line)), [change]);
  const remove = useCallback((id: string) => change(current => current.filter(line => line.productId !== id)), [change]);
  const complete = useCallback((submitted: CartLine[]) => change(current => current.filter(line => !submitted.some(item => item.productId === line.productId && item.quantity === line.quantity && item.date === line.date))), [change]);
  return <CartContext.Provider value={{ lines, ready, storageNotice, add, update, remove, complete }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Cart components require CartProvider.");
  return cart;
}
