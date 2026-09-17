"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CART_STORAGE_KEY, CartLine, cleanStoredCart, findCartProduct } from "@/lib/trip-cart";
import { PLAN_START_STORAGE_KEY, resolveTripStart, shiftTripDates } from "@/lib/trip-itinerary";

type CartContextValue = { lines: CartLine[]; startDate: string; setStartDate: (date: string) => void; ready: boolean; storageNotice: string; add: (id: string) => void; update: (id: string, patch: Partial<Pick<CartLine, "quantity" | "date">>) => void; remove: (id: string) => void; complete: (submitted: CartLine[]) => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const currentLines = useRef<CartLine[]>([]);
  const [startDate, setStart] = useState("");
  const currentStart = useRef("");
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  useEffect(() => {
    function restore() {
      const restored = cleanStoredCart(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]"));
      const start = restored.length ? resolveTripStart(restored, localStorage.getItem(PLAN_START_STORAGE_KEY)) : "";
      currentLines.current = restored;
      currentStart.current = start;
      setLines(restored);
      setStart(start);
    }
    try { restore(); }
    catch { setStorageNotice("Your browser could not restore your trip plan. You can still choose experiences in this tab."); }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY && event.key !== PLAN_START_STORAGE_KEY && event.key !== null) return;
      try { restore(); } catch { /* Keep this plan when stored data is invalid. */ }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const change = useCallback((fn: (current: CartLine[]) => CartLine[], preferredStart?: string) => {
    const next = fn(currentLines.current);
    const start = next.length ? resolveTripStart(next, preferredStart ?? currentStart.current) : "";
    currentLines.current = next;
    currentStart.current = start;
    setLines(next);
    setStart(start);
    try { localStorage.setItem(PLAN_START_STORAGE_KEY, start); localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next)); }
    catch { setStorageNotice("Your trip plan is available in this tab, but this browser could not save it for later."); }
  }, []);
  const setStartDate = useCallback((date: string) => change(current => shiftTripDates(current, currentStart.current, date), date), [change]);
  const add = useCallback((id: string) => { if (findCartProduct(id)) change(current => current.some(line => line.productId === id) ? current : [...current, { productId: id, quantity: 1, date: "" }]); }, [change]);
  const update = useCallback((id: string, patch: Partial<Pick<CartLine, "quantity" | "date">>) => change(current => current.map(line => line.productId === id ? { ...line, ...patch } : line)), [change]);
  const remove = useCallback((id: string) => change(current => current.filter(line => line.productId !== id)), [change]);
  const complete = useCallback((submitted: CartLine[]) => change(current => current.filter(line => !submitted.some(item => item.productId === line.productId && item.quantity === line.quantity && item.date === line.date))), [change]);
  return <CartContext.Provider value={{ lines, startDate, setStartDate, ready, storageNotice, add, update, remove, complete }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Cart components require CartProvider.");
  return cart;
}
