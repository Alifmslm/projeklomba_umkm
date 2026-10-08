# Design

## Context

See `proposal.md` — Why. Current state, verified against the remote schema dump and the prototype:

- `reviews` has `booking_id NOT NULL`, `rating integer NOT NULL` with `reviews_rating_check CHECK (rating >= 1 AND rating <= 5)`, `comment text` nullable, `created_at`, and `reviewer_role party_role NOT NULL` added by `ALTER TABLE`. It has **`UNIQUE (booking_id, reviewer_role)`** and `FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE`. It has no `reviewer_id` column, so a reviewer's identity is fully derivable from the booking and `reviewer_role`.
- `rls-access-control` adds `reviewee_umkm_id` and `reviewee_influencer_id` with `num_nonnulls(...) = 1`, and grants `reviews` public read.
- `influencers.rating numeric(2,1) NOT NULL DEFAULT 0` and `review_count integer NOT NULL DEFAULT 0` are the denormalized summary. `umkms` has no rating column at all.
- The prototype's `lib/data.ts` performs the rollup by hand inside `createReview`, updating the creator's rating in application code, and `getReviewsForInfluencer` filters on `reviewee_type` and `reviewee_id`, columns that exist only in SQLite.
- `app/review/[bookingId]/page.tsx` already exists and reads SQLite.
- `booking-lifecycle` provides the completed state and the transition function; a review is only possible once a request is `COMPLETED`.

## Goals / Non-Goals

**Goals:**
- The rating a creator displays cannot be wrong, including when a review arrives while another one is being written.
- A review cannot be aimed at the wrong party by a caller that supplies its own values.
- Reviews are permanently readable and permanently unchangeable.

**Non-Goals:**
- No rating for businesses. `umkms` has no rating column and adding one would be a product decision nobody has made.
- No dispute resolution. Reviews opening after a dispute decision are spec'd but unreachable until that capability exists.
- No moderation, reporting, flagging, or admin removal of a review. `rls-access-control` grants no write policy on `reviews`, so no such path exists today.
- No reply to a review, no creator response, no edit window.
- No notifications to the reviewed party.
- No change to any page URL.

## Decisions

1. **The reviewer and the reviewee are derived from the booking, never accepted from the caller.**
   The action receives only a rating and an optional comment. It resolves which party the caller is from `requireRole`, and because `UNIQUE (booking_id, reviewer_role)` already encodes "one review per party per booking", `reviewer_role` is the caller's role and the reviewee is the other party. `reviewee_umkm_id` or `reviewee_influencer_id` is set to the other party's id, satisfying the `num_nonnulls = 1` check added by `rls-access-control`.
   This is what makes the "the browser names a different party" scenario pass by construction rather than by validation: there is no parameter to validate.
   *Alternative:* accepting `reviewer_role` and a reviewee id as parameters and checking them — rejected, it moves a rule the database can derive into a place where a mistake becomes a misattributed public review.

2. **The rating rollup is a database trigger, and it recomputes rather than increments.**
   An `AFTER INSERT` trigger on `reviews` recomputes the affected creator's `rating` as `round(avg(rating), 1)` and `review_count` as `count(*)` over the reviews naming that creator.
   Recomputing costs a scan over one creator's reviews and is idempotent, self-healing, and immune to the arithmetic error that an increment-plus-divide produces on the second review. Incrementing would need to track a running sum and a count separately, and there is nowhere in the schema to keep the sum.
   `round(..., 1)` is required because `influencers.rating` is `numeric(2,1)`; an unrounded average would fail the insert.

3. **A trigger refuses updates and deletes on `reviews`.**
   The rollup only reacts to `AFTER INSERT`, so an update or a delete would leave `influencers.rating` stale with nothing to correct it. The `BEFORE UPDATE OR DELETE` trigger makes the invariant enforced rather than merely absent. The one delete it lets through is the cascade from deleting a booking (decision 7), which is unreachable because nothing deletes a booking.
   This mirrors the `bookings.status` guard in `booking-lifecycle`: where a denormalized value depends on a table's contents, that table stops being mutable.

4. **A creator with no reviews shows no figure, not a zero.**
   `influencers.rating` defaults to `0`, which is indistinguishable from a genuine score of zero and from a genuine average of 0.0 after rounding. So the interface branches on `review_count`: above zero it shows the rating, and at zero it shows that the creator has not been reviewed.
   The alternative — showing `0.0` — would put creators with no reviews at the bottom of a rating sort alongside creators who were reviewed badly, which is a claim the data does not support. The spec states this as a scenario so it cannot be quietly reverted.
   *Note:* `booking-lifecycle`'s catalog scenarios already require creators with no rating to sort after those that have one, so the two changes agree.

5. **Ordering by rating uses the denormalized column, so the list and the detail page cannot disagree.**
   Sorting in the catalog reads `influencers.rating` rather than averaging the reviews per creator in the query. The list is also what `catalog-and-booking` already builds, and a `LEFT JOIN` plus `GROUP BY` there would change a query that has nothing to do with reviews.
   The correctness of that choice rests entirely on decision 2, which is why the trigger is a trigger and not a rollup in an action.

