# booking-lifecycle Specification

## Purpose
Define how a collaboration request moves through its states: which moves are legal, which party may make each one, what each move records, when a booking stops accepting changes, and how both parties read the booking's history.

## Requirements

### Requirement: Only the defined moves between states are allowed

The system SHALL allow a request to move only along the defined sequence — a creator may accept or decline a pending request; the sending business may pay an accepted request; the creator may submit content once it is paid; the sending business may ask for a revision of submitted content; the creator may submit that revision; the sending business may approve and release submitted content; the sending business may open a dispute on submitted content; and either party may cancel while the request is still cancellable. Any other move SHALL be refused and SHALL leave the request's state exactly as it was.

#### Scenario: A creator accepts a pending request

- **WHEN** the addressed creator accepts a request in the pending state
- **THEN** the request moves to the accepted state

#### Scenario: A creator declines a pending request

- **WHEN** the addressed creator declines a request in the pending state
- **THEN** the request moves to the declined state and stops accepting any further action

#### Scenario: An action is offered from a state that does not allow it

- **WHEN** a party tries to accept a request that has already been accepted, or asks for a revision of content that has not been submitted, or approves content twice
- **THEN** the action is refused and the request's state is unchanged

#### Scenario: Content is submitted before payment

- **WHEN** the addressed creator submits content for a request that has been accepted but not yet paid
- **THEN** the submission is refused and the request's state is unchanged

#### Scenario: A revision is requested before any content exists

- **WHEN** the sending business asks for a revision of a request that has no submitted content
- **THEN** the request is refused and the request's state is unchanged

### Requirement: Only the two named parties may act, and only on their own actions

The system SHALL let the addressed creator accept, decline, submit content, and submit a revision; SHALL let the sending business pay, request a revision, approve and release, extend the review window, and open a dispute; and SHALL let either named party cancel. Every other caller, including a signed-in visitor who is not a party and an admin who is not a party, SHALL be refused with no change to the request.

#### Scenario: The sending business tries to accept its own request

- **WHEN** the business that sent a pending request tries to accept it
- **THEN** the action is refused and the request stays pending

#### Scenario: The addressed creator tries to pay

- **WHEN** the creator a request is addressed to tries to pay it
- **THEN** the action is refused and the request stays accepted

#### Scenario: A signed-in visitor who is not a party tries to act

- **WHEN** a signed-in visitor who is named on neither side of a request tries to accept, decline, pay, submit, revise, or approve it
- **THEN** every action is refused and the request is unchanged

#### Scenario: An admin who is not a party tries to act

- **WHEN** a signed-in admin who is named on neither side of a request tries to act on it
- **THEN** the action is refused and the request is unchanged

### Requirement: Accepting locks the brief and records a payment due time

The system SHALL, when a request is accepted, stop accepting any further change to the brief from the sending business and record the time the brief was locked and a time by which payment is expected, and SHALL display both times without acting on them automatically.

#### Scenario: The brief is read-only after acceptance

- **WHEN** the sending business opens an accepted request
- **THEN** the brief is shown as it was submitted, cannot be edited, and any attempt to submit an edited brief is refused

#### Scenario: The payment due time is displayed

- **WHEN** either party opens an accepted request
- **THEN** the system shows when the brief was locked and the time by which payment is expected

#### Scenario: The payment due time passes

- **WHEN** the displayed payment due time passes without payment
- **THEN** nothing happens automatically: the request stays accepted and still accepts payment

### Requirement: Every change of state is recorded on the request's timeline

The system SHALL record every change of a request's state on its timeline with the state it came from, the state it went to, which party made the change, that party's role, and when it happened, and SHALL show the same timeline to both parties. A timeline entry SHALL NOT be editable or removable.

#### Scenario: A request is accepted

- **WHEN** a request moves from pending to accepted
- **THEN** its timeline gains an entry naming the creator, the creator's role, the two states, and the time

#### Scenario: Both parties read the timeline

- **WHEN** the sending business and the addressed creator each open that request
- **THEN** both see the same entries in the same order

#### Scenario: A request has been through several states

- **WHEN** a request has been accepted, paid, and had content submitted
- **THEN** its timeline shows one entry per change in the order the changes happened

#### Scenario: An entry cannot be altered

- **WHEN** an attempt is made to edit or remove an existing timeline entry
- **THEN** the attempt is refused and the timeline is unchanged

### Requirement: Finished requests accept nothing further

The system SHALL treat a completed, declined, or cancelled request as finished, and SHALL refuse every action on it.

#### Scenario: A completed request is opened

- **WHEN** either party opens a completed request
- **THEN** no action is offered on it, and any action attempted directly is refused

#### Scenario: A declined request is opened

- **WHEN** either party opens a declined request
- **THEN** no action is offered on it, and any action attempted directly is refused

#### Scenario: A cancelled request is opened

- **WHEN** either party opens a cancelled request
- **THEN** no action is offered on it, and any action attempted directly is refused

#### Scenario: A finished request keeps its record

- **WHEN** a request reaches a finished state
- **THEN** its brief, its package terms, its timeline, and its recorded amounts remain readable

### Requirement: The review window can be extended once

The system SHALL let the sending business extend the review window of a request that has submitted content and is awaiting its decision, exactly once per request, and SHALL record and display the extended time without acting on it automatically.

#### Scenario: The business extends the window

- **WHEN** the sending business extends the review window of a request awaiting its decision
- **THEN** the displayed review due time moves later by the stated amount and the request is marked as extended

#### Scenario: The window is extended a second time

- **WHEN** the sending business tries to extend the same window again
- **THEN** the action is refused and the displayed time is unchanged

#### Scenario: The business extends before content is submitted

- **WHEN** the sending business tries to extend the review window of a request that has no submitted content
- **THEN** the action is refused

#### Scenario: The extended time passes

- **WHEN** the extended review due time passes without a decision
- **THEN** nothing happens automatically: the request stays awaiting the business's decision

### Requirement: Two people acting at once produce one change

The system SHALL apply only the first of two actions on the same request that arrive together, and SHALL refuse the second with no further change to the request.

#### Scenario: A creator accepts while the business cancels

- **WHEN** the addressed creator accepts a pending request at the same moment the sending business cancels it
- **THEN** one of the two actions takes effect, the other is refused, and the request ends in exactly one of the two resulting states

#### Scenario: The business approves twice at once

- **WHEN** the sending business approves and releases the same request twice at the same moment
- **THEN** the payment is released once and the second action is refused

### Requirement: Both parties can list and open their requests

The system SHALL let each party list the requests it sent or received and open any of them, showing the reference code, the other party's name, the package name, the amount, the current state, and the dates recorded so far. A visitor who is not a party SHALL be able to see none of them.

#### Scenario: The sending business lists its requests

- **WHEN** a signed-in business opens its request history
- **THEN** the system lists every request it sent with the other party's name, package, amount, and current state

#### Scenario: The addressed creator lists incoming requests

- **WHEN** a signed-in creator opens its incoming list
- **THEN** the system lists every request addressed to it with the sending business's name, package, amount, and current state

#### Scenario: A party opens one of its requests

- **WHEN** a party opens a request it is named on
- **THEN** the system shows the brief as submitted, the package terms as recorded, the recorded amounts, and the full timeline

#### Scenario: A visitor who is not a party opens a request directly

- **WHEN** a signed-in visitor who is named on neither side requests a request by its reference code
- **THEN** the system returns nothing for it

#### Scenario: The state shown is the same everywhere

- **WHEN** a request appears in a list, on its detail page, and in a dashboard count
- **THEN** the state shown is the same in all three
