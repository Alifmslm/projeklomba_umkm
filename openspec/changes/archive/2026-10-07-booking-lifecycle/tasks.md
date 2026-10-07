# Tasks

No test runner is installed, so verification here is `npm run lint`, `npm run build`, SQL assertions called directly against the database, and a browser walkthrough of each scenario in the three spec deltas.

## 1. The state machine

- [x] 1.1 Add `apply_booking_transition(p_booking_id bigint, p_to booking_status, p_actor_role actor_role)` to a new migration, locking the booking with `SELECT ... FOR UPDATE` and returning the updated row, and verify calling it with a nonexistent booking raises rather than returning
- [x] 1.2 Express the legal moves as a `VALUES` list of `(from_status, to_status, required_actor_role)` inside the function and reject anything not in it, and verify every move in the spec delta's list is accepted and every other pair is refused
- [x] 1.3 Confirm the matrix has no outgoing rows for `COMPLETED`, `REJECTED`, or `CANCELLED`, and verify every action attempted on a request in each of those three states is refused
- [x] 1.4 Have the function set only the timestamps its own move implies and take no patch parameter, and verify a caller cannot set `accepted_at`, `funded_at`, `completed_at`, or any other column through it
- [x] 1.5 Have the function insert the `booking_events` entry with `from_status`, `to_status`, `actor_id`, and `actor_role` for every accepted move and insert none for a refused one, and verify both by querying `booking_events` before and after a refused call
- [x] 1.6 Verify the required actor role per move, and confirm the matrix refuses a creator accepting through the business's move and a business releasing through the creator's move
- [x] 1.7 Verify two concurrent calls to the same transition produce one commit and one refusal, by issuing them in two sessions and confirming the refused one raises

## 2. Keeping the function the only path

- [x] 2.1 Add a `BEFORE UPDATE` trigger on `bookings` that raises when `status` changes without the transition function's transaction-local flag set, and verify a direct `UPDATE bookings SET status` is refused while the function's own update succeeds
- [x] 2.2 Verify the same trigger permits ordinary column edits, and confirm an update to `brief`, `revisions_used`, and `review_extended` all pass through untouched
- [x] 2.3 Verify the flag is transaction-local and does not leak, by setting it in one transaction and confirming a status change in the next transaction is still refused

## 3. Payment state

- [x] 3.1 Create the payment record inside the transition to `ACCEPTED`, with `total_amount` copied from `bookings.amount` and status `UNPAID`, and verify exactly one record exists afterwards with the amount matching the request
- [x] 3.2 Confirm no payment record is created for any other move, and verify a request that is accepted then cancelled still has exactly one record and it is still `UNPAID`
- [x] 3.3 Move the payment to `HELD` on the transition to `FUNDED` and to `RELEASED` with `creator_amount` set to the full total on the transition to `COMPLETED`, and verify the payment state after each of those three moves
- [x] 3.4 Leave the payment untouched on cancellation and on any refusal, and verify a held payment on a cancelled request is still held with `creator_amount` at zero
- [x] 3.5 Confirm no other code path writes `payments.status` and no other code path writes `creator_amount` before release, and verify by grepping the actions for direct payment updates

## 4. Quota and rounds

- [x] 4.1 Add an `AFTER INSERT` trigger on `revision_requests` that increments `bookings.revisions_used` only when `within_brief` is true, and verify the counter rises for a within-brief request and not for an outside-brief one
- [x] 4.2 Add a `BEFORE INSERT` trigger on `revision_requests` that raises when `within_brief` is true and `revisions_used` already equals `revision_quota`, and verify a within-brief request at the limit is refused and the booking's state is unchanged
- [x] 4.3 Verify an outside-brief request is still accepted after the quota is used up, and verify the counter does not move while the number of rounds does
- [x] 4.4 Verify the counter never exceeds the recorded quota, by driving a request through every revision it is allowed and comparing the two values
- [x] 4.5 Report the quota refusal as "the quota is used up" and point at opening a dispute, and verify that is the message shown

## 5. Actions

