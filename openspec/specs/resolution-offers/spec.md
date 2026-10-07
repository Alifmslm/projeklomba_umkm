# resolution-offers Specification

## Purpose
Lets the two parties settle a stuck collaboration themselves with a recorded offer — extra revisions, a price reduction, or a mutual cancellation with refund terms — before either side has to open a formal dispute.

## Requirements

### Requirement: An offer records a proposed settlement on a request

The system SHALL record, for a settlement offer, the request it concerns, which party made it, its type (extra revisions, a price reduction, or a cancellation), its value, its status, when it was made, and the time by which it is answered, and SHALL show the same offer to both parties. The system SHALL keep at most one offer open at a time on a request.

#### Scenario: A creator offers a price reduction

- **WHEN** the creator of a request offering a price reduction records the offer
- **THEN** one offer exists for the request, in an open state, naming the creator, the type, the offered amount, and the expiry time

#### Scenario: Both parties see the offer

- **WHEN** the business and the creator each open the request
- **THEN** both see the same offer with its type, value, status, and expiry time

#### Scenario: A second offer while one is open

- **WHEN** a party records an offer while another offer on the request is still open and unexpired
- **THEN** the new offer is refused and the existing offer is unchanged

### Requirement: A party may make only the offers its role and the request's state allow

The system SHALL let the creator offer extra revisions while content awaits the business's decision or is in revision, let the creator offer a price reduction while content awaits the business's decision, and let either party offer a cancellation while the request is accepted, funded, awaiting a decision, or in revision. Any other combination of role, type, and state SHALL be refused with no offer recorded.

#### Scenario: The creator offers extra revisions while content awaits review

- **WHEN** the creator offers extra revisions on a request whose content awaits the business's decision
- **THEN** the offer is recorded

#### Scenario: The creator offers a price reduction while content is in revision

- **WHEN** the creator offers a price reduction on a request that is in revision
- **THEN** the offer is refused, because a reduction is only offered while content awaits a decision

#### Scenario: The business offers a cancellation

- **WHEN** the business offers a cancellation on a request that is funded, awaiting a decision, or in revision
- **THEN** the offer is recorded

#### Scenario: A party offers on a finished request

- **WHEN** a party attempts any offer on a completed, declined, or cancelled request
- **THEN** the offer is refused and the request is unchanged

#### Scenario: A visitor who is not a party offers

- **WHEN** a signed-in visitor named on neither side attempts to record an offer on a request
- **THEN** the offer is refused and none is recorded

### Requirement: Only the counterparty may decide an offer

The system SHALL let only the party that did not make an offer accept or decline it. The party that made the offer, a visitor who is not a party, and an admin who is not a party SHALL each be refused with the offer and the request unchanged.

#### Scenario: The counterparty accepts

- **WHEN** the party that did not make an open offer accepts it
- **THEN** the offer is applied as its type dictates

#### Scenario: The offerer decides its own offer

- **WHEN** the party that made an open offer tries to accept or decline it
- **THEN** the attempt is refused and the offer stays open

#### Scenario: A visitor who is not a party decides

- **WHEN** a signed-in visitor named on neither side tries to decide an offer
- **THEN** the attempt is refused and the offer stays open

### Requirement: Accepting an extra-revision offer adds revisions

The system SHALL, when the business accepts the creator's extra-revision offer, raise the request's revision quota by the offered number of revisions and leave the request's state unchanged, so the business can then request the additional revisions within the raised quota.

#### Scenario: The business accepts extra revisions

- **WHEN** the business accepts an extra-revision offer of a given count on a request awaiting its decision
- **THEN** the request's quota increases by that count, the revisions used is unchanged, and the request stays awaiting the business's decision

#### Scenario: The added revisions are usable

- **WHEN** the business, after accepting extra revisions, asks for a revision marked as within the brief
- **THEN** the request accepts it while the raised quota has room

