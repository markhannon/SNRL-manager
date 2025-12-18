# Feature Specification: Simracing Championship Series

**Feature Branch**: `004-simracing-series`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Series definition for simracing championships - A series represents a championship consisting of one or more simracing events. Each series defines the simulator, points scheme, series rules, and allowed cars. Each event within a series specifies a particular track, race length (laps or time), and details of one or more races during that event."

## Clarifications

### Session 2025-12-18

- Q: How do drivers/participants register for events or series? → A: Series-level registration - drivers register once for entire championship, auto-entered in all events
- Q: How are race results entered into the system after events complete? → A: Organizer manual entry with validation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Configure Championship Series (Priority: P1)

Championship organizers need to create and configure a new series by defining the core championship parameters: simulator, points scheme, series rules, and allowed cars. This establishes the competitive framework for the entire championship.

**Why this priority**: Without the ability to create a series with its fundamental rules, there's no championship framework. This is the foundational capability that enables all other championship management activities.

**Independent Test**: Can be fully tested by logging in as an organizer, creating a new series, specifying the simulator (e.g., iRacing, ACC), selecting a points scheme, defining series rules, and adding allowed cars. Delivers immediate value by establishing the championship structure.

**Acceptance Scenarios**:

1. **Given** an organizer is logged in, **When** they create a new series with name, simulator, and season dates, **Then** the series is created and appears in the series list
2. **Given** an organizer is creating a series, **When** they select a simulator from available options, **Then** the simulator is associated with the series
3. **Given** an organizer is configuring series settings, **When** they select or create a points scheme, **Then** the points scheme is applied to all events in the series
4. **Given** an organizer is setting up series rules, **When** they define rules text or upload rules document, **Then** the rules are saved and accessible to participants
5. **Given** an organizer is configuring allowed cars, **When** they select one or more cars from the simulator's car list, **Then** only those cars are permitted for events in this series
6. **Given** a series has been created, **When** an organizer views the series details, **Then** they see the simulator, points scheme, rules, and allowed cars

---

### User Story 2 - Create and Manage Series Events (Priority: P1)

Organizers need to create individual events within a series, specifying the track, race length, and scheduling details. Events are the building blocks of a championship where racing actually occurs.

**Why this priority**: A series without events has no racing action. Creating events is essential for the championship to function and for participants to compete.

**Independent Test**: Can be fully tested by selecting an existing series, creating a new event, choosing a track, setting race length (laps or time), specifying event date/time, and verifying the event appears in the series calendar. Delivers value by enabling actual racing events.

**Acceptance Scenarios**:

1. **Given** an organizer views a series, **When** they create a new event with a track and date, **Then** the event is added to the series calendar
2. **Given** an organizer is creating an event, **When** they select a track from the simulator's track list, **Then** the track is assigned to the event
3. **Given** an organizer is configuring event settings, **When** they specify race length as laps or time duration, **Then** the race length is saved with the appropriate unit
4. **Given** an organizer is scheduling an event, **When** they set the event date and time, **Then** the event appears in chronological order in the series calendar
5. **Given** an event exists, **When** an organizer edits the track or race length, **Then** the changes are saved and reflected in the event details
6. **Given** an event is created, **When** participants view the series, **Then** they see the event with track, date, and race length information

---

### User Story 3 - Define Multiple Races within an Event (Priority: P2)

Organizers need to define multiple race sessions within a single event (e.g., qualifying, sprint race, feature race) with distinct configurations and purposes. This enables complex event formats common in simracing championships.

**Why this priority**: While single-race events work for basic championships, many competitions require multiple race sessions (qualifying, heats, finals) for proper competitive structure. This adds flexibility after core event creation is working.

**Independent Test**: Can be fully tested by creating an event, adding multiple race sessions with different names, durations, and purposes (qualifying, race 1, race 2), and verifying each session is tracked separately. Delivers value by enabling sophisticated event formats.

**Acceptance Scenarios**:

1. **Given** an organizer is creating an event, **When** they add multiple race sessions, **Then** each session is created with its own configuration
2. **Given** an organizer is configuring a race session, **When** they specify session type (practice, qualifying, race), **Then** the session type determines how results are processed
3. **Given** an event has multiple race sessions, **When** an organizer sets the duration for each session, **Then** each session can have different lengths (laps or time)
4. **Given** a race session is configured, **When** an organizer specifies points allocation, **Then** the session can award full points, partial points, or no points
5. **Given** an event has multiple race sessions, **When** participants view the event, **Then** they see all sessions with their configurations and schedule

---

### User Story 4 - Enter and Manage Race Results (Priority: P1)

Organizers need to manually enter race results after events complete, including finishing positions, penalties, and DNFs. Manual entry allows review, validation, and corrections before results become official and affect championship standings.

**Why this priority**: Results entry is essential for championship functionality - without results, there are no standings. Manual entry provides control for stewarding decisions and penalty application.

**Independent Test**: Can be fully tested by completing an event, entering finishing positions for all participants, applying penalties/time additions, marking DNFs, and verifying results are saved and standings update correctly. Delivers value by enabling official race results and championship progression.

**Acceptance Scenarios**:

1. **Given** an event has completed, **When** an organizer enters race results with finishing positions for each driver, **Then** the results are saved and associated with the event
2. **Given** an organizer is entering results, **When** they apply a penalty (time addition or position penalty) to a driver, **Then** the adjusted finishing position is reflected in results
3. **Given** an organizer enters results, **When** they mark a driver as DNF (did not finish) or DNS (did not start), **Then** the driver receives no points for that event
4. **Given** results are entered, **When** the organizer saves and publishes results, **Then** championship standings automatically recalculate to reflect the new points
5. **Given** published results exist, **When** an organizer needs to correct an error, **Then** they can edit results with an audit trail of changes
6. **Given** results are published, **When** a driver views their profile, **Then** they see their finishing position and points earned for that event

---

### User Story 5 - View Series Standings and Results (Priority: P2)

Participants and spectators need to view current championship standings calculated from event results using the series points scheme. This provides competitive context and championship narrative.

**Why this priority**: Standings create competitive meaning for the races, but basic events can occur without them. This can be added after event creation and results are working.

**Independent Test**: Can be fully tested by completing one or more events with results, viewing the series standings page, and verifying drivers are ranked by points according to the series points scheme. Delivers value through competitive tracking and engagement.

**Acceptance Scenarios**:

1. **Given** a series has completed events with results, **When** a user views the series standings, **Then** they see drivers ranked by total championship points
2. **Given** standings are displayed, **When** the points scheme awards points by finishing position, **Then** drivers' total points reflect their finishes across all events
3. **Given** a user views standings, **When** they select a specific driver, **Then** they see that driver's event-by-event points breakdown
4. **Given** multiple events have occurred, **When** standings are calculated, **Then** only results from events in this series count toward standings
5. **Given** a new event completes, **When** results are finalized, **Then** the standings automatically update to reflect the new points

---

### User Story 6 - Manage Points Schemes (Priority: P3)

Organizers need to create and manage custom points schemes that define how championship points are awarded based on finishing positions. Different championships may use different point structures.

**Why this priority**: While important for championship variety, a default points scheme can be used initially. Custom schemes add flexibility after core functionality is in place.

**Independent Test**: Can be fully tested by creating a new points scheme, defining points for each finishing position (1st: 25 points, 2nd: 18 points, etc.), assigning it to a series, and verifying results use this scheme for points calculation. Delivers value through championship customization.

**Acceptance Scenarios**:

1. **Given** an organizer is creating a points scheme, **When** they define points for each finishing position, **Then** the scheme is saved and available for series
2. **Given** a points scheme is defined, **When** an organizer assigns it to a series, **Then** all events in that series use this scheme for points calculation
3. **Given** a points scheme exists, **When** an organizer edits the points values, **Then** the changes affect future events but not historical results
4. **Given** multiple points schemes exist, **When** an organizer creates a new series, **Then** they can select from available schemes or create a new one
5. **Given** a points scheme is in use by a series, **When** an organizer attempts to delete it, **Then** they receive a warning about series dependencies