6. **Rating reads use the public path, so a review written today is visible immediately.**
   `reviews` has a public read policy and the reviewee columns make the creator's review list a single-table query. No party check is involved in reading a review, which is correct: a review is published material and both the reviewer's business name and the rating are meant to be seen.
   The prototype's `reviewee_type` and `reviewee_id` columns are dropped in favour of the two nullable foreign keys, since the polymorphic form cannot carry a foreign key and therefore cannot be indexed or constrained.

7. **`ON DELETE CASCADE` from bookings to reviews is accepted, and booking deletion does not exist.**
   Deleting a booking would silently delete its reviews and leave `influencers.rating` high, because the rollup only reacts to inserts. The `BEFORE DELETE` guard is written to let that cascade through — it refuses a delete only while the booking still exists, which distinguishes a direct delete from the cascade — so the hole remains exactly as described.
   It is accepted because no capability deletes a booking — completed, declined, and cancelled requests are terminal states that keep their record, and nothing in this scope removes one. The hole is recorded here so that whoever first adds a deletion path also adds the correction, rather than discovering it from a rating that will not add up.

8. **Reviews opening after a dispute decision are spec'd now and unreachable until then.**
   The only route to a completed state from `DISPUTED` runs through the deferred dispute capability, so no review of a disputed request can be written today. Stating the behaviour now means the dispute change inherits it instead of inventing it, and it costs one scenario.
   The rule is simply that the path does not matter: a request that reaches the completed state opens reviews, whether it got there directly or through a decision.

9. **A business's review of a creator is stored and rates nothing.**
   `umkms` has no `rating` or `review_count`, so there is nowhere for a business rating to live and no decision has been made about whether businesses should be rated. The review row is still written, because it is part of the record both parties can see, and the interface shows it to both of them.
   The alternative — writing the row only when the reviewer is a business and discarding the creator's reviews — would throw away half the record to avoid an unanswered question.

10. **The review action authorizes by reading the booking through the caller's own session, exactly as the lifecycle actions do.**
    The fetch returns nothing for a non-party, which is the refusal. The service-role client is used only afterwards, for the insert.
    This is not restated as a new idea; it is the same pattern `booking-lifecycle` establishes, and reusing it means there is one way to prove party membership in the codebase.

## Risks / Trade-offs

- [Deleting a booking would cascade to its reviews and leave the creator's rating high] → Accepted, because no capability deletes a booking and terminal states keep their records. Recorded in decision 7 so the first deletion path also adds a correction.
- [The rollup trigger recomputes by scanning one creator's reviews on every insert] → A creator has a handful of reviews; the scan is over an index on `reviewee_influencer_id` that `rls-access-control` already creates. Recomputing was chosen over incrementing precisely because this cost is negligible and the arithmetic risk is not.
- [A rating of exactly zero cannot be told apart from no rating at the column level] → The interface branches on `review_count`, and the spec makes that a stated behaviour rather than an implementation detail.
- [Reviews cannot be removed even for abuse] → No moderation capability exists and none is in scope. The trigger makes the absence explicit, so adding moderation later means replacing the trigger rather than discovering that nothing was stopping it.
- [A review written for the wrong party would be publicly misattributed] → Impossible by construction, since neither the reviewer nor the reviewee is a parameter. The integration task asserts it by submitting crafted values and reading back what was stored.
- [The dispute-opened review rule cannot be exercised yet] → Recorded in decision 8. Task 6.5 asserts that the rule is currently unreachable rather than letting it sit untested, so the record says what has actually been verified.

## Migration Plan

1. Add `supabase/migrations/<new>.sql` containing the `AFTER INSERT` rollup trigger on `reviews` and the `BEFORE UPDATE OR DELETE` trigger refusing changes to it.
2. Backfill `influencers.rating` and `review_count` from any reviews already present, so the summary is correct before the first new review rather than after it.
3. Add the review action, replacing `createReview` and its hand-written rollup.
4. Repoint `app/review/[bookingId]/page.tsx`, `getReviewsForInfluencer`, and the creator card's rating display.
5. Rollback is a revert of all four steps. Dropping the triggers is clean; the backfilled `rating` and `review_count` columns keep their computed values, which are correct regardless.

## Open Questions

- Should a creator be able to reply to a review once, and should that reply be public? `messages` needs a conversation and `reviews` has no reply column, so this would be a schema addition. Worth deciding before a real creator joins, not before a competition.
- Should the creator's public page show the reviews newest first, or weighted by the reviewer's own activity? Newest first is the default here. Weighting would need a notion of reviewer weight that nothing in the schema carries.
- Should a review be left once per booking, or once per booking per round? Once per booking is what `UNIQUE (booking_id, reviewer_role)` enforces, and it matches the idea that a review judges the whole collaboration rather than one delivery.
