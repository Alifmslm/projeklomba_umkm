# design-tokens Specification

## Purpose
Makes the DESIGN_SYSTEM.md v1.1 token scale available as Tailwind v4 utilities so every screen is styled from tokens instead of ad-hoc values.

## Requirements

### Requirement: Brand and semantic colors are theme utilities

The system SHALL expose the primary, success, neutral, error, warning, and info scales from DESIGN_SYSTEM.md §14 as Tailwind utilities (e.g. `bg-primary-600`, `text-success-700`, `border-neutral-200`).

#### Scenario: Developer styles with a token utility

- **WHEN** a developer writes `bg-primary-600` or `text-neutral-900` in a class list
- **THEN** the rendered color matches the hex value in DESIGN_SYSTEM.md §14

#### Scenario: No secondary brand hue exists

- **WHEN** the theme is inspected
- **THEN** no orange/accent scale is defined and no component references one

### Requirement: Fonts, shadows, and easing are theme utilities

The system SHALL expose `font-head`, `shadow-xs` through `shadow-lg`, `ease-standard`, and `ease-emphasized` as utilities matching DESIGN_SYSTEM.md §14 values.

#### Scenario: Card and motion styling from tokens

- **WHEN** a card uses `shadow-sm` and a transition uses `duration-250 ease-standard`
- **THEN** the rendered shadow, duration, and easing match the token values

### Requirement: Radius, spacing, and durations use built-in utilities

The system SHALL style radius, spacing, and durations with built-in Tailwind classes per the DESIGN_SYSTEM.md §16 mapping (e.g. `--radius-md` as `rounded-xl`, `--space-7` as `*-8`).

#### Scenario: No raw pixel radius or hex in new code

- **WHEN** a rebuilt screen is reviewed
- **THEN** it contains no hardcoded hex colors and no arbitrary radius values outside the §16 mapping
