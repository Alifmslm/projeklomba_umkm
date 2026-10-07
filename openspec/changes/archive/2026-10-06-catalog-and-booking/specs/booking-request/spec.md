# Spec Delta

## Purpose

Define how a signed-in UMKM submits a collaboration request to a creator: what the system checks before it accepts one, what it records at the moment of submission, and what it refuses.

## ADDED Requirements

### Requirement: A signed-in UMKM submits a collaboration request

The system SHALL let a signed-in UMKM submit a collaboration request from a creator's page by choosing one of that creator's packages and writing a brief, and SHALL record the request in a pending state that neither party has yet acted on.

#### Scenario: An UMKM submits a request

- **WHEN** a signed-in UMKM selects a package on a creator's page, writes a brief, and submits
- **THEN** the system creates one request in a pending state addressed to that creator and reports success with the request's reference code

#### Scenario: An UMKM submits without a brief

- **WHEN** an UMKM submits the request form with the brief left empty
- **THEN** the system creates no request and reports that a brief is required

#### Scenario: An UMKM submits a very short brief

- **WHEN** an UMKM submits a brief shorter than the minimum the system accepts
- **THEN** the system creates no request and reports the minimum length

### Requirement: A request records the package terms as they were when it was made

The system SHALL copy the chosen package's name, price, revision quota, and estimated days onto the request at submission, so later changes to that package never alter a request that already exists.

#### Scenario: A creator changes a package's price after a request was made

- **WHEN** a creator raises the price of a package that a pending request was submitted from
- **THEN** that request still shows the price recorded at submission, while the creator's public page shows the new price

#### Scenario: A creator changes a package's revision quota after a request was made

- **WHEN** a creator raises a package's revision quota after a request was submitted from it
- **THEN** that request still shows the revision quota recorded at submission

#### Scenario: A creator changes a package's included items after a request was made

- **WHEN** a creator edits what a package includes after a request was submitted from it
- **THEN** that request still shows the included items recorded at submission

### Requirement: Only an authenticated business owner can submit

The system SHALL accept a collaboration request only from a signed-in visitor whose role is a business, and SHALL refuse one from a signed-out visitor, from a creator, or from an admin, creating no request in every refused case.

#### Scenario: A signed-out visitor tries to submit

- **WHEN** a visitor with no session submits the request form
- **THEN** no request is created and the visitor is sent to sign in, returning to the creator's page afterwards

#### Scenario: A creator tries to submit

- **WHEN** a signed-in creator submits the request form
- **THEN** no request is created and the creator is told that only a business can send a collaboration request

#### Scenario: An admin tries to submit

- **WHEN** a signed-in admin submits the request form
- **THEN** no request is created and the admin is refused, since the admin role is not a party to any collaboration

### Requirement: The package must belong to the creator the request names

The system SHALL accept a request only when the chosen package belongs to the creator whose page the request was submitted from, and SHALL refuse a request naming a package that belongs to a different creator or that is not active.

#### Scenario: A request names another creator's package

- **WHEN** a signed-in UMKM submits a request naming a package that belongs to a creator other than the one whose page they are on
- **THEN** no request is created and the submission is refused

#### Scenario: A request names a deactivated package

- **WHEN** a signed-in UMKM submits a request naming a package that has been deactivated
- **THEN** no request is created and the submission is refused

#### Scenario: A request names a package that does not exist

- **WHEN** a signed-in UMKM submits a request naming a package identifier that does not exist
- **THEN** no request is created and the submission is refused

### Requirement: Every request carries a distinct reference code

The system SHALL assign each request a reference code that is unique across all requests, and SHALL show the same code to both parties and to anyone who later looks the request up.

#### Scenario: Two requests are created

- **WHEN** a signed-in UMKM submits two requests
- **THEN** the two requests carry different reference codes

#### Scenario: Both parties look at the request

- **WHEN** the sending business and the receiving creator each open that request
- **THEN** both see the same reference code and the same amount

### Requirement: A submitted request appears immediately for both parties

The system SHALL show a newly submitted request in the sending business's sent list and in the receiving creator's incoming list, with the same reference code, amount, package name, and pending state on both sides.

#### Scenario: The sending business looks for its request

- **WHEN** a signed-in UMKM submits a request and opens its sent list
- **THEN** the new request appears there in a pending state with its reference code and amount

#### Scenario: The receiving creator looks for the request

- **WHEN** the addressed creator opens its incoming list
- **THEN** the same request appears there in a pending state with the same reference code and amount

#### Scenario: The request count on a dashboard

- **WHEN** either party opens its dashboard after the submission
- **THEN** the count of requests shown reflects the new request
