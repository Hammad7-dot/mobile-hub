# MobileHub V0.1

A beginner-friendly Next.js storefront prototype for a Pakistan-focused mobile shop.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Included

- Responsive homepage with search, brands, featured phones and price categories
- Searchable/filterable `/mobiles` catalog
- Dynamic product pages at `/mobiles/[slug]`
- Local-storage cart with quantity controls and totals
- Sample typed product data in `lib/products.ts`
- Responsive desktop, tablet and mobile layouts

## Next milestone

## Supabase and admin setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_marketplace.sql` in the Supabase SQL Editor.
3. Run `supabase/seed.sql`.
4. Copy `.env.example` to `.env.local` and enter the project URL, publishable key, and service-role key. Never expose or commit the service-role key.
5. Create an administrator in Supabase Authentication, then set that profile's role to `admin` as shown at `/admin/setup`.
6. Restart with `npm run dev` and sign in at `/admin/login`.

With credentials configured, storefront products come from PostgreSQL; checkout, tracking, stock confirmation, and used-phone requests are persistent. Without credentials, the storefront remains usable with its fallback demonstration catalog and database actions show a setup message.
