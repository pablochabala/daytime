"use client";

import { useEffect, useState } from "react";
import type { Property } from "@/lib/types";
import { getPropertiesSync, loadCatalog } from "@/lib/api";

/** Live catalogue for client components. Starts with the seed data, then swaps in the server's list. */
export function useCatalog() {
  const [list, setList] = useState<Property[]>(() => getPropertiesSync());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    loadCatalog().then((l) => {
      if (!alive) return;
      setList(l);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  const find = (slugOrId: string) => list.find((p) => p.slug === slugOrId || p.id === slugOrId);
  return { list, find, loaded };
}
