# Tasks

No test runner is installed, so verification here is `npm run lint`, `npm run build`, SQL assertions against the database, and a browser walkthrough of each scenario in the spec delta.

## 1. The rollup

- [x] 1.1 Add an `AFTER INSERT` trigger on `reviews` that recomputes the reviewed creator's `influencers.rating` as `round(avg(rating), 1)` and `review_count` as the number of reviews naming that creator, and verify a first review rated four leaves the creator at four with a count of one
- [x] 1.2 Verify a second review rated two moves a creator from four to three with a count of two, and that the average is over the reviews actually received rather than accumulated arithmetically
- [x] 1.3 Verify the rounded average fits `numeric(2,1)` by driving a creator to an average that needs rounding, and confirm the insert does not fail
- [x] 1.4 Confirm the trigger never touches a business, and verify a business's `umkms` row has no rating or review count written
- [x] 1.5 Backfill `influencers.rating` and `review_count` from the reviews already present, and verify the values match an independent aggregate query for every creator who has been reviewed

## 2. Keeping the rating true

- [x] 2.1 Add a `BEFORE UPDATE OR DELETE` trigger on `reviews` that raises, and verify an update to a rating or comment is refused and a delete is refused
- [x] 2.2 Verify the trigger also refuses a change to any other column of a review, so no part of a recorded review can be altered
- [x] 2.3 Verify the rollup trigger does not fire on a refused update or delete, and that the creator's rating is unchanged after both are attempted
- [x] 2.4 Insert a review directly through the service-role client and confirm the creator's rating and count change, so the rollup is shown to depend on the row rather than on the action

## 3. The review action

- [x] 3.1 Add a `submitReview` Server Action that fetches the request through the caller's own session and refuses when nothing is returned, and verify a signed-in visitor who is not a party and an admin who is not a party are both refused with no review recorded
- [x] 3.2 Resolve `reviewer_role` from the caller's own role and set the other party as the reviewee, taking neither from the request body, and verify by submitting crafted values that the stored review names the request's actual two parties
- [x] 3.3 Refuse a review unless the request is completed, and verify refusal for a request that is still in progress, one that was declined, and one that was cancelled
- [x] 3.4 Validate the rating as a whole number from one through five, refusing zero, six, a fractional value, and an unset value, and verify no review is recorded in any of those cases
- [x] 3.5 Accept a rating with no comment, and verify the review is stored with a null comment rather than an empty string
- [x] 3.6 Let both parties review the same request, one after the other, and verify two reviews exist, each with its own rating and comment
- [x] 3.7 Refuse a second review by the same party and leave the first unchanged, and verify two reviews submitted at the same moment both succeed, one from each party
- [x] 3.8 Delete the hand-written rating rollup from the prototype's `createReview` and remove the SQLite review writes, and verify no code path writes `influencers.rating` other than the trigger

## 4. Reading reviews

- [x] 4.1 Read a creator's reviews by `reviewee_influencer_id` through the public client and show each with its rating, comment, and the writing business's name, and verify a visitor with no session sees the same list
- [x] 4.2 Render a review left without a comment as the rating and the business name alone, and verify no empty comment area appears
- [x] 4.3 Show the creator's rating and review count from `influencers` on the card and on the public page, and verify the summary's count equals the number of reviews listed below it
- [x] 4.4 Show that a creator has not been reviewed when its review count is zero, rather than showing a rating of zero, and verify the figure is absent rather than displayed as a real score
- [x] 4.5 Order the creator list by rating using `influencers.rating`, and verify the order matches the rating shown in each summary and places creators with no reviews after those that have one
- [x] 4.6 Show a business's review of a creator to both parties, and verify no rating or review count appears anywhere against the business

## 5. Documentation

- [x] 5.1 Document in DEVELOPMENT.md that a review's rating and review count are maintained by a database trigger and that `reviews` rows may never be updated or deleted, and verify both statements are present
- [x] 5.2 Record in DEVELOPMENT.md that deleting a booking would cascade to its reviews and leave the creator's rating high, that no capability deletes a booking, and that a future deletion path must correct the rollup, and verify the note names the cascade
- [x] 5.3 Record that reviews opening after a dispute decision are specified but unreachable until the dispute capability exists, so the assertion in task 6.5 is not read as untested behaviour

## 6. Integration checks

- [x] 6.1 Drive one request from submission through completion, review it from both sides, and verify both reviews are recorded with the right parties, ratings, and comments
- [x] 6.2 Recompute every creator's rating and review count with an independent query and compare them against the stored values, and verify the two agree for creators with zero, one, and several reviews
- [x] 6.3 Attempt an update and a delete on a recorded review through both the service-role client and a Server Action, and verify both are refused and the creator's rating is unchanged
- [x] 6.4 Walk every scenario in `specs/reviews/spec.md` once against a running dev server, and verify each produces the stated result
- [x] 6.5 Confirm the dispute path is currently unreachable — no request can move from `DISPUTED` to `COMPLETED` until the dispute capability exists — and verify the review screen therefore refuses a disputed request, recording the behaviour as specified but not yet exercisable rather than leaving it silently untested
- [x] 6.6 Run `npm run lint` and `npm run build` and verify both pass with no new warnings
- [x] 6.7 Run `openspec validate reviews --strict` and verify the change and its spec delta validate with no findings