---

### User Story 7 - Register for Championship Series (Priority: P2)

Drivers need to register for a championship series to become participants in all events throughout the season. Series-level registration commits drivers to the full championship and automatically enters them in all scheduled events.

**Why this priority**: Driver registration is essential for series participation but can be tested after basic series and event creation is working. This enables competitive racing by building a committed participant roster.

**Independent Test**: Can be fully tested by viewing an available series as a driver, registering for the series, and verifying automatic entry in all series events with participant status visible to organizers. Delivers value by enabling driver commitment and championship participation.

**Acceptance Scenarios**:

1. **Given** a driver views a series details page, **When** they click register for the series, **Then** they are registered for the entire championship
2. **Given** a driver registers for a series, **When** new events are added to the series, **Then** the driver is automatically entered in those events
3. **Given** a driver is registered for a series, **When** they view the series page, **Then** they see their registration status and all events they're entered in
4. **Given** an organizer views series participants, **When** they check the roster, **Then** they see all registered drivers with registration dates
5. **Given** a driver registers for a series, **When** the organizer sets registration limits, **Then** registration closes once the limit is reached
6. **Given** a registered driver, **When** they want to withdraw from the series, **Then** they can unregister (with restrictions if events have already occurred)

---

### User Story 8 - Browse and Search Series (Priority: P3)

Users need to browse available series, search by simulator or name, and filter by status (upcoming, active, completed) to discover championships to join or follow.

**Why this priority**: Discovery improves user engagement but isn't required for basic championship operation. This can be added after core series and event management is working.

**Independent Test**: Can be fully tested by viewing the series list, applying filters (simulator, status), searching by name, and verifying only matching series appear. Delivers value through improved discoverability.

**Acceptance Scenarios**:

1. **Given** a user views the series list, **When** the page loads, **Then** they see all available series with name, simulator, and status
2. **Given** a user is browsing series, **When** they filter by simulator, **Then** only series using that simulator are displayed
3. **Given** a user is browsing series, **When** they filter by status (upcoming, active, completed), **Then** only series matching that status are shown
4. **Given** a user searches for a series by name, **When** they enter search terms, **Then** only series matching those terms appear
5. **Given** a user selects a series from the list, **When** they click on it, **Then** they see the full series details including events and standings

---

### Edge Cases

