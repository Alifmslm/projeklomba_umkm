-- Snapshot a package's included items onto the booking that was submitted from it.
--
-- Why this file exists
-- --------------------
-- `booking-request` already copies the package's name, price, revision quota and
-- estimated days onto the booking, so a later edit to the package cannot rewrite
-- what a signed request agreed to. The spec's included-items scenario makes the
-- same promise about what the package includes: "that request still shows the
-- included items recorded at submission".
--
-- That promise cannot be kept by reading `packages.includes` at render time,
-- because the package is exactly what changes. So the list is copied at
-- submission like the other terms, and this column is where it lands.
--
-- `packages.includes` is jsonb (an array of strings), so this is too, and the
-- default keeps a booking created before this column existed valid.
alter table public.bookings
  add column if not exists package_includes jsonb not null default '[]'::jsonb;

comment on column public.bookings.package_includes is
  'Snapshot of packages.includes at submission time. Never re-read from packages; see booking-request spec.';