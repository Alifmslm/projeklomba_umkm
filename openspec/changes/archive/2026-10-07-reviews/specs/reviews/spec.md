# Spec Delta

## Purpose

Define how a collaboration request comes to be reviewed: who may review whom, when a review becomes possible, what a review records, how a creator's displayed rating reflects the reviews received, and that a review cannot be changed afterwards.

## ADDED Requirements

### Requirement: A review becomes possible once the request is completed

The system SHALL allow a review only on a request that has reached the completed state, and SHALL refuse one on a request that is still in progress, that was declined, or that was cancelled.

#### Scenario: The business reviews after completion

- **WHEN** the sending business opens the review screen for a request it completed
- **THEN** the system allows it to leave a review

#### Scenario: The creator reviews after completion

- **WHEN** the addressed creator opens the review screen for a request it completed
- **THEN** the system allows it to leave a review of the business

#### Scenario: A request that is still in progress

- **WHEN** a party tries to review a request that has not been completed
- **THEN** the review is refused and no review is recorded

#### Scenario: A declined request

- **WHEN** a party tries to review a declined request
- **THEN** the review is refused and no review is recorded

#### Scenario: A cancelled request

- **WHEN** a party tries to review a cancelled request
- **THEN** the review is refused and no review is recorded

### Requirement: Each party may review the other once

The system SHALL let each of a request's two parties leave exactly one review of the other, and SHALL refuse a second review by the same party.

#### Scenario: Both parties review

- **WHEN** both parties review a completed request, one after the other
- **THEN** two reviews exist, each recording the rating and comment its author gave

#### Scenario: The same party reviews twice

- **WHEN** the same party attempts to review the same request a second time
- **THEN** the second review is refused and the first one is unchanged

#### Scenario: Two reviews at the same moment

- **WHEN** both parties submit their reviews at the same moment
- **THEN** both reviews are recorded, one from each party

### Requirement: Only a party may review, and only about the other party

The system SHALL accept a review only from a signed-in visitor named on the request, and SHALL record the reviewer and the party reviewed from the request itself rather than from anything the browser supplies.

#### Scenario: A visitor who is not a party tries to review

- **WHEN** a signed-in visitor named on neither side of a request attempts to review it
- **THEN** the review is refused and no review is recorded

#### Scenario: An admin who is not a party tries to review

- **WHEN** a signed-in admin named on neither side of a request attempts to review it
- **THEN** the review is refused and no review is recorded

#### Scenario: The browser names a different party

- **WHEN** a party submits a review carrying a different reviewer or reviewed party than the request actually has
- **THEN** the system ignores the supplied values and records the review against the request's own two parties

### Requirement: A review carries a rating from one to five and an optional comment

The system SHALL require a rating expressed as a whole number from one through five, SHALL accept a written comment as optional, and SHALL refuse a rating outside that range or left unset.

#### Scenario: A rating with a comment

- **WHEN** a party submits a rating of four and a written comment
- **THEN** the review records both

#### Scenario: A rating without a comment

- **WHEN** a party submits a rating of five and leaves the comment empty
- **THEN** the review is recorded with the rating and no comment

#### Scenario: A rating outside the range

- **WHEN** a party submits a rating of zero, of six, or of a fractional value
- **THEN** the review is refused and no review is recorded

#### Scenario: No rating at all

- **WHEN** a party submits the review form with the rating left unset
- **THEN** the review is refused and no review is recorded

### Requirement: A review is public and cannot be changed afterwards

The system SHALL show a review to any visitor on the reviewed creator's public page, with its rating, comment, and the name of the party that wrote it, and SHALL provide no way to edit or withdraw a review once it is recorded.

#### Scenario: A visitor reads a creator's reviews

- **WHEN** a visitor with no session opens a creator's public page for a creator that has been reviewed
- **THEN** the system lists each review with its rating, comment, and the writing business's name

#### Scenario: A review with no comment

- **WHEN** a review was left without a comment
- **THEN** it is listed with its rating and the writing business's name, and no empty comment area

#### Scenario: An attempt to edit a review

- **WHEN** an attempt is made to change a recorded review's rating or comment
- **THEN** the attempt is refused and the review is unchanged

#### Scenario: An attempt to withdraw a review

- **WHEN** the party that wrote a review attempts to remove it
- **THEN** the attempt is refused and the review remains

### Requirement: A creator's rating and review count follow the reviews received

The system SHALL show a creator's rating as the average of the ratings given to them, SHALL show how many reviews they have received, and SHALL update both whenever a new review of them is recorded.

#### Scenario: A creator receives their first review

- **WHEN** a creator receives a review rated four
- **THEN** the creator's rating reads four and their review count reads one

#### Scenario: A second review arrives

- **WHEN** a creator whose rating reads four from one review receives a second review rated two
- **THEN** the creator's rating reads three and their review count reads two

#### Scenario: A creator has no reviews

- **WHEN** a creator has received no reviews
- **THEN** the creator shows no reviews and a rating summary that presents no figure, rather than a rating of zero presented as a real score

#### Scenario: The summary and the list agree

- **WHEN** a visitor looks at a creator's rating summary and then at the reviews listed below it
- **THEN** the summary's review count equals the number of reviews listed

#### Scenario: Ordering by rating follows the summary

- **WHEN** a visitor sorts the creator list by rating
- **THEN** creators are ordered by the same rating shown in their summaries

### Requirement: A business's review rates nothing

The system SHALL record the review a business writes about a creator and show it to both parties, but SHALL NOT derive a rating or review count for a business, because businesses are not rated in this scope.

#### Scenario: A business reviews a creator

- **WHEN** a business submits a review of a creator
- **THEN** the review is recorded and shown on the creator's public page, and no rating appears against the business anywhere

#### Scenario: The business's own page

- **WHEN** either party opens the reviewed business's public information
- **THEN** no rating or review count is shown for it