- What happens when an organizer tries to create an event with a track not available in the selected simulator?
- How does the system handle adding cars to a series that become unavailable in the simulator?
- What happens when an event's race length is set to zero laps or zero time?
- How are points calculated when fewer drivers participate than there are positions in the points scheme?
- What happens to series standings when event results are modified after publication?
- How does the system handle events scheduled for the same date/time in the same series?
- What happens when an organizer tries to delete a series that has completed events with results?
- How are ties in championship standings resolved when drivers have equal points?
- What happens when a points scheme is modified mid-season?
- How does the system handle multiple race sessions awarding points in the same event?
- What happens to event data when a simulator updates its track or car list?
- How are drop scores or bonus points handled in the points scheme?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow organizers to create a new championship series with name, description, and season dates
- **FR-002**: System MUST allow organizers to select a simulator for the series from available options
- **FR-003**: System MUST allow organizers to assign a points scheme to a series
- **FR-004**: System MUST allow organizers to define or reference series rules and regulations
- **FR-005**: System MUST allow organizers to specify which cars are allowed in a series
- **FR-006**: System MUST allow organizers to create events within a series
- **FR-007**: System MUST allow organizers to select a track for each event from the simulator's track list
- **FR-008**: System MUST allow organizers to specify race length as either lap count or time duration
- **FR-009**: System MUST allow organizers to set event date and time
- **FR-010**: System MUST allow organizers to define multiple race sessions within an event
- **FR-011**: System MUST track race session type (practice, qualifying, race) and purpose
- **FR-012**: System MUST allow different race sessions to have different lengths and configurations
- **FR-013**: System MUST allow organizers to create and manage custom points schemes
- **FR-014**: System MUST define points awarded for each finishing position in a points scheme
- **FR-015**: System MUST allow organizers to manually enter race results with finishing positions for each driver
- **FR-016**: System MUST allow organizers to apply penalties (time additions or position penalties) when entering results
- **FR-017**: System MUST allow organizers to mark drivers as DNF (did not finish) or DNS (did not start)
- **FR-018**: System MUST save entered results as draft until organizer publishes them
- **FR-019**: System MUST allow organizers to edit unpublished results before finalizing
- **FR-020**: System MUST maintain an audit trail of all results changes including who made changes and when
- **FR-021**: System MUST calculate championship standings based on event results and the series points scheme
- **FR-022**: System MUST display drivers ranked by total points in series standings
- **FR-023**: System MUST show event-by-event points breakdown for each driver
- **FR-024**: System MUST update standings automatically when new event results are published
- **FR-025**: System MUST display series with name, simulator, status, and season dates
- **FR-026**: System MUST allow users to browse and filter series by simulator and status
- **FR-027**: System MUST allow users to search for series by name
- **FR-028**: System MUST allow drivers to register for a championship series
- **FR-029**: System MUST automatically enter registered drivers in all events within their registered series
- **FR-030**: System MUST automatically enter drivers in new events added after their series registration
- **FR-031**: System MUST allow organizers to set maximum participant limits for series registration
- **FR-032**: System MUST prevent new registrations once series participant limit is reached
- **FR-033**: System MUST allow organizers to view all registered participants for their series
- **FR-034**: System MUST allow registered drivers to withdraw from a series with restrictions if events have occurred
- **FR-035**: System MUST validate that selected tracks and cars are available in the chosen simulator
- **FR-036**: System MUST prevent deletion of series with historical event data
- **FR-037**: System MUST resolve tied championship standings using countback to best finishes (most wins, then most 2nd places, then most 3rd places, etc.)
- **FR-038**: System MUST recalculate all championship standings when a points scheme is modified, affecting all events retroactively
- **FR-039**: System MUST organize events chronologically within a series calendar

### Key Entities

- **Championship Series**: A complete racing championship. Key attributes include: unique identifier, name, description, simulator (e.g., iRacing, Assetto Corsa Competizione), season start date, season end date, status (upcoming, active, completed), points scheme identifier, series rules text/document, allowed cars list, maximum participants (optional limit), current participant count, created by (organizer), creation date. Relationships: Contains multiple events; uses one points scheme; has multiple series registrations; may have series-specific organizer permissions

- **Series Registration**: Links a driver to a championship series for the full season. Key attributes include: unique identifier, series identifier, driver (user identifier), registration date, status (active, withdrawn), withdrawal date (if applicable), withdrawal reason (optional). Relationships: Links one driver to one series; creates automatic event entries for all series events

