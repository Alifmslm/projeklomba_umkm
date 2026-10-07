# Spec Delta

## Purpose

Define how content revisions work on a collaboration request: how a request's revision quota is set and shown, what a revision request must contain, when a revision consumes quota, and when the option to open a dispute becomes available.

## ADDED Requirements

### Requirement: A request carries the revision quota of the package it was made from

The system SHALL copy the chosen package's revision quota onto the request at submission, SHALL show the quota and the number used against it, and SHALL leave the request's quota unchanged when the package's quota later changes.

#### Scenario: A request is created

- **WHEN** a request is submitted from a package allowing a given number of revisions
- **THEN** the request shows that number as its quota and zero revisions used

#### Scenario: The package quota changes later

- **WHEN** a creator raises a package's revision quota after a request was submitted from it
- **THEN** that request still shows the quota recorded at submission

#### Scenario: The quota is shown as a count

- **WHEN** either party opens a request that has had revisions
- **THEN** the system shows how many revisions have been used against the recorded quota

### Requirement: A revision request must name the content, a section, and a note

The system SHALL require a revision request to identify which submitted version it refers to, which section of the delivered content it concerns, and a written note describing the change wanted, and SHALL refuse a revision request missing any of the three.

#### Scenario: The business sends a complete revision request

- **WHEN** the sending business identifies a submitted version, a section, and a note
- **THEN** the request records all three and the request moves to the revision state

#### Scenario: No section is named

- **WHEN** the sending business submits a revision request without naming a section
- **THEN** it is refused and the request stays in the state it was in

#### Scenario: No note is written

- **WHEN** the sending business submits a revision request without a note
- **THEN** it is refused and the request stays in the state it was in

#### Scenario: No submitted version exists yet

- **WHEN** the sending business submits a revision request for a request with no submitted content
- **THEN** it is refused and the request stays in the state it was in

#### Scenario: A second revision request on the same round

- **WHEN** the sending business submits a revision request naming a round it has already raised a revision request about
- **THEN** it is refused, because each round can be asked about once, and further changes are raised against the next round

### Requirement: Every submitted version is recorded as a round

The system SHALL record each version the creator submits as a numbered round with the time it was submitted and a link to the delivered content, and SHALL accept an optional written note alongside it, so the parties can see what was delivered in each round.

#### Scenario: The first submission

- **WHEN** the creator submits a link to delivered content for a funded request
- **THEN** the system records it as the first round with that link and the time

#### Scenario: A submission without a link

- **WHEN** the creator submits content without a link
- **THEN** the submission is refused, since delivered content is identified by where it can be seen

#### Scenario: A submission with a note

- **WHEN** the creator submits a link together with a written note
- **THEN** the system records both

#### Scenario: A later submission

- **WHEN** the creator submits content again after a revision was requested
- **THEN** the system records it as the next round, keeping the earlier rounds readable

#### Scenario: A round is viewed by both parties

- **WHEN** either party opens a request with several rounds
- **THEN** both see the same rounds in order with the same links and notes

### Requirement: A revision within the brief consumes quota and one outside it does not

The system SHALL let the sending business mark a revision request as within the brief or outside it, SHALL count a revision within the brief against the request's quota, and SHALL NOT count one outside it.

#### Scenario: A revision within the brief

- **WHEN** the sending business marks a revision request as within the brief
- **THEN** the count of revisions used increases by one

#### Scenario: A revision outside the brief

- **WHEN** the sending business marks a revision request as outside the brief
- **THEN** the count of revisions used does not change, and the request is still recorded and still shown to both parties

#### Scenario: The flag is shown

- **WHEN** the addressed creator opens a revision request
- **THEN** the system shows whether it was marked within or outside the brief

#### Scenario: Repeated outside-brief revisions

- **WHEN** the sending business marks several revision requests as outside the brief
- **THEN** the count of revisions used stays where it was while the number of rounds increases

### Requirement: Quota is enforced

The system SHALL refuse a revision request marked as within the brief once the request's quota is already used up, and SHALL leave the request in the state it was in. A revision request marked as outside the brief SHALL still be accepted after the quota is used up.

#### Scenario: A within-brief revision at the quota limit

- **WHEN** the sending business marks a revision request as within the brief on a request whose quota is already used
- **THEN** it is refused and the request stays in the state it was in

#### Scenario: A within-brief revision below the limit

- **WHEN** the sending business marks a revision request as within the brief on a request with quota remaining
- **THEN** it is accepted and the count of revisions used increases by one, never exceeding the quota

#### Scenario: An outside-brief revision beyond the limit

- **WHEN** the sending business marks a revision request as outside the brief on a request whose quota is already used
- **THEN** it is accepted and the count of revisions used does not change

#### Scenario: The refusal is explained

- **WHEN** a within-brief revision request is refused because the quota is used up
- **THEN** the system says the quota is used up and points to opening a dispute

### Requirement: The option to open a dispute appears once the quota is used up

The system SHALL offer the option to open a dispute on a request only after that request's revision quota is fully used, and SHALL not offer it while quota remains. Offering the option SHALL only open the dispute; the dispute itself is settled by a capability outside the current scope.

#### Scenario: Quota remains

- **WHEN** a request has revision quota remaining and the sending business opens it
- **THEN** no option to open a dispute is offered

#### Scenario: Quota is used up

- **WHEN** a request's revision quota is fully used and the sending business opens it
- **THEN** the option to open a dispute is offered

#### Scenario: The business opens a dispute

- **WHEN** the sending business opens a dispute on a request whose quota is fully used
- **THEN** the request moves to the disputed state and the dispute is recorded as awaiting a decision

#### Scenario: A party tries to open a dispute early

- **WHEN** an attempt is made to open a dispute on a request whose quota is not fully used
- **THEN** the attempt is refused and the request stays in the state it was in
