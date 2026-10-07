# Tasks

## 1. Database: offers become real

- [x] 1.1 Add `supabase/migrations/<timestamp>_resolution_offers.sql` with a party-scoped `SELECT` policy `resolution_offers_party_read` mirroring `bookings_party_read`, and a partial unique index `resolution_offers_one_open on (booking_id) where status = 'PENDING'`; verify `npx supabase db reset` applies cleanly and both exist in `pg_policies`/`pg_indexes`
- [x] 1.2 Implement `public.create_offer(p_booking_id, p_actor_role, p_type, p_value, p_note)` as `security definer` plpgsql: resolve the booking, refuse a finished booking, refuse a caller who is not the booking's party, enforce the per-type role and state table and the `value` bounds (`EXTRA_REVISION` ≥ 1; `DISCOUNT` in `(0, amount)`; `CANCELLATION` in `(0, amount]`), require `fee = 0`, mark overdue sibling `PENDING` offers `EXPIRED`, then insert a `PENDING` offer with `expires_at = now() + interval '48 hours'`; verify with SQL assertions that each allowed combination inserts and each refused one raises
- [x] 1.3 Implement `public.respond_to_offer(p_offer_id, p_actor_role, p_accept)`: load the offer `for update`, refuse a non-`PENDING` or overdue offer (recording `EXPIRED` when overdue), refuse the offerer and non-parties, and on decline set `DECLINED`/`responded_at` with no other change; verify the refusal cases with SQL assertions
- [x] 1.4 Implement the accept branches inside `respond_to_offer`, calling `apply_booking_transition` for the status moves and settling `payments` in the same transaction: `EXTRA_REVISION` raises `revision_quota` with no state change; `DISCOUNT` completes the booking then sets `SPLIT` with `creator_amount = value` and `umkm_refund_amount = total - value`; `CANCELLATION` cancels the booking and sets `REFUNDED`/full or `SPLIT`/partial with both shares; mark the offer `ACCEPTED`/`responded_at`; verify each branch with a SQL assertion on both the booking and the payment row
- [x] 1.5 Regenerate `utils/supabase/database.types.ts` with `npm run db:types` and verify the generated file is unchanged apart from whitespace (the table and enums already exist)
- [x] 1.6 Update `DEVELOPMENT.md`: document the two functions, the read policy, the one-open-offer index, the lazy expiry, the `value`/`fee` semantics, and that offers are the settlement writer for `SPLIT`/`REFUNDED`; verify the prose matches the shipped functions

## 2. Settlement states flow through the app

- [x] 2.1 Extend `PAYMENT_STUB` in `lib/data/bookings.ts` to select `status, creator_amount, umkm_refund_amount`, carry the amounts on the list row type, and verify the booking lists still compile and return the new fields
- [x] 2.2 Update the creator dashboard (`app/dashboard/influencer/page.tsx`) so earnings count a `RELEASED` payment's full total and a `SPLIT` payment's `creator_amount`, held stays `HELD`, and a `REFUNDED` payment counts nothing; verify against seeded rows with a manual calculation
- [x] 2.3 Grep every screen that renders a payment or `paymentStatus` (booking detail, dashboards, admin) and make the labels honest for `SPLIT` and `REFUNDED` (for example "Dana dibagi" and "Dana dikembalikan") instead of assuming only held/released; verify each state renders its own text
- [x] 2.4 Update `DEVELOPMENT.md` payment notes for the new reachable states and the earnings rule; verify the doc's rule matches the dashboard code

## 3. Read offers

- [x] 3.1 Add `lib/data/offers.ts` with `getOffersForBooking(bookingId)` reading through the user-scoped client (party policy), mapping rows to a typed `Offer`, and mapping a `PENDING` offer whose `expires_at` has passed to displayed `EXPIRED`; verify with a SQL/REST check that a party sees its offers and a non-party sees none
- [x] 3.2 Load the offers in the booking detail for both dashboards and pass them to the view; verify a booking with an offer renders it and one without renders nothing
- [x] 3.3 Add the offer types to `lib/types.ts` and verify `npm run verify` type-checks

## 4. Server Actions

- [x] 4.1 Add `createOffer(formData)` to `app/actions.ts` following `cancelBooking`/`openDispute`: resolve the party, scope to a booking they are on via the user-scoped read, validate type/value/note client-side for a clear message, call `create_offer` through the service-role client, revalidate, and redirect with `ok`/`gagal`; verify with an HTTP Server-Action test that a party creates an offer and a non-party is refused
- [x] 4.2 Add `respondToOffer(formData)` the same way, calling `respond_to_offer` with the accept flag; verify with an HTTP Server-Action test that the counterparty decides, the offerer cannot, and an overdue offer is refused
- [x] 4.3 Verify the acceptance effects over HTTP end to end: extra revisions raise the quota, a discount completes the booking as `SPLIT`, a full-refund cancellation is `REFUNDED`, and a split cancellation is `SPLIT` with both shares

## 5. UI

- [x] 5.1 Wire `components/booking/OfferCard.tsx` into the booking detail to show each offer's title, description, amount, and status, with `Terima`/`Tolak` submitting `respondToOffer` only for the counterparty; verify an offerer sees status but no buttons and the counterparty sees both
- [x] 5.2 Add the creator offers to `components/booking/CreatorActions.tsx` — `Tawarkan Revisi Tambahan` (with a count), `Tawarkan Potongan Harga` (with an amount) while awaiting review, and `Ajukan Pembatalan` — each rendering only in the states the spec allows; verify the buttons appear and disappear with the booking state
- [x] 5.3 Add the business offers to `components/booking/UmkmActions.tsx` — `Ajukan Pembatalan` with a refund amount — and render the pending-offer response area; verify the form submits `createOffer` and a refusal shows a message
- [x] 5.4 Update `DEVELOPMENT.md` UI notes or `components/README.md` for the offer card usage; verify the described usage matches the wired component

## 6. Integration and close-out

- [x] 6.1 Extend the lifecycle e2e script to drive a booking into `SUBMITTED`, then settle it three ways (extra revision, discount, cancellation) and assert the resulting booking and payment rows; verify the script passes against the local stack
- [x] 6.2 Run `npm run verify`, `npm run lint`, and a clean `npm run build` (with the dev server stopped and `.next` removed first) and confirm all pass
- [x] 6.3 Run `openspec validate resolution-offers --strict` and `openspec validate --all` and confirm the change and every spec are valid