# Spec Delta

## Purpose

Provides one shared set of presentational components so dashboards, lists, and marketing screens share the same sidebar, header, cards, tables, and feedback elements.

## ADDED Requirements

### Requirement: Shared dashboard frame components exist

The system SHALL provide reusable sidebar, dashboard header (title, notification bell, profile entry), KPI card, and data table components that render the ARCHITECTURE.md shared layout for any role.

#### Scenario: UMKM dashboard uses the shared frame

- **WHEN** the UMKM dashboard renders
- **THEN** its sidebar, header, KPI cards, and history table come from the shared components with identical structure across viewports

### Requirement: Shared discovery and feedback components exist

The system SHALL provide reusable creator card, status badge, notification bell with dropdown, empty state, button, input, and filter chip components matching DESIGN_SYSTEM.md §10.

#### Scenario: Status is communicated by color plus text

- **WHEN** a booking status renders
- **THEN** the badge shows the Indonesian label with its semantic color and never color alone

### Requirement: Components consume tokens only

Components SHALL style exclusively with token utilities from the `design-tokens` capability and MUST NOT hardcode hex values or off-system palettes.

#### Scenario: Single-brand rendering

- **WHEN** any shared component renders
- **THEN** all brand surfaces use the primary blue scale and success green appears only in success contexts
