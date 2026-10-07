# Design

## Context

See `proposal.md` — Why. Current state, verified against the remote schema dump:

- `bookings` already carries the snapshot columns (`package_name`, `amount`, `revision_quota`, `estimated_days`, `code UNIQUE`, `brief NOT NULL`, `revisions_used DEFAULT 0`, `review_extended DEFAULT false`) and a timestamp for every milestone: `brief_locked_at`, `accepted_at`, `payment_due_at`, `funded_at`, `deadline_at`, `submitted_at`, `review_due_at`, `completed_at`, `cancelled_at`. `status` is `booking_status NOT NULL DEFAULT 'PENDING'`.
- `booking_status` has nine states: `PENDING`, `ACCEPTED`, `FUNDED`, `SUBMITTED`, `REVISION`, `DISPUTED`, `COMPLETED`, `REJECTED`, `CANCELLED`.
- `booking_events` exists with `from_status`, `to_status NOT NULL`, `actor_id` (FK `auth.users ON DELETE SET NULL`), and `actor_role actor_role NOT NULL` where `actor_role` is `umkm | influencer | admin | system`.
- `payments` has `booking_id`, `total_amount NOT NULL`, `creator_amount DEFAULT 0`, `umkm_refund_amount DEFAULT 0`, a `status` column, and a unique constraint on `booking_id` — so at most one payment record per booking.
- `deliveries` has `round`, `content_url text NOT NULL`, `note` nullable, and `UNIQUE (booking_id, round)`.
- `revision_requests` has `delivery_id`, `round`, `section NOT NULL`, `note NOT NULL`, `within_brief NOT NULL DEFAULT true`, and **`UNIQUE (delivery_id)`** — one revision request per delivered round, naming one section.
- `disputes` has `code UNIQUE`, `booking_id UNIQUE`, `reason NOT NULL`, `due_at NOT NULL`, `paused_at`, `creator_share_percent` with a 0-100 check, `decision_note`, `decided_by`, `decided_at`, plus `status` and `decision` added by `ALTER TABLE`. `dispute_infos` holds a `question NOT NULL` and an optional `answer`.
- `rls-access-control` gives `bookings` and all four booking-owned tables a party-scoped read policy, and gives no table a write policy.
- The browser key is granted all verbs on every table, so every refusal is RLS refusing, not privileges.
- `ARCHITECTURE.md` §2.1 defines the nine states, §2.5 the timing rules and the "revision outside the brief does not consume quota" rule, and §2.6 the resolution ladder. §2.5's rules are display-only in this scope: nothing reads the due dates.
- `ARCHITECTURE.md` §6 says a delivery is a "content link **or** note", but `deliveries.content_url` is `NOT NULL`. The schema is the stricter of the two and this change follows it; the doc is corrected in task 8.3.

## Goals / Non-Goals

**Goals:**
- One place decides whether a state change is legal, so the matrix cannot drift between the actions and the database.
- A state change and everything it implies — its timestamps, its timeline entry, its payment state, its new child row — commit together or not at all.
- Counters and quotas that depend on a fact about a child row are maintained where that row is written.

**Non-Goals:**
- No clocks. Nothing reads `payment_due_at`, `deadline_at`, `review_due_at`, or `disputes.due_at`. No scheduled job, no trigger, no function consults them to change a state. They are recorded and displayed so a person can see them.
- No money movement. No refund, no split, no partial release. A cancelled booking leaves its payment exactly where it was.
- No dispute resolution. A dispute is opened, recorded, and left awaiting a decision. The ladder in §2.6, `resolution_offers`, and the admin console are separate capabilities.
- No chat. `disputes` and `dispute_infos` get their first rows here and remain unreadable, because `rls-access-control` left them policy-less on purpose.
- No notifications. Nothing writes to `notifications` even though a "request received" row type exists.
- No review flow. That is change 5.

## Decisions

