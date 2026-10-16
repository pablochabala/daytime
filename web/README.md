# Daytime: web prototype

> Great stays, by the hour, for a fraction of the price.

Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + TypeScript. The design tokens follow [`../design-system.md`](../design-system.md).

## Run it

```bash
npm install
npm run dev -- -p 3100
```

Then open http://localhost:3100.

## Pages

| Route | What's there |
|---|---|
| `/` | Hero + search, how it works, use-case tiles, featured stays, airport layovers, trust signals, pay-on-Daytime + app links, partner teaser |
| `/search` | Filters (type, use case, price, discount, window, duration, stars, rating, amenities), sort, list/map toggle, skeletons, empty state. All state lives in the URL |
| `/property/[slug]` | Gallery + lightbox, overview, daytime window, inclusions, rooms/packages, house rules, map + directions, reviews, sticky booking panel (bottom sheet on mobile) |
| `/book` | 3 steps: details → payment (card or mobile money) → confirmation. Summary at every step, inline validation, error summary, add to calendar |
| `/account` | Sign in / sign up, upcoming / past / cancelled bookings, extend a booking, cancel with confirmation, wishlist, profile |
| `/partner` | Value proposition, revenue calculator, partner form with daytime window and rates (day pass enforced at 50–70% off) |

## Partner accounts and master control

| Route | Who | What |
|---|---|---|
| `/partner` | Anyone | The listing form. Submitting it creates a **partner account** (email + password) and a listing marked **Coming soon** |
| `/partner/login` | Partners | Sign in |
| `/partner/dashboard` | That partner only | Status, photos (upload, choose cover, remove) and listing details/rates |
| `/admin/setup` | First visit only | Creates the **master control** account, then locks permanently |
| `/admin/login`, `/admin` | Master account | Block or unblock partner accounts, and set each profile to **Available**, **Unavailable** or **Coming soon** (partner listings and the built-in stays) |

How it's protected (all enforced on the server):
- Passwords are hashed with scrypt. Sessions are signed, `httpOnly` cookies that expire after 7 days.
- Every partner API call checks the session, and partners can only read or change their own listing. They can't change their status.
- Blocking an account signs the partner out immediately, stops them signing in, and hides their listing from the site.
- Only **Available** listings can be booked. The other two labels show on the profile and in search, and booking is disabled.
- Additional protections: cross-site requests are rejected, sign-in attempts are rate-limited, uploads are checked by their actual file bytes (JPG/PNG/WebP, max 10 MB) and stored under random names.

### Where the data is stored

Accounts, listings, labels and photos go through one storage layer (`src/lib/server/store/`) with two backends:

- **Supabase (recommended, required for hosting):** Postgres tables plus a Storage bucket for photos. Used automatically when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- **Local file (fallback):** `web/.data/` (git-ignored). Used when the Supabase variables are empty. Fine for trying things out on one computer.

#### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com) and choose a region near Zambia (for example Frankfurt or a South Africa region, if one is offered).
2. In the dashboard, open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the `accounts`, `listings` and `seed_statuses` tables (with Row Level Security on) and the `listing-photos` bucket.
3. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL`: Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API → the **service_role / secret** key. Keep it secret: it goes only in `.env.local` and your host's environment settings, never in GitHub.
   - `SESSION_SECRET`: any long random string (the command is in `.env.example`)
4. Restart the dev server. Then visit `/admin/setup` to create the master account in Supabase.

### Deploying to Vercel

1. In Vercel: **Add New → Project → Import** the `pablochabala/daytime` GitHub repository.
2. Set **Root Directory** to `web`. Vercel detects Next.js automatically.
3. Under **Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PHOTO_BUCKET` (`listing-photos`) and `SESSION_SECRET`, then click **Deploy**.

Without the Supabase variables, the site still deploys and the public pages work. Partner sign-up and the master-account setup show a "not switched on yet" message until the database is connected. After adding variables later, redeploy (Deployments → ⋯ → Redeploy).

Security model: the browser never talks to Supabase directly. Only the Next.js server does, using the service-role key. RLS is on with no policies, so the public anon key can't read accounts or listings. The database also enforces "only one master account" and the 50–70% day-pass rule.

> The guest side (`/account`, wishlists, bookings) is still stored in the browser only.

## Where to plug in real services

- **Data:** `src/lib/api.ts` is the only place the UI gets data from. Replace the functions in it with `fetch` calls; the shapes are in `src/lib/types.ts`.
- **Availability:** `src/lib/availability.ts` generates deterministic mock slots. Replace it with your inventory API. Before payment, the booking flow re-checks that the slot is still free; move that check server-side.
- **Payments:** `src/components/booking-flow.tsx` → the `pay()` function. No real payment is taken.
- **Auth and bookings:** `src/components/providers.tsx` stores these in `localStorage` for the demo.
- **App store links:** `src/lib/config.ts` → `SITE.appStoreUrl` / `SITE.playStoreUrl`.
- **FX rate:** `src/lib/currency.ts` uses a fixed indicative USD rate.

## Content notes ⚠️

- Property names, cities, review scores and reference overnight rates come from public Booking.com listings (October 2026). Daytime rates, windows, availability and individual reviews are invented for the demo.
- **Photos are hotlinked from Booking.com's CDN and belong to the properties.** Replace them with partner-supplied or licensed images before any public launch. They're all in `src/data/properties.json`.
- Some coordinates and street addresses are approximate.

## Dev notes

- Icons: a trimmed set of Phosphor icons is generated into `src/components/icons.tsx`. The full package is too large to install reliably inside a OneDrive folder.
- Fonts (Outfit + Plus Jakarta Sans) load via a Google Fonts `<link>`, because Node on this machine fails TLS verification against Google, which breaks `next/font`.
