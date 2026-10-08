# Proposal

## Why

A collaboration request currently has no life of its own. `lib/types.ts` declares four statuses — `PENDING`, `APPROVED`, `DONE`, `REJECTED` — and the SQLite prototype moves between them inside the booking pages, while the Postgres schema already defines nine and carries a timestamp for every milestone plus a `booking_events` table built to record who moved a request and from what state to what state. Nothing reads or writes any of it. This change turns a request into a sequence of states that the database itself polices, with the legal moves written down in one place, and it puts the escrow record and the revision quota on the same footing.

## What Changes

- Add one database function that owns the state machine. It locks the request, accepts only the defined moves, sets the timestamps each move implies, records a timeline entry, and updates the payment's state — all in the caller's transaction. Three thin wrapper functions delegate to it for the moves that must also write a delivered round, a revision request, or a dispute, so the state change and its evidence commit together.
- Refuse any other write to a request's state with a trigger, so the function is the only path rather than merely the documented one.
- Create a request's payment record when it is accepted, copy the total from the amount recorded at submission, and move that record from unpaid to held to released as the request progresses.
- Maintain the revision counter with a trigger on revision requests, and enforce the quota with a sibling trigger, so a revision marked outside the brief does not consume quota and a revision within it cannot exceed what the package allowed.
- Add the actions for accept, decline, pay, submit content, request revision, submit revision, approve and release, cancel, open dispute, and extend the review window — each refusing a caller who is not a party.
- Let either party read its own requests, with the brief, package terms, amounts, rounds, revision requests, and full timeline.
- Record and display the payment due time, production deadline, review due time, and dispute due time without any code reading them.

## Capabilities

### New Capabilities

- `booking-lifecycle`: which moves between states are legal, which party may make each one, what each move records, when a request stops accepting changes, and how both parties read it.
- `escrow-payments`: how a payment record comes into existence, how it moves from unpaid to held to released, what the recorded amounts are, and what a creator's earnings and a business's outstanding payments are derived from.
- `revisions`: how a request's revision quota is set and shown, what a revision request must contain, when a revision consumes quota, and when the option to open a dispute appears.

### Modified Capabilities

- None. `creator-catalog` from `catalog-and-booking` requires that a submitted request appear in both parties' lists, and this change does not alter that requirement — it extends what happens after the request exists. Nothing in `booking-lifecycle`'s own behaviour changes an existing capability.

## Impact

- `supabase/migrations/<new>.sql` — the transition function, the three wrapper functions, the review-window function, the guard trigger on `bookings`, the counter and quota triggers on `revision_requests`, and indexes for the party-and-state lookups the history pages use
- `app/actions.ts` — nine lifecycle actions and one review-window action, each reading through the caller's own session before writing
- `app/(umkm)/dashboard/riwayat/page.tsx`, `app/(umkm)/dashboard/riwayat/[id]/page.tsx`, `app/dashboard/influencer/riwayat/page.tsx` — read the rounds, revision requests, amounts, and timeline instead of prototype fields
- `lib/types.ts` — the four prototype statuses are already replaced with the nine enum values by `catalog-and-booking`; this change is the first code to move between them
- `ARCHITECTURE.md` §6 — corrected so a delivery is a content link with an optional note, matching `deliveries.content_url NOT NULL`
- `DEVELOPMENT.md` — a new section recording that every booking mutation goes through a function and that the four due-date columns are displayed only
- No schema columns are removed and no page URL changes.

## Notes for the reviewer

- No clocks are introduced. Nothing reads `payment_due_at`, `deadline_at`, `review_due_at`, or `disputes.due_at`, so an overdue request never changes state on its own. That is deliberate and is recorded in `design.md` decision 9 with what it costs.
- No real money moves, and no refund or split exists. A cancelled request leaves its held payment exactly where it was, and the interface is required to say so rather than present it as settled.
- A dispute can be opened but not read: `rls-access-control` left `disputes` and `dispute_infos` policy-less on purpose, and nothing here grants access. The dispute capability is what closes that, and it comes after the reviews change.
- `CANCELLED` and `DISPUTED` are in the transition matrix from this change even though their downstream capabilities are deferred, so extending the matrix later is additive rather than a correction.
