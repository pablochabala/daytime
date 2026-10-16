-- Daytime: Supabase schema
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- Safe to run again (uses IF NOT EXISTS / ON CONFLICT).

-- ---------------------------------------------------------------------------
-- Accounts: partners and the single master control (admin) account
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id              text primary key,
  role            text not null check (role in ('admin', 'partner')),
  email           text not null unique,
  name            text not null,
  phone           text not null default '',
  password_hash   text not null,               -- scrypt "salt:hash", never the password
  blocked         boolean not null default false,
  blocked_at      timestamptz,
  session_version integer not null default 1,  -- bumped to sign a user out everywhere
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

-- The database itself guarantees there can only ever be one master account.
create unique index if not exists accounts_one_admin on public.accounts (role) where role = 'admin';

-- ---------------------------------------------------------------------------
-- Partner listings (one per partner account)
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id             text primary key,
  owner_id       text not null unique references public.accounts (id) on delete cascade,
  slug           text not null unique,
  property_name  text not null,
  type           text not null check (type in ('hotel', 'lodge', 'apartment')),
  city           text not null,
  address        text,
  summary        text,
  units          integer not null default 1 check (units > 0),
  overnight_rate integer not null check (overnight_rate > 0),
  day_pass_rate  integer not null check (day_pass_rate > 0),
  hourly_rate    integer not null check (hourly_rate > 0),
  window_open    text not null,
  window_close   text not null,
  min_hours      integer not null check (min_hours between 2 and 4),
  amenities      text[] not null default '{}',
  photos         text[] not null default '{}',
  status         text not null default 'coming-soon' check (status in ('available', 'unavailable', 'coming-soon')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Daytime rule: the day pass is 50–70% below the overnight rate.
  constraint listings_discount_50_70 check (day_pass_rate between overnight_rate * 0.30 and overnight_rate * 0.50)
);

create index if not exists listings_status_idx on public.listings (status);

-- ---------------------------------------------------------------------------
-- Labels the admin sets on the built-in catalogue (properties.json)
-- ---------------------------------------------------------------------------
create table if not exists public.seed_statuses (
  property_id text primary key,
  status      text not null check (status in ('available', 'unavailable', 'coming-soon')),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Security: Row Level Security ON with no policies.
-- The public "anon" key and signed-in Supabase users can't read or write anything.
-- Only the Daytime server (service_role key, kept in .env.local) can.
-- ---------------------------------------------------------------------------
alter table public.accounts      enable row level security;
alter table public.listings      enable row level security;
alter table public.seed_statuses enable row level security;

revoke all on public.accounts, public.listings, public.seed_statuses from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for listing photos (read-only to the public;
-- uploads only via the server). 10 MB limit, images only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
