# Spec Delta

## Purpose

Define how anyone browses creators on Kolab.id without holding an account: searching, filtering and sorting the creator list, reading a creator's public page with its packages and reviews, seeing market price insight for a category, and how a creator maintains the packages those pages offer.

## ADDED Requirements

### Requirement: The creator list is browsable without an account

The system SHALL let any visitor, signed in or not, list creators with a text search across a creator's name and handle, filters for category, city, and maximum starting price, and ordering by popularity, lowest price, or highest rating. Filters SHALL combine, and a combination that matches nothing SHALL report an empty result rather than an error.

#### Scenario: A visitor lists creators

- **WHEN** a visitor with no session opens the creator list
- **THEN** the system returns the creators with each one's name, handle, category, city, follower count, rating, starting price, and whether the creator is verified

#### Scenario: A visitor searches by name or handle

- **WHEN** a visitor types text into the search field
- **THEN** the system returns only creators whose name or handle contains that text, ignoring text that matches neither

#### Scenario: A visitor filters by category, city, and price together

- **WHEN** a visitor selects a category, a city, and a maximum starting price
- **THEN** the system returns only creators matching all three, priced at or below that maximum

#### Scenario: A visitor sorts the list

- **WHEN** a visitor chooses to sort by most followers, lowest price, or highest rating
- **THEN** the system returns the matching creators in that order, and creators with no ratings sort after those that have ratings rather than ahead of them

#### Scenario: A filter combination matches nothing

- **WHEN** a visitor applies filters for which no creator qualifies
- **THEN** the system reports that no creator matches and offers a way to clear the filters, rather than reporting an error

### Requirement: A creator's public page shows its packages, terms, and reviews

The system SHALL show a creator's public page to any visitor, listing that creator's active packages with their price, included items, revision quota, and estimated days, and listing the reviews written by UMKM about that creator together with the rating summary they produce.

#### Scenario: A visitor opens a creator's page

- **WHEN** a visitor with no session opens a creator's public page
- **THEN** the system shows the creator's bio, category, city, follower count, verification state, starting price, and rating with its review count

#### Scenario: A visitor reads the creator's packages

- **WHEN** a creator has active packages
- **THEN** the system lists each one with its name, price, included items, revision quota, and estimated days

#### Scenario: A visitor reads the creator's reviews

- **WHEN** a creator has received reviews
- **THEN** the system lists each review with its rating, comment, and the name of the business that wrote it

#### Scenario: A creator has no reviews yet

- **WHEN** a visitor opens a creator's page for a creator that has not been reviewed
- **THEN** the system shows that no reviews exist yet, rather than an empty or failed section

### Requirement: A package's terms are stated before a request is made

The system SHALL show a package's price, included items, revision quota, and estimated days on the package itself, so a visitor can see what a request would cost and what it includes before starting one.

#### Scenario: A visitor compares packages

- **WHEN** a visitor views a creator with several packages
- **THEN** the system shows every package's price, included items, revision quota, and estimated days together, so they can be compared

#### Scenario: A visitor starts a request from a package

- **WHEN** a visitor activates the request action on one package
- **THEN** the request the visitor is about to make names that same package and shows the same price, quota, and estimated days

### Requirement: Only active packages are offered

The system SHALL offer a package for a new request only while it is active, and SHALL stop offering it once it is deactivated, without altering requests already made from it.

#### Scenario: A creator deactivates a package

- **WHEN** a creator deactivates one of their packages
- **THEN** the system stops listing that package on the creator's public page and refuses a new request naming it

#### Scenario: A request already exists for a deactivated package

- **WHEN** a booking was created from a package that is later deactivated
- **THEN** that booking keeps the package name, price, revision quota, and estimated days recorded when it was submitted

#### Scenario: A creator reactivates a package

- **WHEN** a creator reactivates a previously deactivated package
- **THEN** the system lists it again and accepts new requests naming it

### Requirement: A creator maintains their own packages

The system SHALL let a creator create, edit, and deactivate packages on their own profile, and SHALL refuse any attempt to change a package belonging to another creator. A creator's starting price SHALL always equal the cheapest of their active packages.

#### Scenario: A creator adds a package

- **WHEN** a creator submits a package with a name, price, included items, a revision quota, and an estimated number of days
- **THEN** the system creates it, shows it on their public page, and makes it available for new requests

#### Scenario: A creator submits a revision quota outside the allowed range

- **WHEN** a creator submits a package with a revision quota below one or above five
- **THEN** the system refuses the package and reports that the quota must be between one and five

#### Scenario: A creator edits a package's price

- **WHEN** a creator changes the price of one of their active packages
- **THEN** the public page and the creator's starting price both reflect the new price, and bookings already submitted from that package keep the price recorded at submission

#### Scenario: A creator changes the cheapest package

- **WHEN** a creator raises the price of the package that was cheapest, leaving another package cheaper
- **THEN** the creator's starting price becomes that other package's price without any further action

#### Scenario: A creator edits another creator's package

- **WHEN** a signed-in creator submits a change naming a package belonging to a different creator
- **THEN** the system refuses the change and leaves the package as it was

### Requirement: Market price insight is public for a category

The system SHALL show, to any visitor and for any category, the lowest, average, and highest starting price among that category's creators, computed from creators that actually have one.

#### Scenario: A visitor reads insight for a category

- **WHEN** a visitor opens market insight for a category that creators belong to
- **THEN** the system shows the lowest, average, and highest starting price in that category

#### Scenario: A category has no priced creators

- **WHEN** a visitor opens market insight for a category that no creator belongs to
- **THEN** the system reports that there is no data for that category rather than showing zeros

#### Scenario: A creator's price changes

- **WHEN** a creator's starting price changes
- **THEN** the insight figures for that creator's category reflect the new value

### Requirement: Filter options come from the catalog

The system SHALL derive the category and city filter options from the creators that exist, so an option is never offered that no creator matches, and SHALL treat a city that exists but matches no creator under the other active filters as an empty result.

#### Scenario: A visitor opens the filter options

- **WHEN** a visitor opens the creator list filters
- **THEN** the category options are the categories creators belong to and the city options are the cities creators are in

#### Scenario: A city matches nothing under the other filters

- **WHEN** a visitor selects a city that exists but where no creator matches the other active filters
- **THEN** the system reports an empty result rather than an error

### Requirement: A signed-in UMKM is shown creators that fit its business

The system SHALL show a signed-in UMKM recommendations drawn from creators whose category matches the business's own category or whose city matches the business's city, ordered by that fit and then by rating, and SHALL NOT rank them by follower count. The system SHALL show no recommendation block to a signed-out visitor or to a creator.

#### Scenario: An UMKM sees recommendations

- **WHEN** a signed-in UMKM opens its dashboard
- **THEN** the system recommends creators matching its category or city, each shown with the reason it matched

#### Scenario: A smaller creator outranks a larger one on fit

- **WHEN** a creator matching the UMKM's category exactly has fewer followers than a creator from another category
- **THEN** the matching creator is recommended first

#### Scenario: A creator visits their dashboard

- **WHEN** a signed-in creator opens their dashboard
- **THEN** the system shows no creator recommendation block, since only a business looks for creators

#### Scenario: A signed-out visitor views the landing page

- **WHEN** a visitor with no session opens the landing page
- **THEN** the system shows no creator recommendation block
