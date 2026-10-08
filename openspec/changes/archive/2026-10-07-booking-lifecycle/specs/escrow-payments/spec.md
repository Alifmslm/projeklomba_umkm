# Spec Delta

## Purpose

Define what the system records about money on a collaboration request: how an escrow payment record comes into existence, how it moves from unpaid to held to released, what the recorded amounts are, and what a creator's earnings and a business's outstanding payments are derived from.

## ADDED Requirements

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

The system SHALL move a payment from held to released only when the sending business approves submitted content and releases the request, and SHALL at that moment record the whole amount as the creator's share and record the completion time. No other action SHALL release money.

#### Scenario: The business approves and releases

- **WHEN** the sending business approves submitted content and releases the request
- **THEN** the payment moves from held to released, the creator's share becomes the full total, the request moves to the completed state, and the completion time is recorded

#### Scenario: The creator approves

- **WHEN** the addressed creator tries to approve and release its own request
- **THEN** the action is refused and no money is released

#### Scenario: A cancellation releases nothing

- **WHEN** a request is cancelled while its payment is held
- **THEN** the payment stays held and no release is recorded

#### Scenario: A decline releases nothing

- **WHEN** a request is declined
- **THEN** no money is released, because nothing was ever held

### Requirement: Recorded amounts cannot be edited

The system SHALL take the payment's total from the amount recorded on the request at submission, and SHALL provide no action that changes that total. The only amount any action may set is the creator's share, and only when money is released.

#### Scenario: The package price changes after submission

- **WHEN** a creator changes the price of a package a request was submitted from
- **THEN** the request's recorded amount and its payment's total both stay at the price recorded at submission

#### Scenario: An attempt is made to change a total

- **WHEN** an attempt is made to set a payment's total to a different value
- **THEN** the attempt is refused and the total is unchanged

#### Scenario: The creator's share before release

- **WHEN** a payment is unpaid or held
- **THEN** the creator's share is zero

### Requirement: Earnings and outstanding payments are derived from payment records

The system SHALL derive a creator's earnings as the sum of amounts released to it, SHALL show amounts still held separately from released ones, and SHALL NOT count unpaid or held amounts as earnings. It SHALL show the sending business any request awaiting payment together with its amount and displayed due time.

#### Scenario: A creator has a released payment

- **WHEN** a creator has a payment that has been released
- **THEN** the released amount appears in its earnings, counted once

#### Scenario: A creator has a held payment

- **WHEN** a creator has a payment that is held but not released
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

The system SHALL leave a held payment in the held state when its request is cancelled, and SHALL perform no release and no refund, because settling money on cancellation is not part of the current scope. The state SHALL be reported honestly rather than presented as resolved.

#### Scenario: A funded request is cancelled

- **WHEN** either party cancels a request whose payment is held
- **THEN** the payment remains held and the system states that the amount is still recorded as held and not settled

#### Scenario: A cancelled request with an unpaid payment

- **WHEN** a request is cancelled before it is paid
- **THEN** its payment remains unpaid and is not counted anywhere as money owed or received

#### Scenario: Money on a cancelled request is reported

- **WHEN** either party opens a cancelled request
- **THEN** the system shows the payment state as recorded and states plainly that nothing has been released or refunded
