"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, ProhibitIcon, ArrowCounterClockwiseIcon, EnvelopeIcon, PhoneIcon, ArrowRightIcon } from "./icons";
import { Button, Dialog, FilterChip, Skeleton, cx } from "./ui";
import { SignOutButton } from "./auth-forms";
import { useApp } from "./providers";
import { STATUS_LABEL } from "@/lib/catalog";
import type { ListingStatus, PartnerListing, PropertyType } from "@/lib/types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  blocked: boolean;
  createdAt: string;
  lastLoginAt?: string;
}
interface PartnerRow {
  user: AdminUser;
  listing: PartnerListing | null;
}
interface CatalogueRow {
  id: string;
  slug: string;
  name: string;
  type: PropertyType;
  city: string;
  status: ListingStatus;
}

const STATUSES: ListingStatus[] = ["available", "coming-soon", "unavailable"];
type Filter = "all" | ListingStatus | "blocked";

function StatusControl({ value, onChange, label, disabled }: { value: ListingStatus; onChange: (s: ListingStatus) => void; label: string; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-[10px] border border-border-strong bg-surface p-1">
      {STATUSES.map((s) => {
        const sel = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={sel}
            disabled={disabled}
            onClick={() => !sel && onChange(s)}
            className={cx(
              "min-h-10 rounded-[7px] px-3 text-sm font-semibold transition-colors disabled:opacity-50",
              sel && s === "available" && "bg-savings text-on-savings",
              sel && s === "coming-soon" && "bg-accent text-[#422006]",
              sel && s === "unavailable" && "bg-text text-bg",
              !sel && "hover:bg-surface-muted",
            )}
          >
            {STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never");

export function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const { toast } = useApp();
  const [data, setData] = useState<{ partners: PartnerRow[]; catalogue: CatalogueRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"partners" | "catalogue">("partners");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<PartnerRow | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/accounts", { cache: "no-store" }).catch(() => null);
    if (!res) return setError("Couldn't reach the server.");
    if (res.status === 403) return router.push("/admin/login");
    setData(await res.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: ListingStatus, name: string) => {
    setBusy(id);
    const res = await fetch(`/api/admin/listings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => null);
    setBusy(null);
    if (!res?.ok) return toast({ message: `Couldn't update ${name}. Try again.` });
    setData((d) =>
      d && {
        partners: d.partners.map((p) => (p.listing?.id === id ? { ...p, listing: { ...p.listing, status } } : p)),
        catalogue: d.catalogue.map((c) => (c.id === id ? { ...c, status } : c)),
      },
    );
    toast({ message: `${name} is now marked ${STATUS_LABEL[status]}` });
  };

  const setBlocked = async (row: PartnerRow, blocked: boolean) => {
    setBusy(row.user.id);
    const res = await fetch(`/api/admin/accounts/${row.user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocked }) }).catch(() => null);
    setBusy(null);
    setConfirmBlock(null);
    if (!res?.ok) return toast({ message: "Couldn't update the account. Try again." });
    setData((d) => d && { ...d, partners: d.partners.map((p) => (p.user.id === row.user.id ? { ...p, user: { ...p.user, blocked } } : p)) });
    toast({ message: blocked ? `${row.user.name} has been blocked and signed out` : `${row.user.name} has been unblocked` });
  };

  const counts = useMemo(() => {
    const p = data?.partners ?? [];
    return {
      all: p.length,
      "coming-soon": p.filter((x) => x.listing?.status === "coming-soon" && !x.user.blocked).length,
      available: p.filter((x) => x.listing?.status === "available" && !x.user.blocked).length,
      unavailable: p.filter((x) => x.listing?.status === "unavailable" && !x.user.blocked).length,
      blocked: p.filter((x) => x.user.blocked).length,
    };
  }, [data]);

  const needle = q.trim().toLowerCase();
  const partners = (data?.partners ?? []).filter((p) => {
    if (filter === "blocked" && !p.user.blocked) return false;
    if (filter !== "all" && filter !== "blocked" && (p.user.blocked || p.listing?.status !== filter)) return false;
    if (!needle) return true;
    return `${p.user.name} ${p.user.email} ${p.listing?.propertyName ?? ""} ${p.listing?.city ?? ""}`.toLowerCase().includes(needle);
  });
  const catalogue = (data?.catalogue ?? []).filter((c) => !needle || `${c.name} ${c.city}`.toLowerCase().includes(needle));

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Master control</p>
          <h1 className="mt-1 text-3xl font-semibold text-secondary md:text-4xl">Partners and listings</h1>
          <p className="mt-1 text-text-muted">Signed in as {adminName}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Stats */}
      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {(
          [
            ["all", "Partner accounts"],
            ["coming-soon", "Coming soon"],
            ["available", "Available"],
            ["unavailable", "Unavailable"],
            ["blocked", "Blocked"],
          ] as const
        ).map(([k, l]) => (
          <div key={k} className="rounded-2xl border border-border bg-surface p-4">
            <dt className="text-sm text-text-muted">{l}</dt>
            <dd className="font-display text-3xl font-bold tabular">{data ? counts[k] : "–"}</dd>
          </div>
        ))}
      </dl>

      {/* Tabs + search */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-border">
        <div role="tablist" aria-label="Sections" className="flex">
          {(
            [
              ["partners", "Partner accounts"],
              ["catalogue", "Daytime catalogue"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              type="button"
              onClick={() => setTab(k)}
              className={cx("-mb-px min-h-12 border-b-2 px-3 text-sm font-semibold", tab === k ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text")}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="relative mb-2 ml-auto w-full sm:w-72">
          <span className="sr-only">Search accounts and listings</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or city"
            className="h-11 w-full rounded-[10px] border border-border-strong bg-surface pl-10 pr-3 text-base"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-semibold text-error">
          {error}
        </p>
      )}

      {!data ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : tab === "partners" ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter partners">
            {(["all", "coming-soon", "available", "unavailable", "blocked"] as const).map((k) => (
              <FilterChip key={k} selected={filter === k} onClick={() => setFilter(k)}>
                {k === "all" ? "All" : k === "blocked" ? "Blocked" : STATUS_LABEL[k]} ({counts[k]})
              </FilterChip>
            ))}
          </div>
          {partners.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border-strong p-10 text-center">
              <p className="text-xl font-semibold">{data.partners.length ? "No accounts match" : "No partner accounts yet"}</p>
              <p className="mt-1 text-text-muted">
                {data.partners.length ? "Try another filter or search." : "Accounts appear here when a hotel, lodge or apartment lists on the partner page."}
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {partners.map((row) => {
                const l = row.listing;
                return (
                  <li key={row.user.id} className={cx("rounded-2xl border bg-surface p-5", row.user.blocked ? "border-error" : "border-border")}>
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-surface-muted md:w-36">
                        {l?.photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element -- partner upload served by our API
                          <img src={`/api/uploads/${l.photos[0]}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-sans text-lg font-bold">{l?.propertyName ?? "No listing"}</h2>
                          {l && <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-semibold capitalize text-secondary">{l.type}</span>}
                          {row.user.blocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white">
                              <ProhibitIcon className="size-3.5" aria-hidden /> Blocked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted">
                          {l?.city} · Joined {fmtDate(row.user.createdAt)} · Last sign-in {fmtDate(row.user.lastLoginAt)}
                        </p>
                        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="font-semibold">{row.user.name}</span>
                          <a href={`mailto:${row.user.email}`} className="inline-flex items-center gap-1 text-secondary hover:underline">
                            <EnvelopeIcon className="size-4" aria-hidden /> {row.user.email}
                          </a>
                          {row.user.phone && (
                            <a href={`tel:${row.user.phone}`} className="inline-flex items-center gap-1 text-secondary hover:underline">
                              <PhoneIcon className="size-4" aria-hidden /> {row.user.phone}
                            </a>
                          )}
                        </p>
                        {l && (
                          <p className="mt-1 text-sm text-text-muted tabular">
                            K {l.overnightRate.toLocaleString("en-GB")} overnight · K {l.dayPassRate.toLocaleString("en-GB")} day pass · K {l.hourlyRate}/h · {l.window.open}–{l.window.close} ·{" "}
                            {l.photos.length} photos
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
                      {l ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold">Profile label</span>
                          <StatusControl value={l.status} label={`Status for ${l.propertyName}`} disabled={busy === l.id} onChange={(s) => setStatus(l.id, s, l.propertyName)} />
                        </div>
                      ) : (
                        <span />
                      )}
                      <div className="flex flex-wrap gap-2">
                        {l && !row.user.blocked && (
                          <Link href={`/property/${l.slug}`} target="_blank" className="inline-flex h-11 items-center gap-1 rounded-[10px] px-3 text-sm font-semibold text-secondary hover:bg-secondary-soft">
                            View profile <ArrowRightIcon weight="bold" className="size-4" aria-hidden />
                          </Link>
                        )}
                        {row.user.blocked ? (
                          <Button size="sm" variant="secondary" loading={busy === row.user.id} onClick={() => setBlocked(row, false)}>
                            <ArrowCounterClockwiseIcon className="size-4" aria-hidden /> Unblock account
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => setConfirmBlock(row)}>
                            <ProhibitIcon className="size-4" aria-hidden /> Block account
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="mt-5 text-sm text-text-muted">The built-in stays on Daytime. Set the label guests see on each profile.</p>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {catalogue.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link href={`/property/${c.slug}`} target="_blank" className="font-semibold hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-sm capitalize text-text-muted">
                    {c.type} · {c.city}
                  </p>
                </div>
                <StatusControl value={c.status} label={`Status for ${c.name}`} disabled={busy === c.id} onChange={(s) => setStatus(c.id, s, c.name)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {confirmBlock && (
        <Dialog
          open
          onClose={() => setConfirmBlock(null)}
          title={`Block ${confirmBlock.user.name}?`}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setConfirmBlock(null)}>
                Cancel
              </Button>
              <Button variant="destructive" loading={busy === confirmBlock.user.id} onClick={() => setBlocked(confirmBlock, true)}>
                Block account
              </Button>
            </div>
          }
        >
          <p>Blocking this account will:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Sign {confirmBlock.user.name} out immediately and stop them signing in</li>
            <li>Hide {confirmBlock.listing?.propertyName ?? "their listing"} from the Daytime website</li>
          </ul>
          <p className="mt-3 text-sm text-text-muted">You can unblock the account at any time. Nothing is deleted.</p>
        </Dialog>
      )}
    </div>
  );
}
