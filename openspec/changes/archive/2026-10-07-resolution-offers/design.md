# Design

## Context

See `proposal.md` for why. Relevant current state:

- `resolution_offers` already exists in `20261002100608_remote_schema.sql` with `booking_id`, `offered_by party_role`, `type offer_type` (`EXTRA_REVISION`, `DISCOUNT`, `CANCELLATION`), `value integer`, `fee integer`, `note`, `status offer_status` (`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`), `expires_at`, `responded_at`, `escalated_at`, `created_at`. It has RLS enabled and **no policy** (one of the six deliberately policy-less tables).
- `payments` already has `creator_amount` and `umkm_refund_amount` columns plus the `status` enum including `RELEASED`, `REFUNDED`, `SPLIT`.
- `apply_booking_transition()` in `20261006120000_booking_lifecycle.sql` is the only writer of `bookings.status`, guarded by `bookings_guard_status`. Its `COMPLETED` branch sets `RELEASED` and `creator_amount = total_amount`; its `CANCELLED` branch leaves the payment alone.
- The list row carries only `payments(status)` (`PAYMENT_STUB`), and the creator dashboard derives held/earnings from status alone.
- Server Actions authorize through the caller's own session (`requireUmkm`/`requireInfluencer`/`requireParty`), then call a DB function through the service-role client.

## Goals / Non-Goals

**Goals:**

- Store and decide the three ladder offers in the database, atomically with whatever each acceptance changes.
- Keep `apply_booking_transition` the only writer of `bookings.status`.
- Make `SPLIT` meaningful end to end: settlement writes both shares and the dashboards count the creator's share, not the whole total.
- Keep expiry honest without a scheduler.

**Non-Goals:**

- Paid extra revisions. The escrow total is immutable and there is no second-payment path, so a paid extra revision needs its own payment mechanism; only free extra revisions are offered now.
- Admin mediation and formal dispute decisions (their own change).
- Escalating an unanswered cancellation offer to the admin after 48 hours; `escalated_at` is left for the admin capability.
- Chat and notifications.

## Decisions

### 1. Reuse `resolution_offers`; add a read policy and one-open-offer index

No new table. The migration adds a party-scoped `SELECT` policy mirroring the one on `bookings` (party resolved from `umkm_id`/`influencer_id` through `profiles`), and a partial unique index `on resolution_offers (booking_id) where status = 'PENDING'` so the database itself enforces "at most one open offer".

Alternative: a new table or a booking status. Rejected — the schema was designed for this, and the ladder explicitly needs no new booking status.

`value` is type-dependent and the column name is generic:

| Type | `value` means | On accept |
| --- | --- | --- |
| `EXTRA_REVISION` | Number of extra revisions (≥ 1) | `revision_quota += value`; state unchanged |
| `DISCOUNT` | The amount the creator will accept, `0 < value < amount` | booking `COMPLETED`, payment `SPLIT`, `creator_amount = value`, `umkm_refund_amount = total - value` |
| `CANCELLATION` | Amount refunded to the business, `0 < value ≤ amount` | booking `CANCELLED`, payment `REFUNDED` if `value = total` else `SPLIT`, `creator_amount = total - value`, `umkm_refund_amount = value` |

`fee` is reserved and SHALL be `0` in this change.

### 2. Offers live in the database, actions authorize

`create_offer(p_booking_id, p_actor_role, p_type, p_value, p_note)` and `respond_to_offer(p_offer_id, p_actor_role, p_accept)` are `security definer` plpgsql functions. The Server Actions resolve the caller's party and scope the call to a booking they proved they are on (user-scoped read first), then call the function through the service-role client — the established pattern. The functions re-derive the actor from `p_actor_role` so they work through either client.

### 3. `apply_booking_transition` stays the only writer of `bookings.status`

`respond_to_offer` calls `apply_booking_transition` for the `COMPLETED`/`CANCELLED` moves (both already legal in the matrix for the accepting role), then settles the payment in the same transaction. For `DISCOUNT` the transition first sets `RELEASED`/full share, and the offer function then overwrites to `SPLIT`/reduced share; for `CANCELLATION` the transition leaves the payment alone and the offer function settles it. The move and the settlement are atomic, and a refused transition rolls the whole offer decision back. The only new writers of `payments.status`/amounts are the offer functions (and the existing release path).

Alternative: teach `apply_booking_transition` about offers. Rejected — it keeps the state machine free of offer specifics; the offer function is the offer-specific settlement, and the guard still protects `bookings.status`.

### 4. Extra revisions are free in this change

The escrow spec forbids changing a payment's total after submission and there is no second payment record. A "paid" extra revision would need either a total change or an extra charge path, both out of scope. So `create_offer` refuses `fee <> 0`, and only free extra revisions are offered. The `fee` column and the ladder's "free or paid" wording are left for a later change.

### 5. Expiry is lazy, not scheduled

No scheduler exists and none is introduced. `create_offer` first marks any overdue `PENDING` offer on the booking `EXPIRED` (so the partial unique index does not block a fresh offer). Reads map a `PENDING` offer whose `expires_at` has passed to `EXPIRED` for display only. `respond_to_offer` refuses an overdue offer and records it `EXPIRED`. So expiry is only ever written in response to a user action, and the stored row may lag the display until then — which the `EXPIRED` display covers.

## Risks / Trade-offs

- [The `DISCOUNT` path writes the payment twice in one transaction (transition then override)] → Same transaction, so the final state is `SPLIT`/reduced share and no observer sees the intermediate; tasks assert the final row.
- [A stale `PENDING` row can block a new offer] → `create_offer` marks overdue siblings `EXPIRED` before inserting.
- [Earnings currently read status only] → Extend the list payment stub with `creator_amount`/`umkm_refund_amount`, and change the creator dashboard to count a `SPLIT` payment's `creator_amount` as earnings and not the refund. `RELEASED` still counts the full total.
- [Two cancellation paths (direct cancel, cancellation offer)] → The direct cancel is unchanged and still settles nothing; the offer is the negotiated, money-settling path. The UI surfaces the offer where held money exists.
- [`REFUNDED`/`SPLIT` become reachable and other screens may assume only `RELEASED`] → grep for `RELEASED` handling and cover the settlement states wherever payments are shown.

## Migration Plan

1. Add `supabase/migrations/<timestamp>_resolution_offers.sql`: the party read policy, the partial unique index, `create_offer`, `respond_to_offer`, and a helper to mark overdue offers expired.
2. `npx supabase db reset` to apply against the local stack; `npm run db:types`.
3. No rollback beyond dropping the functions/policy/index; the table already exists.

## Open Questions

None blocking. Paid extra revisions and cancellation escalation to the admin are explicitly deferred, not unresolved.