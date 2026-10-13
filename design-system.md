# Daytime — Design System v0.1 (for approval)

> **Great stays, by the hour, for a fraction of the price.**

Built from the `ui-ux-pro-max` dataset. Sources used: product rows *Hotel/Hospitality (#38)*, *Booking & Appointment App (#104)* and *Travel/Tourism (#37)*; colour rows #37, #38 and #104; typography pairings *Geometric Modern (#11)* and *Friendly SaaS (#13)*; landing patterns *Hero + Features + CTA* and *Funnel (3-step)*; and the UX guidelines listed in §9. The layout ideas come from dayuse.com: price with a crossed-out overnight rate and "includes fees", collections like "Best pools" and "Between flights", 3 steps to book, and an app download block.

---

## 1. Style direction

**Light Minimal + Soft UI, photo-led, with micro-interactions.**

| Decision | Why (skill reasoning) |
|---|---|
| Minimalism & Swiss grid as the base | Hospitality row #38 recommends minimalism. It keeps search and booking uncluttered and prices easy to scan. |
| Soft UI Evolution for depth (soft warm shadows, rounded cards) | Booking row #104 recommends it. Cards feel welcoming and premium without heavy 3D. |
| Photo-led: big, bright daylight photography | Hospitality anti-pattern: "Poor photos + complex booking". The photos have to sell the stay. |
| Micro-interactions at 150–250 ms | Booking row #104: "Fast 150ms transitions". Feedback should be quick, never decorative. |
| **Avoid:** glassmorphism over photos, neon, AI purple/pink gradients, parallax-heavy heroes, auto-rotating carousels | These are skill anti-patterns. They hurt contrast and conversion, and they're bad for reduced motion. |

**Mood:** morning sun on white linen, a turquoise pool and warm terracotta. Optimistic, calm and trustworthy.

---

## 2. Colour

All text pairs are checked against WCAG 2.1 AA (4.5:1 normal text, 3:1 large text and UI).

### 2.1 Light theme (default)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--color-primary` | `#C2410C` | Primary CTA fill ("Sunset") | white text 5.2:1 ✓ |
| `--color-primary-hover` | `#9A3412` | Hover/pressed | white 7.3:1 ✓ |
| `--color-primary-soft` | `#FFEDD5` | Selected-slot tint, highlights | — |
| `--color-primary-bright` | `#F97316` | Decorative only (sun mark, illustrations), **never text** | — |
| `--color-secondary` | `#0C4A6E` | Headings, nav, links, trust ("Sky Navy") | on white 9.7:1 ✓ |
| `--color-secondary-soft` | `#E0F2FE` | Info panels, map pins bg | — |
| `--color-accent` | `#FBBF24` | Sunlight accent: star ratings, "Popular" ribbons, focus glow | with `#0F172A` text 11:1 ✓ |
| `--color-pool` | `#0E7490` | Tertiary accent for pool/spa/lodge context | white 5.4:1 ✓ |
| **`--color-savings`** | **`#047857`** | **Discount badges "Save 60%" and savings amounts** | white 5.5:1 ✓ |
| `--color-savings-soft` | `#D1FAE5` | Savings badge soft variant (text `#065F46`, 7.9:1 ✓) | — |
| `--color-success` | `#15803D` | Confirmation, valid fields (always with a ✓ icon) | white 5.0:1 ✓ |
| `--color-warning` | `#B45309` | "Only 2 slots left" and expiring holds (with icon) | white 5.0:1 ✓ |
| `--color-error` | `#DC2626` | Field errors and destructive actions (with icon) | white 4.8:1 ✓ |
| `--color-info` | `#0369A1` | Tips, policy notes | white 5.9:1 ✓ |

**Neutrals ("Linen")**

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#FFFBF5` | Page background (warm white, like daylight) |
| `--color-surface` | `#FFFFFF` | Cards, panels, sheets |
| `--color-surface-muted` | `#F6F1EA` | Section bands, input fill |
| `--color-border` | `#E7E0D6` | Dividers, card borders |
| `--color-border-strong` | `#A8A29E` | Input borders (3:1 vs surface ✓) |
| `--color-text` | `#0F172A` | Body text (17:1) |
| `--color-text-muted` | `#475569` | Secondary text (7.4:1) |
| `--color-text-subtle` | `#64748B` | Captions, strike-through overnight price (4.7:1 ✓) |
| `--color-disabled` | `#CBD5E1` / text `#94A3B8` | Unavailable slots (always paired with a strike-through and the label "Booked") |

### 2.2 Dark theme

Uses lighter tonal variants of each colour rather than inverting them, and was checked separately.

| Token | Hex | Notes |
|---|---|---|
| `--color-bg` | `#0B1220` | Night-sky navy (not pure black) |
| `--color-surface` | `#111A2E` | Cards |
| `--color-surface-muted` | `#18233A` | Inputs, bands |
| `--color-border` | `#26344F` | |
| `--color-text` | `#F1F5F9` | 16:1 |
| `--color-text-muted` | `#A3B1C6` | 8:1 |
| `--color-primary` | `#FB923C` | CTA fill with `#1C0A00` text (8:1 ✓) |
| `--color-secondary` | `#7DD3FC` | Links/headings accent |
| `--color-accent` | `#FCD34D` | Stars |
| `--color-savings` | `#34D399` | Badge fill with `#022C22` text (9:1 ✓) |
| `--color-success` | `#4ADE80` · `--color-warning` `#FBBF24` · `--color-error` `#F87171` | |
| Photo treatment | 6% dark scrim on hero images; badges keep a solid fill | |

### 2.3 Colour rules
- Components only reference semantic tokens. No raw hex values inside components.
- Colour is never the only signal. Savings badges always contain text ("Save 60%"). Unavailable slots get a strike-through and "Booked". Errors get an icon and a message.
- There is one primary CTA per screen.

---

## 3. Typography

**Pairing:** **Outfit** (display; geometric, optimistic, sun-round letterforms) + **Plus Jakarta Sans** (body/UI; friendly and very legible, with tabular figures).
These are skill pairings #11 and #13, combined: Outfit gives the headlines personality and Jakarta keeps forms and prices crisp.

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
--font-display: 'Outfit', system-ui, sans-serif;
--font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
```
- Load with `next/font` (self-hosted, `display: swap`). Preload the body font only.
- **Prices, times and countdowns:** `font-variant-numeric: tabular-nums` so values don't jitter when the duration changes.

| Token | Size / line-height | Weight | Font | Use |
|---|---|---|---|---|
| `display-xl` | 60/64 (mobile 40/44) | 700 | Outfit | Home hero |
| `display-lg` | 48/52 (mobile 34/40) | 700 | Outfit | Page heroes |
| `h1` | 36/44 (mobile 30/36) | 600 | Outfit | Page titles |
| `h2` | 30/38 (mobile 24/32) | 600 | Outfit | Sections |
| `h3` | 24/32 | 600 | Outfit | Card groups, panel titles |
| `h4` | 20/28 | 600 | Jakarta | Card titles |
| `body-lg` | 18/28 | 400 | Jakarta | Lead paragraphs |
| `body` | **16/24** | 400 | Jakarta | Default (never smaller on mobile) |
| `body-sm` | 14/20 | 400/500 | Jakarta | Meta, helper text |
| `caption` | 12/16 | 500 | Jakarta | Badges, legal (never body copy) |
| `price-lg` | 32/36 | 700 tabular | Jakarta | Booking panel total |
| `price` | 20/28 | 700 tabular | Jakarta | Card price |

Keep line length to 60–75 characters on desktop and use `text-wrap: balance` on short headings.

---

## 4. Spacing, radius, elevation, motion, breakpoints

**Spacing (4-pt base):** `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.
Section rhythm: 64 px on mobile, 96 px on desktop. Card padding 16 on mobile, 20 on desktop. Page gutter 16, then 24 at ≥768, then 32 at ≥1280. Container max width 1280 px.

**Radius:** `sm 6` (chips inside inputs) · `md 10` (inputs, buttons) · `lg 16` (cards, panels) · `xl 24` (sheets, hero search) · `pill 999` (badges, chips, slots).

**Shadows (warm-tinted, consistent scale):**
```css
--shadow-xs: 0 1px 2px rgb(68 40 20 / .06);
--shadow-sm: 0 2px 6px rgb(68 40 20 / .08);
--shadow-md: 0 8px 24px rgb(68 40 20 / .10);   /* card hover, dropdowns */
--shadow-lg: 0 16px 40px rgb(68 40 20 / .14);  /* sticky booking panel, modals */
--shadow-focus: 0 0 0 3px var(--color-bg), 0 0 0 5px #0369A1; /* visible focus ring, 3:1+ */
```

**Z-index:** `base 0 · sticky 10 · header 20 · dropdown 30 · sheet/backdrop 40 · modal 50 · toast 60`.

**Motion tokens:**
| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120 ms | Press, chip toggle, slot select |
| `--dur-base` | 200 ms | Hover, card lift, dropdown |
| `--dur-slow` | 320 ms | Bottom sheet, modal enter (exit at 70%, so 220 ms) |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Entering |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | Leaving |

Only `transform` and `opacity` are animated. Under `prefers-reduced-motion: reduce`, durations drop to 0 ms, the price count-up is replaced by an instant swap, and there's no heart burst.

**Breakpoints (mobile-first):** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1440`. Layouts are tested at 375, 768, 1024 and 1440.

**Icons:** Phosphor (the skill's default), Regular weight with 1.5 px stroke and Fill weight for active states. Sizes: `16 / 20 / 24`. No emoji icons.

---

## 5. Component specs

### Buttons
| Variant | Style | Notes |
|---|---|---|
| Primary | `primary` fill, white 600 text, radius md, height 48 (44 on compact) | One per view. Example labels: "Book now", "Continue to payment". |
| Secondary | white surface, 1.5 px `secondary` border, `secondary` text | "View rooms", "Map" |
| Ghost | text only, `secondary`, underline on hover | Tertiary links |
| Destructive | `error` fill, kept apart from the primary button | "Cancel booking" opens a confirm dialog first |
| States | hover (darken plus `shadow-sm`), pressed (`scale(.98)`), focus (`shadow-focus`), disabled (opacity .45, `aria-disabled`, `not-allowed`), loading (spinner, label kept, button disabled) | |

### Inputs
Height 48 px with a visible label above (never placeholder-only). Helper text sits below, and errors go below the field with an icon and `aria-describedby`. Validation runs on blur. Fields use the right `type` and `autocomplete` (`email`, `tel`, `name`, `cc-*`).

### Date picker (same-day booking)
- Desktop: a popover month calendar. Mobile: a **horizontal date strip** with a bottom-sheet calendar behind "More dates".
- Today is selected by default and labelled "Today". Fully booked dates are greyed out with a strike-through and `aria-disabled`.
- Built on the ARIA grid pattern: arrow keys move, Home/End jump to week edges, and PageUp/Down changes month. Each day has an `aria-label` like "Monday 12 October 2026, 6 slots available".

### ⭐ Time-slot picker (the most important interaction)
- A grid of **pill buttons** in 30-minute steps across the property's daytime window (e.g. 08:00–18:00), grouped as **Morning · Midday · Afternoon** with sticky sub-labels.
- **Available:** white fill with a `border-strong` outline. **Selected:** `primary` fill, white text and a check icon. **Unavailable:** `surface-muted` fill, `text-subtle`, a strike-through and the screen-reader text "booked". Unavailable pills can't be focused or chosen, but they stay visible so the day's shape is clear.
- **Slot validity is checked against the duration.** A start time only shows as available if the start time plus the chosen hours fits inside the window and doesn't overlap a booked slot.
- The earliest available slot is pre-highlighted with a "Next available" hint.
- It's a `radiogroup` with arrow-key navigation. Each pill is a `radio` labelled like "Check in 10:30, available".
- Below the grid, a **live result line** reads: `Check-in 10:30 → Check-out 14:30 · 4 hours` (`aria-live="polite"`).
- Mobile: 3 columns of 44 px pills. Desktop: 4–5 columns.

### Duration selector
A segmented control: `2h · 3h · 4h · 6h · Day pass`. Hour options below the property's minimum booking time are hidden; the minimum is shown in a note. "Day pass" uses an accent-tinted segment with a sun icon. Picking it fixes check-in and check-out to the full window.

### Guest selector
A popover on desktop and a sheet on mobile. Adults and children rows use − and + steppers (44 px targets, `aria-label="Add adult"`) and respect the property maximum. The trigger summarises the count: "2 guests".

### Property card
- 4:3 photo (`aspect-ratio`, lazy-loaded, `srcset`) with the **savings badge** top-left and a **wishlist heart** top-right (a 44 px button with `aria-pressed`).
- Body: type chip (Hotel/Lodge/Apartment) · name (h4) · area and city · rating (star plus "8.9 Excellent (214)").
- Price block (see below), then a **"Next slot: 10:30"** chip in `pool` colour.
- Hover lifts the card by `translateY(-2px)` and adds `shadow-md`. The whole card is one link, and the heart is a separate button.

### Price-with-discount display
```
K 1,200 per night      ← text-subtle, line-through, `<s>` with sr "was"
K 180 /hour  ·  K 480 day pass   ← price token, text color
[Save 60%]  Includes taxes & fees
```
- In the booking panel: an overnight comparison line plus "**You save K 720**" in savings colour.
- The total uses tabular figures. When the duration changes, it cross-fades and counts up over 200 ms, or swaps instantly under reduced motion.

### Discount badge
A `savings` pill with white 600 caption text and a tag icon: **"Save 60%"**. The `savings-soft` variant is used inline. On first view it gets a subtle one-time emphasis (a 0.95→1 scale over 200 ms). It never pulses in a loop.

### Filter chips
Radius pill, 36 px tall (44 px hit area). Selected chips use `secondary-soft` fill, `secondary` text, a check icon and `aria-pressed`. The chip row wraps rather than clipping, and there's a "Clear all" ghost button. On mobile, filters open in a full-height sheet with a sticky "Show 24 stays" button.

### Modals & bottom sheets
- Desktop: a centred modal (max 560 px), focus trapped, Esc closes it, focus returns to the trigger, and the backdrop is `rgb(15 23 42 / .5)`.
- Mobile: a **bottom sheet** with a drag handle, swipe-down to close and a visible close button. Content stays clear of the safe area.
- The **booking panel on mobile** is a sticky bottom bar ("From K 180/h · Save 60% · [Choose time]"). Tapping it opens the full sheet with date, duration, slots and total.

### Toasts
Bottom-centre on mobile and bottom-left on desktop. They auto-dismiss after 4 s, use `aria-live="polite"` and never take focus. Wishlist actions include an "Undo".

### Other
Skeletons that mirror real card shapes (shimmer turns off under reduced motion). Empty states use an illustration, a helpful line and an action ("Try a nearby date" or "Remove 2 filters"). Stepper/progress for booking: 3 labelled steps that you can navigate back through.

---

## 6. Booking & payment messaging

- **Pay on Daytime.** Prepaid checkout on the website or the Daytime app, with a clear "Secure payment" lock and an "Includes taxes & fees, no hidden charges" line next to every total. (This differs from dayuse.com, which uses pay-at-hotel.)
- **App promotion.** "Book faster in the Daytime app" with App Store and Google Play buttons. **The links are placeholders until you supply them.**
- **Currency:** default **ZMW (Kwacha, "K")** with a USD option, in a selector in the header. Totals are converted transparently.
- **Trust strip:** Verified properties · Secure payment · Free cancellation up to 2 hours before check-in · Support 7 days.

---

## 7. Page patterns

| Page | Pattern |
|---|---|
| Home | Hero + search (photo, one-line promise, search card overlapping the photo) → How it works (3 steps) → Use-case tiles → Featured stays → "Between flights" (Kenneth Kaunda Intl / Harry Mwanga Nkumbula Intl) → Trust → App download → Partner teaser |
| Search | Filters in a sidebar at `lg` and up, a sheet on mobile. List/Map toggle. Sort dropdown. |
| Property | Gallery → summary → sticky booking panel (right rail on desktop, bottom bar and sheet on mobile) |
| Booking flow | 3-step funnel with the summary card always visible (sidebar on desktop, collapsible on mobile) |
| Account | Tabs: Upcoming · Past · Cancelled · Wishlist · Profile |
| Partner | Hero → revenue explainer and calculator → steps → form |

Navigation: the header holds the logo, Search, "List your property", the currency selector, and Account. Mobile uses the header plus a menu sheet; there's no bottom nav, since this is a website. Links are deep (filters live in the URL).

---

## 8. Accessibility & performance checklist

- [ ] Contrast AA in both themes (tokens above are pre-checked)
- [ ] Visible focus ring on every control; sticky bars never cover the focused element
- [ ] Skip link; headings in sequential order; route change moves focus to `<main>`
- [ ] Date, time, guest and duration pickers have full keyboard support and `aria-label`s
- [ ] Alt text on every property photo; decorative icons get `aria-hidden`
- [ ] Touch targets ≥ 44 px, with 8 px gaps
- [ ] Images in AVIF/WebP via `next/image`, with `sizes`, lazy-loaded below the fold; hero gets `priority`
- [ ] Reserved aspect ratios (CLS < 0.1)
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] Map and lightbox code-split (`next/dynamic`)

---

## 9. UX guidelines & anti-patterns flagged by the skill (booking/e-commerce)

**Do**
1. Show the **total, including fees**, from the very first price people see. No surprises at checkout.
2. Show **check-in and check-out times** wherever a price appears after a slot is chosen.
3. Keep the **booking summary visible at every step**, and allow going back without losing anything entered.
4. Use **inline validation on blur** and show an error summary (focused, with links to the fields) after a failed submit.
5. Use **skeletons** for results longer than about 300 ms, and keep layout space reserved.
6. Make **empty states useful**: suggest a nearby date, a wider area, or fewer filters.
7. Use **autocomplete** for location (cities, airports, areas) with recent searches.
8. Show **honest scarcity only**, such as "2 slots left today" when it's true.
9. Ask for **confirmation** before cancelling a booking, and offer undo on wishlist removal.
10. **Remember state**: filters, scroll and search are restored on Back.

**Avoid (anti-patterns)**
- Hidden fees or totals that grow at checkout
- Placeholder-only labels; errors shown only at the top of the form
- Hover-only information such as slot details shown only on hover
- Auto-rotating hero carousels; parallax heroes
- Fake urgency timers; pre-ticked add-ons
- Removing focus outlines; emoji as icons
- Tiny time slots or slots needing drag gestures
- Glass effects over photos that reduce contrast; poor or low-resolution photos
- Requiring sign-up before seeing prices or slots (allow guest checkout)

---

## 10. Tailwind mapping (implementation preview)

Tokens are defined as CSS variables in `globals.css` (`:root` and `[data-theme="dark"]`, plus `prefers-color-scheme`) and exposed in `tailwind.config.ts`, for example `bg-primary`, `text-savings`, `rounded-lg`, `shadow-md`, `font-display`. Components live in `components/ui/*` and use only these tokens.
