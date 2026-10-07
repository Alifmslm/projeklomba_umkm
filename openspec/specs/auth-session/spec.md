# auth-session Specification

## Purpose
Define how a person becomes an identified account on Kolab.id: creating an account, establishing and ending a session, turning a new account into an UMKM or creator record, and deciding who may enter each area of the app.

## Requirements

### Requirement: Accounts are created with an email address and a password

The system SHALL let a visitor create an account from an email address and a password, and SHALL let a returning visitor sign in with the same pair.

#### Scenario: A new visitor signs up

- **WHEN** a visitor submits the sign-up form with an email address and a password
- **THEN** the system creates the account, holds no business or creator record for it yet, and sends the visitor to onboarding

#### Scenario: A returning visitor signs in

- **WHEN** a visitor submits the sign-in form with credentials that match an existing account
- **THEN** the system establishes a session and routes the visitor to onboarding if the account has no profile yet, or to the dashboard for its role if it does

#### Scenario: A visitor submits the wrong password

- **WHEN** a visitor submits a sign-in form with an email address that exists but the wrong password
- **THEN** no session is established and the form reports that the credentials did not match

#### Scenario: An unconfirmed account tries to sign in

- **WHEN** an account has been created but its email address has not been confirmed, and confirmation is required in the current environment
- **THEN** no session is established and the visitor is told to confirm the address first

### Requirement: An account can be created or reused through Google

The system SHALL let a visitor sign in with a Google account and SHALL arrive at the same destination as email sign-in, whether or not the Google account has been used before.

#### Scenario: A first-time Google visitor signs in

- **WHEN** a visitor signs in with a Google account that has never used Kolab.id
- **THEN** the system establishes a session with no profile and routes the visitor to onboarding

#### Scenario: A returning Google visitor signs in

- **WHEN** a visitor signs in with a Google account that already has a Kolab.id profile
- **THEN** the system establishes a session and routes the visitor straight to the dashboard for that profile's role

### Requirement: A session can be ended

The system SHALL let a signed-in user end their session from anywhere the app offers it, and SHALL return the visitor to the public landing page.

#### Scenario: The user signs out

- **WHEN** a signed-in user activates `Logout`
- **THEN** the session ends and the visitor is returned to the public landing page

#### Scenario: A protected page is requested after signing out

- **WHEN** a visitor whose session has ended opens a protected page directly, including by using the browser's back button
- **THEN** the system redirects the visitor to the sign-in page instead of rendering the page

### Requirement: A new account becomes an UMKM or a creator

The system SHALL require an account that has no profile to choose one of two roles and supply the details for that role before any dashboard is reachable, and SHALL create exactly one business or creator record together with the profile that links it to the account.

#### Scenario: A visitor registers a business

- **WHEN** a signed-in visitor with no profile chooses the UMKM role and submits a business name, owner name, category, and city
- **THEN** the system creates one business record and one profile carrying the UMKM role that links to it, and routes the visitor to the UMKM dashboard

#### Scenario: A visitor registers as a creator

- **WHEN** a signed-in visitor with no profile chooses the creator role and submits a name, handle, niche, city, and bio
- **THEN** the system creates one creator record and one profile carrying the creator role that links to it, and routes the visitor to the creator dashboard

#### Scenario: Onboarding is submitted twice

- **WHEN** an account that already has a profile submits the onboarding form again
- **THEN** no second business or creator record is created and the visitor is routed to the dashboard for the role it already has

#### Scenario: A visitor opens onboarding after completing it

- **WHEN** a signed-in visitor who already has a profile opens the onboarding page directly
- **THEN** the system redirects the visitor to the dashboard for its role rather than showing the onboarding form

### Requirement: Every request resolves to a role and one linked record

The system SHALL resolve each signed-in request to a role and to the single business or creator record linked to it, and SHALL base that resolution on the session rather than on anything the browser supplies.

#### Scenario: A signed-in business owner is resolved

- **WHEN** a signed-in UMKM opens a protected page
- **THEN** the system resolves the request to the UMKM role and to that account's own business record

#### Scenario: A signed-in creator is resolved

- **WHEN** a signed-in creator opens a protected page
- **THEN** the system resolves the request to the creator role and to that account's own creator record

#### Scenario: The browser claims a different identity

- **WHEN** a request carries a role or a record id that differs from the one the session resolves to
- **THEN** the system ignores the supplied value and acts on the session's own role and linked record

### Requirement: Areas of the app are guarded by session and role

The system SHALL redirect signed-out visitors away from protected areas, signed-in users away from the sign-in and sign-up pages, and accounts without a profile to onboarding; and it SHALL require the admin role for admin areas, sending visitors of any other role to their own dashboard.

#### Scenario: A signed-out visitor opens a protected page

- **WHEN** a visitor with no session opens a dashboard page, a booking submission page, a review page, or onboarding
- **THEN** the system redirects the visitor to the sign-in page

#### Scenario: A signed-out visitor opens an admin page

- **WHEN** a visitor with no session opens an admin area
- **THEN** the system redirects the visitor to the sign-in page

#### Scenario: A signed-in business owner opens an admin area

- **WHEN** a signed-in visitor whose role is UMKM opens an admin area
- **THEN** the system redirects the visitor to the UMKM dashboard instead of the admin area

#### Scenario: A signed-in user opens the sign-in page

- **WHEN** a signed-in visitor who already has a profile opens the sign-in or sign-up page
- **THEN** the system redirects the visitor to the dashboard for its role

#### Scenario: An account without a profile opens a dashboard

- **WHEN** a signed-in visitor whose account has no profile opens a dashboard page
- **THEN** the system redirects the visitor to onboarding

#### Scenario: An admin opens an admin area

- **WHEN** a signed-in visitor whose role is admin opens an admin area
- **THEN** the system renders the area for that visitor

### Requirement: No in-product flow produces an admin

The system SHALL provide no sign-up, sign-in, or onboarding flow that results in the admin role.

#### Scenario: The onboarding role choice is offered

- **WHEN** a visitor reaches onboarding
- **THEN** the only roles offered are UMKM and creator

#### Scenario: The sign-up form is inspected

- **WHEN** a visitor inspects the sign-up form
- **THEN** it offers no control that would assign the admin role

#### Scenario: An admin account exists

- **WHEN** a profile carrying the admin role is examined
- **THEN** it was created outside the product, with no signup or onboarding step having produced it

### Requirement: Development environments can offer one-click demo sign-in

The system SHALL offer one-click sign-in as a seeded UMKM and as a seeded creator when running outside production, and SHALL NOT offer it in a production build.

#### Scenario: A walkthrough signs in as the demo business

- **WHEN** a visitor outside production activates the one-click demo sign-in for UMKM
- **THEN** the system establishes a session for the seeded business account

#### Scenario: A walkthrough signs in as the demo creator

- **WHEN** a visitor outside production activates the one-click demo sign-in for creator
- **THEN** the system establishes a session for the seeded creator account

#### Scenario: A production build is inspected

- **WHEN** a production build of the sign-in page is inspected
- **THEN** no demo sign-in control is present
