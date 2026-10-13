"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, SealPercentIcon, StarIcon, WarningCircleIcon, XIcon } from "@/components/icons";
import { useApp } from "./providers";
import { ratingWord } from "@/lib/rating";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------------- Buttons ---------------- */
type Variant = "primary" | "secondary" | "ghost" | "destructive" | "soft";
type Size = "md" | "sm" | "lg";

export function btn(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-[background-color,box-shadow,transform,color] duration-200 ease-out active:scale-[.98] disabled:opacity-45 disabled:cursor-not-allowed aria-disabled:opacity-45 select-none whitespace-nowrap",
    size === "md" && "h-12 px-5 text-base",
    size === "sm" && "h-11 px-4 text-sm",
    size === "lg" && "h-14 px-7 text-lg",
    variant === "primary" && "bg-primary text-on-primary hover:bg-primary-hover hover:shadow-sm",
    variant === "secondary" && "bg-surface text-secondary border-[1.5px] border-secondary hover:bg-secondary-soft",
    variant === "ghost" && "text-secondary hover:bg-secondary-soft",
    variant === "soft" && "bg-surface-muted text-text hover:bg-border",
    variant === "destructive" && "bg-error text-white hover:opacity-90",
    extra,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={btn(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="size-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = "primary", size = "md", className, children, ...rest }: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link href={href} className={btn(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/* ---------------- Badges ---------------- */
export function SavingsBadge({ pct, size = "md", soft, className }: { pct: number; size?: "sm" | "md" | "lg"; soft?: boolean; className?: string }) {
  return (
    <span
      className={cx(
        "animate-badge inline-flex items-center gap-1 rounded-full font-semibold tabular",
        soft ? "bg-savings-soft text-savings-ink" : "bg-savings text-on-savings",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <SealPercentIcon weight="fill" aria-hidden className={size === "lg" ? "size-4" : "size-3.5"} />
      Save {pct}%
    </span>
  );
}

export function TypeChip({ type }: { type: string }) {
  return <span className="inline-flex items-center rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-semibold capitalize text-secondary">{type}</span>;
}

export { ratingWord };

export function Rating({ value, count, compact }: { value: number; count?: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-bold text-bg tabular">
        <StarIcon weight="fill" aria-hidden className="size-3 text-accent" />
        {value.toFixed(1)}
      </span>
      <span className="font-semibold">{ratingWord(value)}</span>
      {!compact && count != null && <span className="text-text-muted">({count.toLocaleString("en-GB")} reviews)</span>}
      <span className="sr-only">, rated {value.toFixed(1)} out of 10</span>
    </span>
  );
}

export function Stars({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex text-accent" aria-label={`${n}-star property`} role="img">
      {Array.from({ length: n }, (_, i) => (
        <StarIcon key={i} weight="fill" className="size-3.5" aria-hidden />
      ))}
    </span>
  );
}

/* ---------------- Chips ---------------- */
export function FilterChip({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
        selected ? "border-secondary bg-secondary-soft text-secondary" : "border-border-strong bg-surface text-text hover:border-secondary",
        className,
      )}
    >
      {selected && <CheckIcon weight="bold" className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------------- Form fields ---------------- */
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, optional, id, className, required, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = [hint && `${fid}-hint`, error && `${fid}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-error" aria-hidden> *</span>}
        {optional && <span className="font-normal text-text-muted"> (optional)</span>}
      </label>
      <input
        ref={ref}
        id={fid}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cx(
          "h-12 w-full rounded-[10px] border bg-surface px-3.5 text-base text-text placeholder:text-text-subtle transition-colors",
          error ? "border-error" : "border-border-strong hover:border-secondary",
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={`${fid}-hint`} className="mt-1.5 text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fid}-err`} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
});

/* ---------------- Dialog: centred modal on desktop, bottom sheet on mobile ---------------- */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  sheetOnMobile = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "full";
  sheetOnMobile?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
    (focusables()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-[var(--color-scrim)]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cx(
          "relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-lg",
          sheetOnMobile ? "animate-sheet rounded-t-[24px] sm:animate-pop sm:rounded-[24px]" : "animate-pop m-4 rounded-[24px]",
          size === "md" && "sm:max-w-[560px]",
          size === "lg" && "sm:max-w-[760px]",
          size === "full" && "sm:max-w-[1100px]",
        )}
      >
        {sheetOnMobile && (
          <div
            className="flex justify-center pt-2.5 sm:hidden"
            onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
            onTouchMove={(e) => startY.current != null && setDragY(Math.max(0, e.touches[0].clientY - startY.current))}
            onTouchEnd={() => {
              if (dragY > 90) onClose();
              setDragY(0);
              startY.current = null;
            }}
            aria-hidden
          >
            <span className="h-1.5 w-10 rounded-full bg-border-strong" />
          </div>
        )}
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 sm:px-6">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-surface-muted" aria-label="Close">
            <XIcon className="size-5" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */
export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:left-6 sm:items-start">
      {toasts.map((t) => (
        <div key={t.id} className="animate-pop pointer-events-auto flex min-h-12 max-w-md items-center gap-3 rounded-xl bg-text px-4 py-2.5 text-sm text-bg shadow-lg">
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="ml-auto min-h-9 rounded-md px-2 font-semibold text-accent underline-offset-2 hover:underline"
              onClick={() => {
                t.action!.onClick();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Images (remote CDN with responsive sizes) ---------------- */
export function photoSrcSet(src: string) {
  return {
    src: src.replace("{size}", "max1024x768"),
    srcSet: `${src.replace("{size}", "max500")} 500w, ${src.replace("{size}", "max1024x768")} 1024w, ${src.replace("{size}", "max1280x900")} 1280w`,
  };
}

export function Photo({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Image may finish loading before hydration attaches onLoad.
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  const s = photoSrcSet(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote CDN already serves resized WebP/JPEG variants
    <img
      ref={imgRef}
      src={s.src}
      srcSet={s.srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      className={cx("h-full w-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-lg", className)} aria-hidden />;
}

/** Currency-aware price for use inside server components. */
export function Money({ zmw }: { zmw: number }) {
  const { money } = useApp();
  return <span className="tabular">{money(zmw)}</span>;
}
