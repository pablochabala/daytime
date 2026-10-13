"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CameraIcon, StarIcon, TrashIcon, UploadSimpleIcon, WarningCircleIcon } from "./icons";
import { cx } from "./ui";

export interface UploadedPhoto {
  id: string;
  file: File;
  url: string;
}

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 10;
export const MAX_PHOTOS = 20;
export const MIN_PHOTOS = 3;

/**
 * Photo picker for partners: button + drag-and-drop, previews, choose cover, remove.
 * Files stay in the browser for the prototype; send `photos[].file` to your upload API.
 */
export function PhotoUploader({
  photos,
  onChange,
  error,
  id = "pf-photos",
}: {
  photos: UploadedPhoto[];
  onChange: (p: UploadedPhoto[]) => void;
  error?: string;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const hintId = useId();
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Free preview URLs when the form unmounts.
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const add = (files: FileList | File[]) => {
    const bad: string[] = [];
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (!ACCEPT.includes(file.type)) bad.push(`${file.name}: use JPG, PNG or WebP`);
      else if (file.size > MAX_MB * 1024 * 1024) bad.push(`${file.name}: larger than ${MAX_MB} MB`);
      else if (next.length >= MAX_PHOTOS) bad.push(`${file.name}: you can add up to ${MAX_PHOTOS} photos`);
      else next.push({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`, file, url: URL.createObjectURL(file) });
    }
    setRejected(bad);
    onChange(next);
  };

  const remove = (pid: string) => {
    const p = photos.find((x) => x.id === pid);
    if (p) URL.revokeObjectURL(p.url);
    onChange(photos.filter((x) => x.id !== pid));
  };

  const makeCover = (pid: string) => {
    const p = photos.find((x) => x.id === pid);
    if (p) onChange([p, ...photos.filter((x) => x.id !== pid)]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) add(e.dataTransfer.files);
        }}
        className={cx(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          drag ? "border-primary bg-primary-soft" : error ? "border-error" : "border-border-strong bg-surface-muted",
        )}
      >
        <span className="grid size-14 place-items-center rounded-full bg-surface text-primary shadow-sm">
          <CameraIcon className="size-7" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">Add photos of your rooms, pool and spaces</p>
          <p id={hintId} className="mt-1 text-sm text-text-muted">
            JPG, PNG or WebP, up to {MAX_MB} MB each. Add at least {MIN_PHOTOS}; 8 or more works best. You can also drag and drop.
          </p>
        </div>
        <button
          id={id}
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={[hintId, error ? `${id}-err` : ""].filter(Boolean).join(" ")}
          aria-invalid={!!error || undefined}
          className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-secondary px-5 font-semibold text-bg transition-opacity hover:opacity-90 active:scale-[.98]"
        >
          <UploadSimpleIcon weight="bold" className="size-5" aria-hidden />
          {photos.length ? "Add more photos" : "Upload photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files?.length) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p id={`${id}-err`} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      {rejected.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1 text-sm font-medium text-error">
          {rejected.map((r) => (
            <li key={r} className="flex items-start gap-1.5">
              <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden /> {r}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <>
          <p className="mt-4 text-sm text-text-muted" aria-live="polite">
            {photos.length} of {MAX_PHOTOS} photos added. The first photo is your cover image.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.id} className="relative overflow-hidden rounded-xl border border-border bg-surface-muted">
                <div className="aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file the partner picked */}
                  <img src={p.url} alt={`Photo ${i + 1}: ${p.file.name}`} className="h-full w-full object-cover" />
                </div>
                {i === 0 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-[#422006]">
                    <StarIcon weight="fill" className="size-3" aria-hidden /> Cover
                  </span>
                )}
                <div className="flex items-center justify-between gap-1 p-1.5">
                  {i > 0 ? (
                    <button type="button" onClick={() => makeCover(p.id)} className="min-h-9 rounded-md px-2 text-xs font-semibold text-secondary hover:bg-secondary-soft">
                      Make cover
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="grid size-9 place-items-center rounded-md text-error hover:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <TrashIcon className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
