# escrow-payments Specification

## Purpose
Define what the system records about money on a collaboration request: how an escrow payment record comes into existence, how it moves from unpaid to held to released, what the recorded amounts are, and what a creator's earnings and a business's outstanding payments are derived from.

## Requirements

### Requirement: No real money moves

The system SHALL record only the intent to pay, the state of that payment, and the amounts involved, and SHALL NOT integrate with any payment gateway, bank transfer, or card. Money the system reports as held SHALL be described to both parties as money held on the platform, and no party SHALL be told that funds have physically moved.

#### Scenario: A business sees the payment step

- **WHEN** the sending business reaches the payment step of an accepted request
- **THEN** the system describes the amount as being held on the platform and names no payment gateway, bank, or card

#### Scenario: A creator sees their held amount

- **WHEN** a creator views an amount recorded as held
- **THEN** the system describes it as held on the platform and makes no claim that a bank transfer occurred

### Requirement: Accepting a request opens its payment record

The system SHALL, when a request is accepted, create exactly one payment record for it in an unpaid state carrying the request's total amount, and SHALL create no second record if the request is somehow accepted again.

#### Scenario: A request is accepted

- **WHEN** a pending request is accepted
- **THEN** exactly one payment record exists for it, in an unpaid state, whose total matches the amount recorded on the request

#### Scenario: Acceptance is attempted again

- **WHEN** acceptance of an already accepted request is attempted
- **THEN** the attempt is refused and no second payment record is created

#### Scenario: The total on the payment matches the request

- **WHEN** a request created from a package priced at a given amount is accepted
- **THEN** the payment record's total is that same amount, not a recalculated one

### Requirement: Paying holds the amount and moves the request forward

The system SHALL let the sending business pay an accepted request, moving its payment to a held state and its request to a funded state, recording when the hold began and when the request was funded, and setting a production deadline that is displayed without being acted on automatically. Paying a request that is not accepted SHALL be refused, and a request that is already paid SHALL refuse a second payment.

#### Scenario: The business pays

- **WHEN** the sending business pays an accepted request
- **THEN** the payment moves to a held state carrying the full total, the request moves to the funded state, and the hold time, funding time, and displayed production deadline are recorded

#### Scenario: A second payment is attempted

- **WHEN** the sending business tries to pay a request it has already paid
- **THEN** the payment is refused and the request stays funded

#### Scenario: A creator tries to pay

- **WHEN** the addressed creator tries to pay the request addressed to it
- **THEN** the payment is refused and no payment state changes

#### Scenario: The production deadline passes

- **WHEN** the displayed production deadline passes without submitted content
- **THEN** nothing happens automatically: the request stays funded and still accepts content

### Requirement: Money is released only when the sending business approves

The system SHALL move a payment from held to released only when the sending business approves submitted content and releases the request, or when the sending business accepts a price-reduction offer. On approval it SHALL record the whole amount as the creator's share and record the completion time; on an accepted reduction it SHALL record only the offered amount as the creator's share and return the difference. No other action SHALL release money.

#### Scenario: The business approves and releases

- **WHEN** the sending business approves submitted content and releases the request
- **THEN** the payment moves from held to released, the creator's share becomes the full total, the request moves to the completed state, and the completion time is recorded

#### Scenario: A reduction offer is accepted

- **WHEN** the sending business accepts a price-reduction offer
- **THEN** the creator's share becomes the offered amount, the difference from the recorded total is returned to the business, the payment is recorded as split, and the request is completed

#### Scenario: The creator approves

- **WHEN** the addressed creator tries to approve and release its own request
- **THEN** the action is refused and no money is released

#### Scenario: A cancellation releases nothing

- **WHEN** a request is cancelled while its payment is held and no cancellation offer was accepted
- **THEN** the payment stays held and no release is recorded

#### Scenario: A decline releases nothing

- **WHEN** a request is declined
- **THEN** no money is released, because nothing was ever held

### Requirement: Recorded amounts cannot be edited

The system SHALL take the payment's total from the amount recorded on the request at submission, and SHALL provide no action that changes that total. The only amount any action may set is the creator's share, and only when money is released or when a settlement accepted on a cancellation records it.

#### Scenario: The package price changes after submission

- **WHEN** a creator changes the price of a package a request was submitted from
- **THEN** the request's recorded amount and its payment's total both stay at the price recorded at submission

#### Scenario: An attempt is made to change a total

- **WHEN** an attempt is made to set a payment's total to a different value
- **THEN** the attempt is refused and the total is unchanged

#### Scenario: The creator's share before release

- **WHEN** a payment is unpaid or held
- **THEN** the creator's share is zero

#### Scenario: A settlement records the creator's share

- **WHEN** a split cancellation offer is accepted
- **THEN** the creator's share is set to the recorded remainder and the payment's total is unchanged

### Requirement: Earnings and outstanding payments are derived from payment records

The system SHALL derive a creator's earnings as the sum of the shares settled to it — the full total of a released payment and the recorded creator's share of a split one — SHALL show amounts still held separately from settled ones, and SHALL NOT count unpaid or held amounts as earnings. It SHALL show the sending business any request awaiting payment together with its amount and displayed due time.

#### Scenario: A creator has a released payment

- **WHEN** a creator has a payment that has been released
- **THEN** the released amount appears in its earnings, counted once

#### Scenario: A creator has a split payment

- **WHEN** a creator has a payment that was recorded as split
- **THEN** the creator's recorded share appears in its earnings and the refunded part does not

#### Scenario: A creator has a held payment

- **WHEN** a creator has a payment that is held but not settled
- **THEN** the amount appears as still held and does not appear in its earnings

#### Scenario: A creator has an unpaid payment

- **WHEN** a creator has a payment that has not been paid
- **THEN** the amount appears as awaiting payment and does not appear in its earnings

#### Scenario: A business has an accepted request awaiting payment

- **WHEN** the sending business opens its requests
- **THEN** each request awaiting payment is shown with its amount and its displayed due time

#### Scenario: A business has already paid

- **WHEN** the sending business has paid a request
- **THEN** that request is shown as paid and no longer appears as awaiting payment

### Requirement: A cancelled request's held payment is left alone

The system SHALL leave a held payment in the held state when its request is cancelled outside the offer path, and SHALL then perform no release and no refund. When a cancellation is settled through an accepted offer, the system SHALL instead move the held amount exactly as the offer records: refund the full total, or refund the recorded part and record the remainder as the creator's share. A request cancelled with no held payment records nothing as moved. The state SHALL be reported honestly rather than presented as resolved.

#### Scenario: A funded request is cancelled

- **WHEN** either party cancels a request whose payment is held and no cancellation offer was accepted
- **THEN** the payment remains held and the system states that the amount is still recorded as held and not settled

#### Scenario: A full cancellation offer is accepted

- **WHEN** a cancellation offer that refunds the full total is accepted
- **THEN** the payment is recorded as refunded in full and the creator's share is zero

#### Scenario: A split cancellation offer is accepted

- **WHEN** a cancellation offer that refunds part of the total is accepted
- **THEN** the payment is recorded as split, the refunded part is recorded as returned to the business, and the remainder is recorded as the creator's share

#### Scenario: A cancelled request with an unpaid payment

- **WHEN** a request is cancelled before it is paid
- **THEN** its payment remains unpaid and is not counted anywhere as money owed or received

#### Scenario: Money on a cancelled request is reported

- **WHEN** either party opens a cancelled request
- **THEN** the system shows the payment state as recorded and states plainly what, if anything, was released or refunded
