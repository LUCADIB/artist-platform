# Artist Booking Marketplace

Full stack artist booking marketplace built with **Next.js 14 (App Router)**, **Supabase**, and **Tailwind CSS**.

All UI text (labels, buttons, headings) is in **Spanish**, while the code and comments are in **English**.

## Tech stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Supabase (Auth, Database, Storage)

## Environment variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # only used on server
```

## Supabase schema (suggested)

You can adapt this to your needs; example SQL:

```sql
-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

-- Artists
create table public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  short_description text,
  bio text,
  avatar_url text,
  category_id uuid references public.categories (id),
  created_at timestamptz default now()
);

-- Artist gallery images
create table public.artist_images (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists (id) on delete cascade,
  image_path text not null,
  is_primary boolean default false
);

-- Artist videos (YouTube / Vimeo / TikTok iframes)
create table public.artist_videos (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists (id) on delete cascade,
  provider text not null, -- youtube | vimeo | tiktok
  url text not null
);

-- Booking requests
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists (id),
  name text not null,
  phone text not null,
  event_date date not null,
  event_time text not null,
  city text not null,
  message text,
  status text not null default 'pending', -- pending | contacted | confirmed
  created_at timestamptz default now()
);

-- Artist availability / blocks
create table public.artist_availability (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists (id) on delete cascade,
  date date not null,
  status text not null, -- available | blocked | booked
  constraint artist_date_unique unique (artist_id, date)
);

-- Profiles linked to Supabase auth
create table public.profiles (
  id uuid primary key references auth.users (id),
  role text not null, -- artist | manager
  artist_id uuid references public.artists (id)
);
```

Configure RLS policies so that:

- Managers can manage all data.
- Artists can only manage their own availability and view their own calendar.
- Public users can read artists and create booking requests.

## Scripts

```bash
npm install
npm run dev
```