1. **One `apply_booking_transition()` function owns the state machine, not eight functions.**
   Signature: `apply_booking_transition(p_booking_id bigint, p_to booking_status, p_actor_role actor_role)`. It locks the row, checks the requested move against a matrix expressed as a `VALUES` list of `(from_status, to_status, required_actor_role)`, sets the timestamps that move implies, updates `payments.status`, and inserts the `booking_events` entry — all in the caller's transaction. It takes no patch parameter: the caller cannot set a timestamp or a column, because the function derives them from the move it validated.
   *Alternative:* one function per transition — rejected, eight copies of the same lock-validate-write-log sequence is eight places for the matrix to drift, which is the specific bug this design exists to prevent.
   *Alternative:* enforce the matrix in each Server Action — rejected, that puts a nine-state rule in eight TypeScript files where it cannot be read next to the data it constrains, and nothing stops the ninth action from skipping the check.

2. **The matrix lists the states that may move, not the states that are terminal.**
   A move is legal when a row exists for `(OLD.status, p_to, p_actor_role)`. Terminal states have no outgoing rows, so `COMPLETED`, `REJECTED`, and `CANCELLED` reject everything without needing a special case.
   `CANCELLED` and `DISPUTED` appear in the matrix from this change even though their downstream capabilities are deferred. Leaving them out would mean editing the matrix later to add them, and an action that is not in the matrix refuses rather than corrupts anything, so having them early costs nothing.

3. **Party membership is proved by reading the booking through the caller's own session before writing.**
   Each action fetches the booking with the user-scoped client first. If RLS returns nothing, the caller is not a party and the action refuses. The write then goes through the service-role client.
   This is why the service-role client is safe here even though it bypasses RLS: the only bookings it is ever asked to modify are ones the caller has already demonstrated they can read, which under `rls-access-control` means they are named on it. The policy set does the authorization; the service role just gets out of the way.
   *Alternative:* pass the caller's user id into the database function and let it compare against the booking — rejected, that moves authorization into Postgres and contradicts the split where the application owns authorization and Postgres owns invariants. It would also mean the party check lives in two places, since the policy already performs it.

4. **Three thin wrapper functions exist for the transitions that must also write a child row.**
   `submit_delivery(...)`, `request_revision(...)`, and `open_dispute(...)` each perform their own inserts and then call `apply_booking_transition` inside the same transaction. Postgres functions run in the caller's transaction, so calling one from another is atomic for free.
   The alternative — transition first, then insert the child row from the action — leaves real inconsistency: a booking sitting in `REVISION` with no revision request naming it, which the revisions spec would then be violating. Making the state machine generic enough to accept child rows would have turned it into a small ORM with a JSON parameter, which is harder to read than three named functions.
   So: one state machine, three named wrappers that delegate to it. The matrix stays in one place and the atomicity is real.

5. **`payments.status` is updated by the transition function, in the same transaction, and by nothing else.**
   The mapping is fixed: reaching `ACCEPTED` creates the payment row as `UNPAID` with `total_amount` copied from `bookings.amount`; reaching `FUNDED` moves it to `HELD`; reaching `COMPLETED` moves it to `RELEASED` and sets `creator_amount` to the full total. `CANCELLED` deliberately leaves it alone, which is what the escrow spec requires.
   The payment record is created on acceptance rather than at submission because that is the moment money becomes owed. Creating it at submission would make a request the creator may still decline look like it owes money, and would add a third non-atomic write to the submission action that `catalog-and-booking` already ships.

6. **A `BEFORE UPDATE` trigger on `bookings` refuses any status change that did not come from the transition function.**
   The function sets a transaction-local flag with `set_config('kolab.in_transition', '1', true)`; the trigger raises unless the flag is set or the status is unchanged. Every other `bookings` update still works normally, so ordinary column edits are unaffected.
   This is the one piece of machinery here that exists purely to defend an invariant, and it is included because the whole booking guarantee rests on the function being the only path. A trigger that catches a future direct `UPDATE bookings SET status` is worth more than a comment asking the next person not to.
   *Alternative:* rely on review and on `REVOKE UPDATE (status)` — rejected, the service role bypasses column privileges, so revoking would not stop the one caller that matters.