#### Scenario: The offer is applied once

- **WHEN** an accepted extra-revision offer is decided again
- **THEN** the second attempt is refused and the quota is not raised twice

### Requirement: Accepting a price-reduction offer completes the request with a split payment

The system SHALL, when the business accepts the creator's price-reduction offer, release only the reduced amount to the creator, return the difference to the business, move the request's payment to a split state, and move the request to the completed state, recording the completion time.

#### Scenario: The business accepts a reduction

- **WHEN** the business accepts a reduction offer on a request awaiting its decision with a held payment
- **THEN** the creator's share becomes the reduced amount, the difference is recorded as returned to the business, the payment is split, and the request is completed

#### Scenario: The reduced amount is the offered one

- **WHEN** a reduction offer naming an amount is accepted
- **THEN** the creator's share is exactly that amount and the difference from the recorded total is returned

#### Scenario: Review opens after a reduction

- **WHEN** a request is completed by accepting a reduction offer
- **THEN** both parties can leave a review as on any completed request

### Requirement: Accepting a cancellation offer ends the request and settles its payment

The system SHALL, when a party accepts the other's cancellation offer, move the request to the cancelled state and settle its held payment exactly as the offer records: return the full total when the offer refunds in full, or return the recorded partial amount to the business and keep the remainder as the creator's share when the offer splits the refund. A request with no held payment SHALL simply end.

#### Scenario: A full refund is accepted

- **WHEN** the counterparty accepts a cancellation offer that refunds the full total
- **THEN** the request is cancelled, the payment is refunded in full, and the creator's share is zero

#### Scenario: A partial refund is accepted

- **WHEN** the counterparty accepts a cancellation offer that refunds part of the total
- **THEN** the request is cancelled, that part is recorded as returned to the business, and the remainder is recorded as the creator's share

#### Scenario: A cancellation offer on an unpaid request

- **WHEN** the counterparty accepts a cancellation offer on a request whose payment has not been paid
- **THEN** the request is cancelled and no amount is recorded as moved

### Requirement: Declining an offer leaves the request unchanged

The system SHALL, when a party declines an offer, record the offer as declined and leave the request's state, its quota, and its payment exactly as they were.

#### Scenario: The counterparty declines

- **WHEN** the counterparty declines an open offer
- **THEN** the offer is recorded as declined, the request keeps its state, and no amount moves

#### Scenario: A declined offer is shown

- **WHEN** either party opens the request after a decline
- **THEN** the offer is shown as declined

### Requirement: An unanswered offer expires without a scheduler

The system SHALL treat an offer whose recorded answer time has passed as expired, SHALL show it as expired to both parties, and SHALL refuse a decision attempted after that time while recording the offer as expired. Nothing SHALL expire an offer on its own.

#### Scenario: The window passes

- **WHEN** an open offer's expiry time has passed and either party opens the request
- **THEN** the offer is shown as expired

#### Scenario: A decision is attempted after expiry

- **WHEN** a party tries to accept or decline an offer whose time has passed
- **THEN** the attempt is refused and the offer is recorded as expired

#### Scenario: Expiry does not touch the request

- **WHEN** an offer expires
- **THEN** the request's state, quota, and payment are unchanged

#### Scenario: No scheduler

- **WHEN** an offer's expiry time passes while neither party acts
- **THEN** nothing happens on its own; the offer is only treated as expired when it is read or a decision is attempted

### Requirement: Offers are readable only by the two parties

The system SHALL let each party read the offers on the requests it is named on, and SHALL return no offer to a visitor who is named on neither side, whether the visitor is signed in or signed out.

#### Scenario: A party opens its request

- **WHEN** a named party opens a request that has offers
- **THEN** the system returns every offer on it in the order they were made

#### Scenario: A visitor reads offers directly

- **WHEN** a signed-in visitor named on neither side requests the offers of a request
- **THEN** the system returns nothing for them
