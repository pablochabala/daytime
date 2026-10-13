"use client";

import { useCallback, useEffect, useState } from "react";
import { CaretLeftIcon, CaretRightIcon, ImagesIcon } from "./icons";
import { Dialog, Photo, cx } from "./ui";
import type { Photo as PhotoT } from "@/lib/types";

export function Gallery({ photos, name }: { photos: PhotoT[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const many = photos.length >= 5;

  return (
    <>
      <div className={cx("relative grid gap-2 overflow-hidden rounded-[24px]", many ? "md:grid-cols-4 md:grid-rows-2" : "md:grid-cols-1")} style={{ height: "min(56vw, 460px)" }}>
        {photos.slice(0, many ? 5 : 1).map((ph, i) => (
          <button
            key={ph.src}
            type="button"
            onClick={() => setOpen(i)}
            className={cx("group relative overflow-hidden bg-surface-muted", i === 0 ? "md:col-span-2 md:row-span-2" : "hidden md:block")}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            <Photo src={ph.src} alt={ph.alt} priority={i === 0} sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"} className="transition-transform duration-500 group-hover:scale-[1.03]" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold shadow-md hover:bg-surface-muted"
        >
          <ImagesIcon className="size-5" aria-hidden />
          {photos.length > 1 ? `Show all ${photos.length} photos` : "View photo"}
        </button>
      </div>
      <Lightbox photos={photos} index={open} onIndex={setOpen} name={name} />
    </>
  );
}

function Lightbox({ photos, index, onIndex, name }: { photos: PhotoT[]; index: number | null; onIndex: (i: number | null) => void; name: string }) {
  const go = useCallback((d: number) => index != null && onIndex((index + d + photos.length) % photos.length), [index, onIndex, photos.length]);
  useEffect(() => {
    if (index == null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, go]);
  if (index == null) return null;
  const ph = photos[index];
  return (
    <Dialog open onClose={() => onIndex(null)} title={`${name}: photo ${index + 1} of ${photos.length}`} size="full" sheetOnMobile={false}>
      <div className="relative">
        <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface-muted">
          <Photo key={ph.src} src={ph.src} alt={ph.alt} sizes="(min-width: 1100px) 1050px, 100vw" priority />
        </div>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-md">
              <CaretLeftIcon weight="bold" className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-md">
              <CaretRightIcon weight="bold" className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label="Thumbnails">
          {photos.map((p, i) => (
            <li key={p.src} className="shrink-0">
              <button
                type="button"
                onClick={() => onIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index || undefined}
                className={cx("h-16 w-24 overflow-hidden rounded-lg ring-offset-2 ring-offset-surface", i === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100")}
              >
                <Photo src={p.src} alt="" sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