7. **`revisions_used` is a trigger's job, not the action's.**
   `revision_requests.within_brief` already defaults to `true`, and an `AFTER INSERT` trigger increments `bookings.revisions_used` only when that flag is set. The counter's correct value is a fact about the revision row, so it is maintained where the row is written.
   *Alternative:* increment it in the request action — rejected, it puts a quota counter in the hands of whichever caller remembers to update it, and the next writer will not.

8. **Quota enforcement is a `BEFORE INSERT` trigger, in the same place as the counter.**
   The trigger raises when `within_brief` is true and `revisions_used >= revision_quota`. Because the counter is maintained by the sibling trigger, a check in the action would read a value the database owns and could be made to disagree. A revision marked outside the brief passes, which is §2.5's rule and the reason the counter is conditional.

9. **Due dates are written and read by the interface, and by nothing else.**
   Reaching `ACCEPTED` sets `payment_due_at` to a stated window; reaching `FUNDED` sets `deadline_at` from the package's `estimated_days`; reaching `SUBMITTED` sets `review_due_at`. No function, trigger, or scheduled job reads them. An accepted request never expires and a funded request never times out.
   That is a deliberate scope decision rather than an omission. Zero clocks removes an entire failure mode — a booking cancelling itself mid-demonstration because a job ran — at the cost of behaviour nobody is building yet. The dates are still recorded, because showing a participant when something is expected is useful even when nothing enforces it.
   *Alternative:* a nightly sweep that cancels overdue requests — rejected for this scope; it is a small addition later and an unrecoverable demo failure now.

10. **Extending the review window gets its own small function rather than a guarded update from the action.**
    `extend_review_window(p_booking_id)` requires status `SUBMITTED` and `review_extended` false, sets the flag, and moves `review_due_at` later by the stated amount. Keeping it beside the state machine means every booking mutation in the system is a function, and "once per request" is enforced where it cannot be raced.
    *Alternative:* an `UPDATE ... WHERE review_extended = false` from the action — rejected, it is the one booking mutation that would then live outside the function set, and the row count it returns is a poor way to report "you already extended this".

11. **A delivered round requires a link; the note is optional.**
    `deliveries.content_url` is `NOT NULL` and the spec follows it. The deliverable is published content that has a location, and a round recorded with only prose would be a row nobody can check.
    This diverges from ARCHITECTURE.md §6, which describes the delivery as a link *or* a note. The schema is the stricter of the two and is already applied remotely, so weakening a `NOT NULL` for a case the product does not need would be the larger change. Task 8.3 corrects the document.

12. **One revision request per round, naming one section, because `revision_requests.delivery_id` is unique.**
    A business that spots problems in two sections of the same round raises one, the creator resubmits, and the second point is raised against the new round. That is the schema's existing shape and the revisions spec states it, so the limitation is visible rather than discovered as a unique-violation error.
    *Alternative:* allow several revision requests per round by dropping the constraint — rejected, it changes a rule the spec already states and buys a workflow with no benefit.

13. **Opening a dispute records a due date and stops there.**
    `open_dispute(...)` moves the booking to `DISPUTED` and inserts a `disputes` row with a `code`, the `reason`, `opened_by`, `status` awaiting a decision, and a `due_at` defaulting to a stated window. It inserts no `dispute_infos` row, because asking the creator questions is part of the resolution capability.
    The party that opened the dispute cannot then read it: `rls-access-control` left `disputes` and `dispute_infos` with no policy, and nothing in this change grants access. The spec delta says the dispute is recorded as awaiting a decision and does not promise it is visible, so the two agree — but the gap is real and is listed under Risks.

