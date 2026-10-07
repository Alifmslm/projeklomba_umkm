# Proposal

## Why

The booking lifecycle ends in a dead end: when the two parties cannot agree on the delivered content, the only offered step is a formal dispute with an admin decision. ARCHITECTURE §2.6 puts three lighter, self-service steps before that (extra revisions, a price reduction, mutual cancellation), but none of them exists — there is no table policy, no function, and no action behind the `resolution_offers` table that already ships in the schema. Without them, every disagreement becomes an admin case even when the parties could settle it themselves.

## What Changes

- Turn the already-existing `resolution_offers` table into a working settlement channel with a read policy for the booking's two parties.
- Add database functions to **create**, **accept/decline**, and lazily **expire** an offer; the offer decision (accept) is the only place a settlement is applied to the held payment.
- Support the three offer types from the ladder (steps 3–5):
  - `EXTRA_REVISION` — the creator offers more revisions; accepting raises the booking's revision quota by the offered count. Free only in this change (see design).
  - `DISCOUNT` — the creator offers to accept less; accepting releases the reduced amount to the creator, refunds the difference to the business, and completes the booking (`payment = SPLIT`).
  - `CANCELLATION` — either party asks to cancel with a refund term; accepting ends the booking and refunds in full (`REFUNDED`) or in part (`SPLIT`).
- Enforce one open offer per booking, refuse a decision from anyone but the counterparty, and treat a window that has passed as expired without a scheduler.
- Surface offers in both booking-detail views (buku/tawaran section) and wire the existing `OfferCard` component to real data and Server Actions.
- **BREAKING** (conceptually): amend `escrow-payments` so a settlement is allowed on cancellation when it is accepted as a cancellation offer. The existing direct cancel still settles nothing.

## Capabilities

### New Capabilities
- `resolution-offers`: the offer record, who may create which offer from which state, how the counterparty accepts or declines it, how an unanswered offer expires, and what accepting each type changes.

### Modified Capabilities
- `escrow-payments`: a discount accepted as an offer releases only the discounted amount (`SPLIT`), and a cancellation accepted as an offer settles the held payment (`REFUNDED` or `SPLIT`); other cancellations still release nothing.

## Impact

- Database: a new migration enabling a party read policy on `resolution_offers` and adding `create_offer`, `respond_to_offer`, and overdue-expiry handling; `payment_status` values `SPLIT`/`REFUNDED` become reachable for the first time.
- Data layer: a new `lib/data/offers.ts` reader, plus the booking detail loading offers.
- Server Actions: `createOffer` and `respondToOffer` in `app/actions.ts`, following the existing party-scoped read then service-role RPC pattern.
- UI: `components/booking/CreatorActions.tsx`, `components/booking/UmkmActions.tsx`, `BookingDetailView.tsx`, and `components/booking/OfferCard.tsx`.
- Docs: `DEVELOPMENT.md` (offer functions, the new policy, settlement writes) and `ARCHITECTURE.md` if the action tables need a note. Dispute, chat, and notifications remain out of scope.