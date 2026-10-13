"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Booking } from "@/lib/types";
import { type Currency, formatMoney } from "@/lib/currency";
import { todayIso } from "@/lib/time";

/* ---------- storage helpers (fail-safe) ---------- */
function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/* ---------- toast ---------- */
export interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
  tone?: "default" | "success" | "error";
}

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AppState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  money: (zmw: number) => string;
  theme: "system" | "light" | "dark";
  setTheme: (t: "system" | "light" | "dark") => void;
  wishlist: string[];
  toggleWishlist: (id: string, name: string) => boolean;
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  updateUser: (u: User) => void;
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBooking: (ref: string, patch: Partial<Booking>) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  hydrated: boolean;
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside <Providers>");
  return c;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [currency, setCurrencyState] = useState<Currency>("ZMW");
  const [theme, setThemeState] = useState<"system" | "light" | "dark">("system");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    setCurrencyState(load("dt.currency", "ZMW"));
    setThemeState(load("dt.theme", "system"));
    setWishlist(load("dt.wishlist", []));
    setUser(load("dt.user", null));
    const stored = load<Booking[]>("dt.bookings", []);
    // Move bookings whose date has passed into "past".
    const t = todayIso();
    setBookings(stored.map((b) => (b.status === "upcoming" && b.date < t ? { ...b, status: "past" } : b)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast],
  );

  const value = useMemo<AppState>(
    () => ({
      hydrated,
      currency,
      setCurrency: (c) => {
        setCurrencyState(c);
        save("dt.currency", c);
      },
      money: (zmw) => formatMoney(zmw, currency),
      theme,
      setTheme: (t) => {
        setThemeState(t);
        save("dt.theme", t);
      },
      wishlist,
      toggleWishlist: (id, name) => {
        const has = wishlist.includes(id);
        const next = has ? wishlist.filter((x) => x !== id) : [...wishlist, id];
        setWishlist(next);
        save("dt.wishlist", next);
        toast({
          message: has ? `Removed ${name} from your wishlist` : `Saved ${name} to your wishlist`,
          action: {
            label: "Undo",
            onClick: () => {
              setWishlist(wishlist);
              save("dt.wishlist", wishlist);
            },
          },
        });
        return !has;
      },
      user,
      signIn: (u) => {
        setUser(u);
        save("dt.user", u);
      },
      signOut: () => {
        setUser(null);
        save("dt.user", null);
      },
      updateUser: (u) => {
        setUser(u);
        save("dt.user", u);
      },
      bookings,
      addBooking: (b) => {
        setBookings((bs) => {
          const next = [b, ...bs];
          save("dt.bookings", next);
          return next;
        });
      },
      updateBooking: (ref, patch) => {
        setBookings((bs) => {
          const next = bs.map((b) => (b.ref === ref ? { ...b, ...patch } : b));
          save("dt.bookings", next);
          return next;
        });
      },
      toasts,
      toast,
      dismissToast,
    }),
    [hydrated, currency, theme, wishlist, user, bookings, toasts, toast, dismissToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