- [x] 5.1 Add accept, decline, pay, submit content, request revision, submit revision, approve and release, cancel, and open dispute Server Actions, each beginning by fetching the request through the caller's own session and refusing when nothing is returned, and verify each refuses for a caller who is not a party
- [x] 5.2 Confirm the fetch-before-write order is what refuses a non-party, by checking that the service-role client is only reached after the user-scoped read returned the request
- [x] 5.3 On accept, set `brief_locked_at` and `payment_due_at`, refuse any attempt to edit the brief afterwards, and verify the two times are shown to both parties
- [x] 5.4 On pay, set `funded_at` and a `deadline_at` derived from the package's `estimated_days`, and verify both are displayed and that nothing changes when the displayed deadline passes
- [x] 5.5 Add `extend_review_window(p_booking_id)` as a function and wire it to an action, and verify it succeeds once on a request awaiting a decision, refuses a second attempt, and refuses a request with no submitted content
- [x] 5.6 Add the three wrapper functions `submit_delivery`, `request_revision`, and `open_dispute`, each delegating to `apply_booking_transition` in the same transaction, and verify a forced failure inside a wrapper leaves the booking's state unchanged with no child row written
- [x] 5.7 Refuse a delivery submitted without a content link and accept one with a link and no note, and verify a round is recorded with its number, link, note, and time
- [x] 5.8 Refuse a revision request missing its section or its note, and refuse one naming a round it has already raised a revision request about

## 6. Disputes

- [x] 6.1 Refuse opening a dispute while revision quota remains and accept it once the quota is fully used, and verify each case
- [x] 6.2 On opening, insert a dispute row with a distinct code, the reason, the opener, an awaiting-decision status, and a due date defaulting to the stated window, and verify no information row is inserted
- [x] 6.3 Verify a dispute's due date is displayed and that nothing acts on it when it passes
- [x] 6.4 Verify a second dispute on the same request is refused, and verify a dispute code never collides with an existing one
- [x] 6.5 Verify the request shows the disputed state to both parties while the dispute row itself remains unreadable through the caller's own session, and record that gap in the change notes for the dispute capability to close

## 7. Reading requests

- [x] 7.1 List a business's sent requests and a creator's incoming requests with the other party's name, package, amount, and current state, and verify the two lists show the same request with the same values from each side
- [x] 7.2 Open one request and show the brief as submitted, the package terms as recorded, the recorded amounts, the rounds, the revision requests with their within-or-outside flag, and the full timeline, and verify both parties see identical content
- [x] 7.3 Verify a visitor who is not a party receives nothing when requesting a request by its reference code, and that the party-scope policy on `bookings` is what refuses it
- [x] 7.4 Show the same state in the list, on the detail page, and in the dashboard count, and verify the three agree for a request in each non-initial state
- [x] 7.5 Verify a finished request offers no action and that a direct call to any action on it is refused

## 8. Documentation

- [x] 8.1 Document in DEVELOPMENT.md that every booking mutation goes through a function, that `apply_booking_transition` is the only writer of `bookings.status`, and that Server Actions must fetch through the caller's own session before writing, and verify each statement is present
- [x] 8.2 Document that `payment_due_at`, `deadline_at`, `review_due_at`, and `disputes.due_at` are displayed only and that no code reads them, so a later reader does not assume a missing job is a bug, and verify the note names all four columns
- [x] 8.3 Correct ARCHITECTURE.md §6 so a delivery is described as a content link with an optional note, matching `deliveries.content_url NOT NULL`, and verify no other passage still describes it as a link or a note
- [x] 8.4 Record in DEVELOPMENT.md that a dispute can be opened but not yet read, and that `rls-access-control` left `disputes` and `dispute_infos` policy-less on purpose

## 9. Integration checks

- [x] 9.1 Drive one request through the whole legal sequence — pending, accepted, paid, submitted, revision requested, revision submitted, completed — and verify every state, timestamp, timeline entry, and payment state along the way
- [x] 9.2 Drive a second request through decline and a third through cancel at each cancellable state, and verify the recorded outcome of each
- [x] 9.3 Recompute `revisions_used` for every booking with an independent query and compare it against the stored value, and verify the two agree for bookings with within-brief, outside-brief, and no revisions
- [x] 9.4 Walk every scenario in `specs/booking-lifecycle/spec.md`, `specs/escrow-payments/spec.md`, and `specs/revisions/spec.md` once against a running dev server, and verify each produces the stated result
- [x] 9.5 Run `npm run lint` and `npm run build` and verify both pass with no new warnings
- [x] 9.6 Run `openspec validate booking-lifecycle --strict` and verify the change and all three spec deltas validate with no findings