- **Event**: A racing event within a series, occurring at a specific track on a specific date. Key attributes include: unique identifier, series identifier, event name, track (from simulator's track list), event date and time, race length value, race length unit (laps or time), status (scheduled, in-progress, completed), created by (organizer), creation date. Relationships: Belongs to one series; contains one or more race sessions; has entries from all registered series participants; generates results contributing to series standings

- **Race Session**: An individual racing session within an event. Key attributes include: unique identifier, event identifier, session name, session type (practice, qualifying, sprint race, feature race), session order (1st, 2nd, 3rd), duration value, duration unit (laps or time), points allocation (full, partial, none), scheduled start time. Relationships: Belongs to one event; has race results entered by organizers

- **Event Results**: Race results for participants in a session or event. Key attributes include: unique identifier, event identifier (or session identifier), driver (user identifier), finishing position, original position (before penalties), penalties applied (description and type), penalty time/positions, status (DNF, DNS, classified), points awarded, result status (draft, published), published date, entered by (organizer), last modified date, modification history. Relationships: Links to one event and one driver; used to calculate standings

- **Points Scheme**: Defines how championship points are awarded. Key attributes include: unique identifier, scheme name, description, position-to-points mapping (1st place: X points, 2nd place: Y points, etc.), bonus points rules (fastest lap, pole position - optional), drop scores rule (drop worst N results - optional), created by (organizer). Relationships: Can be used by multiple series; defines points calculation

- **Series Standings**: Championship leaderboard showing driver rankings. Key attributes include: series identifier, driver identifier, total points, events participated, best finish, most recent finish, position in standings, points breakdown by event. Relationships: Links to one series; calculated from event results and points scheme; updates when results are finalized

- **Allowed Cars**: List of cars permitted for competition in a series. Key attributes include: series identifier, car identifier (from simulator), car name, car class/category. Relationships: Links to one series; restricts what participants can use in events

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Organizers can create a fully configured championship series in under 5 minutes
- **SC-002**: Organizers can create and schedule an event with all required details in under 2 minutes
- **SC-003**: Series standings update automatically within 30 seconds of event results being finalized
- **SC-004**: Users can browse and find relevant series within 3 clicks from the series list
- **SC-005**: 95% of organizers successfully create their first series without errors or confusion
- **SC-006**: System accurately calculates standings for series with 50+ events and 100+ participants
- **SC-007**: Points calculations are correct 100% of the time according to the selected points scheme
- **SC-008**: Event calendars display clearly with no scheduling conflicts or overlaps within a series
- **SC-009**: Users can view complete series information (events, standings, rules) within 2 seconds
- **SC-010**: Zero incidents of points calculation errors or standing ranking mistakes

## Assumptions *(if applicable)*

This section documents assumptions and decisions made while creating this specification:

1. **Simulator Options**: Assumed the system supports multiple racing simulators (iRacing, Assetto Corsa Competizione, rFactor 2, etc.) as selectable options. Each simulator provides its own track and car lists.

2. **Track and Car Data**: Assumed track and car lists are maintained per simulator and available for selection when creating events. The system validates selections against the chosen simulator's available content.

3. **Race Length Flexibility**: Assumed races can be configured either by lap count (e.g., 30 laps) or time duration (e.g., 60 minutes) to accommodate different racing formats. Both units are supported independently.

4. **Points Scheme Flexibility**: Assumed organizers can create custom points schemes or use standard schemes (F1-style, MotoGP-style, etc.). Points are assigned by finishing position with optional bonus points.

5. **Series Status**: Series have lifecycle statuses: upcoming (not started), active (in-season), completed (season ended). Status affects visibility and editing permissions.

6. **Event Scheduling**: Assumed events are scheduled with specific date and time. The system allows multiple events but should warn about potential scheduling conflicts.

7. **Multi-Session Events**: Events can have multiple race sessions (qualifying + race, or sprint + feature race, etc.). Each session can be configured independently and may or may not award points.

8. **Standings Calculation**: Championship standings are automatically calculated by summing points from all completed events. Assumed real-time or near-real-time updates when results are finalized.

9. **Historical Data Preservation**: Completed series with results should not be deletable to preserve championship history. Edit restrictions apply to completed series.

10. **Organizer Permissions**: Assumed series creators (organizers) have full edit permissions for their series. Admin users can manage all series. Based on the admin-user spec, series-specific permissions may allow other users to help manage specific championships.

11. **Tie Breaking**: Ties in championship standings are resolved using countback to best finishes. When drivers have equal points, the driver with more wins ranks higher. If still tied, compare 2nd place finishes, then 3rd place finishes, and so on. This provides a fair and objective tie-breaking mechanism common in racing championships.

12. **Points Scheme Changes**: When a points scheme is modified, all championship standings are recalculated retroactively to reflect the new scheme across all events. This ensures consistency in how points are awarded throughout the series, though organizers should be warned about the impact of mid-season changes on existing standings.

13. **Default Points Scheme**: Assumed a standard F1-style points scheme (25-18-15-12-10-8-6-4-2-1 for top 10) is available as a default option to simplify initial series creation.

14. **Series Duration**: Assumed series can span multiple months or a full season. No hard limits on number of events per series, but practical limits depend on scheduling.