14. **Concurrency is handled by the row lock, and reported as a refusal.**
    `SELECT ... FOR UPDATE` in the transition function serialises two simultaneous actions. The second one wakes up, finds `OLD.status` already moved, finds no matching row in the matrix, and raises. The action surfaces that as "this request has already moved", which is the outcome the spec describes as only the first action taking effect.
    No retry is attempted, because a retry would be trying to apply a transition that is no longer legal.

## Risks / Trade-offs

- [The transition function is a single point of failure for the whole booking lifecycle] → It is one function with one `VALUES` list and no branching beyond it, and the matrix is asserted directly against the spec's move list in the integration tasks. `CANCELLED` and `DISPUTED` are already in the matrix so that extending it later is additive.
- [A dispute can be opened but not read] → Recorded in decision 13 and verified by task 6.5, which asserts the booking shows the disputed state while the dispute row itself remains unreadable. The dispute capability is what closes it, and it is next in the roadmap after change 5.
- [`revision_requests.delivery_id` being unique limits a business to one section per round] → Stated as a scenario in the revisions spec and in decision 12, so it reads as a designed workflow rather than a constraint discovered at runtime.
- [The `BEFORE UPDATE` trigger on `bookings` will also fire on ordinary column edits] → It raises only when `status` actually changes without the flag, so edits to the brief, the counter, or the flags pass through untouched. Task 5.5 verifies both halves of that.
- [Counters maintained by triggers drift if a row is inserted outside the trigger's visibility] → `revision_requests` has no write policy, so the only writer is a Server Action calling through the function. The integration task recomputes `revisions_used` independently and compares.
- [Money on a cancelled booking stays held with no path to settle it] → This is what the scope says, and the escrow spec requires the system to report it as unsettled rather than resolved. A cancellation refund is a small addition to the transition function's `CANCELLED` branch when that capability is built.
- [No clocks means overdue requests sit indefinitely] → Deliberate, per decision 9. Both parties can see the displayed due dates, so nothing is hidden from the people involved.
- [Three wrapper functions could drift from the matrix they delegate to] → Each one calls `apply_booking_transition` rather than writing `bookings.status`, so none of them can express a move the matrix forbids. Task 6.6 asserts each wrapper refuses an out-of-matrix argument.

## Migration Plan

1. Add `supabase/migrations/<new>.sql` containing, in order: the `within_brief` default confirmation, the `apply_booking_transition` function, the three wrapper functions, `extend_review_window`, the `BEFORE UPDATE` guard trigger on `bookings`, the counter and quota triggers on `revision_requests`, and indexes for `bookings(umkm_id, status)`, `bookings(influencer_id, status)`, and `revision_requests(booking_id)`.
2. Backfill nothing: existing bookings are all `PENDING` and have no payment rows, so no migration step is needed to make the functions usable.
3. Apply to a scratch project and run the matrix assertions directly against the function, without the application, so a mistake in the state machine is found before it is reachable from a page.
4. Add the Server Actions, then repoint `app/(umkm)/dashboard/riwayat/page.tsx`, `app/(umkm)/dashboard/riwayat/[id]/page.tsx`, `app/dashboard/influencer/riwayat/page.tsx`, and the matching creator detail page.
5. Rollback is a revert of steps 1 and 4. Dropping the functions and triggers is clean and leaves every row as it is; no data is rewritten, so a rollback after bookings have moved through states simply stops further movement rather than corrupting what already happened.

## Open Questions

- Should `booking_events` record a human-readable reason for moves that can fail for a reason worth explaining, such as a revision refused because the quota is used up? A refused move currently leaves no entry, since only committed changes are logged. Recording refusals would need a second log or a status column, and neither is needed to satisfy anything in the spec.
- Should the dispute gate also open when a request has been in `SUBMITTED` past its displayed review due time? That would reintroduce a clock reading a due date, which this scope excludes on purpose.
- Should `disputes.paused_at` gain a matching resume time so a pause's length can be computed? ARCHITECTURE.md §2.5 requires the clock to stop while a dispute is paused, but with no clock in this scope the field has nothing to pause, so it is recorded as unused until the resolution capability needs it.
