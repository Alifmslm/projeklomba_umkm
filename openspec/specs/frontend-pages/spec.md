# frontend-pages Specification

## Purpose
Rebuilds every user-facing page and role flow on the shared components so the whole product works end to end with one visual language on the existing mock data layer.

## Requirements

### Requirement: Public pages render on shared components

The system SHALL render the landing page, creator list with filters, creator detail, price insights, and login screens using shared components and token utilities, with unchanged URLs and content.

#### Scenario: Visitor browses creators

- **WHEN** a visitor opens the creator list, applies a filter, and opens a detail page
- **THEN** each screen uses shared cards, chips, badges, and price display with unchanged navigation

### Requirement: Role dashboards and flows work on mock data

The system SHALL render the UMKM dashboard (KPIs, recommendations, history, riwayat, profile, chat), creator dashboard, booking form, and two-way review flow on shared components, preserving guards, redirects, and mock-data behavior.

#### Scenario: UMKM completes a booking flow

- **WHEN** a logged-in UMKM submits a booking, the creator confirms it, and both sides review
- **THEN** every screen in the flow renders from shared components and the booking reaches reviewed status as before

### Requirement: No route, guard, or data behavior changes

The rebuild SHALL NOT change route URLs, role guards, redirects, mock data shapes, or Server Action logic; visual output is the only intended diff.

#### Scenario: Regression check on guards

- **WHEN** a logged-out visitor opens a protected page or a wrong-role user opens another role's dashboard
- **THEN** the redirect targets are identical to before the rebuild
