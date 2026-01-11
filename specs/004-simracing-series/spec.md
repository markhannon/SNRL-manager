# Feature Specification: Simracing Championship Series

**Feature Branch**: `004-simracing-series`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Series definition for simracing championships - A championship consists of one or more simracing events. Each championship defines the simulator, points scheme, championship rules, and allowed cars. Each event within a championship specifies a particular track, race length (laps or time), and details of one or more races during that event."

## Clarifications

### Session 2025-12-18

- Q: How do drivers/participants register for events or championships? → A: Championship-level registration - drivers register once for entire championship, auto-entered in all events
- Q: How are race results entered into the system after events complete? → A: Organizer manual entry with validation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Configure Championship (Priority: P1)

Championship organizers need to create and configure a new championship by defining the core championship parameters: simulator, points scheme, championship rules, and allowed cars. This establishes the competitive framework for the entire championship.

**Why this priority**: Without the ability to create a championship with its fundamental rules, there's no championship framework. This is the foundational capability that enables all other championship management activities.

**Independent Test**: Can be fully tested by logging in as an organizer, creating a new championship, specifying the simulator (e.g., iRacing, ACC), selecting a points scheme, defining championship rules, and adding allowed cars. Delivers immediate value by establishing the championship structure.

**Acceptance Scenarios**:

1. **Given** an organizer is logged in, **When** they create a new championship with name, simulator, and season dates, **Then** the championship is created and appears in the championship list
2. **Given** an organizer is creating a championship, **When** they select a simulator from available options, **Then** the simulator is associated with the championship
3. **Given** an organizer is configuring championship settings, **When** they select or create a points scheme, **Then** the points scheme is applied to all events in the championship
4. **Given** an organizer is setting up championship rules, **When** they define rules text or upload rules document, **Then** the rules are saved and accessible to participants
5. **Given** an organizer is configuring allowed cars, **When** they select one or more cars from the simulator's car list, **Then** only those cars are permitted for events in this championship
6. **Given** a championship has been created, **When** an organizer views the championship details, **Then** they see the simulator, points scheme, rules, and allowed cars

---

### User Story 2 - Create and Manage Championship Events (Priority: P1)

Organizers need to create individual events within a championship, specifying the track, race length, and scheduling details. Events are the building blocks of a championship where racing actually occurs.

**Why this priority**: A championship without events has no racing action. Creating events is essential for the championship to function and for participants to compete.

**Independent Test**: Can be fully tested by selecting an existing championship, creating a new event, choosing a track, setting race length (laps or time), specifying event date/time, and verifying the event appears in the championship calendar. Delivers value by enabling actual racing events.

**Acceptance Scenarios**:

1. **Given** an organizer views a championship, **When** they create a new event with a track and date, **Then** the event is added to the championship calendar
2. **Given** an organizer is creating an event, **When** they select a track from the simulator's track list, **Then** the track is assigned to the event
3. **Given** an organizer is configuring event settings, **When** they specify race length as laps or time duration, **Then** the race length is saved with the appropriate unit
4. **Given** an organizer is scheduling an event, **When** they set the event date and time, **Then** the event appears in chronological order in the championship calendar
5. **Given** an event exists, **When** an organizer edits the track or race length, **Then** the changes are saved and reflected in the event details
6. **Given** an event is created, **When** participants view the championship, **Then** they see the event with track, date, and race length information

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

### User Story 5 - View Championship Standings and Results (Priority: P2)

Participants and spectators need to view current championship standings calculated from event results using the championship points scheme. This provides competitive context and championship narrative.

**Why this priority**: Standings create competitive meaning for the races, but basic events can occur without them. This can be added after event creation and results are working.

**Independent Test**: Can be fully tested by completing one or more events with results, viewing the championship standings page, and verifying drivers are ranked by points according to the championship points scheme. Delivers value through competitive tracking and engagement.

**Acceptance Scenarios**:

1. **Given** a championship has completed events with results, **When** a user views the championship standings, **Then** they see drivers ranked by total championship points
2. **Given** standings are displayed, **When** the points scheme awards points by finishing position, **Then** drivers' total points reflect their finishes across all events
3. **Given** a user views standings, **When** they select a specific driver, **Then** they see that driver's event-by-event points breakdown
4. **Given** multiple events have occurred, **When** standings are calculated, **Then** only results from events in this championship count toward standings
5. **Given** a new event completes, **When** results are finalized, **Then** the standings automatically update to reflect the new points

---

### User Story 6 - Manage Points Schemes (Priority: P3)

Organizers need to create and manage custom points schemes that define how championship points are awarded based on finishing positions. Different championships may use different point structures.

**Why this priority**: While important for championship variety, a default points scheme can be used initially. Custom schemes add flexibility after core functionality is in place.

**Independent Test**: Can be fully tested by creating a new points scheme, defining points for each finishing position (1st: 25 points, 2nd: 18 points, etc.), assigning it to a championship, and verifying results use this scheme for points calculation. Delivers value through championship customization.

**Acceptance Scenarios**:

1. **Given** an organizer is creating a points scheme, **When** they define points for each finishing position, **Then** the scheme is saved and available for championships
2. **Given** a points scheme is defined, **When** an organizer assigns it to a championship, **Then** all events in that championship use this scheme for points calculation
3. **Given** a points scheme exists, **When** an organizer edits the points values, **Then** the changes affect future events but not historical results
4. **Given** multiple points schemes exist, **When** an organizer creates a new championship, **Then** they can select from available schemes or create a new one
5. **Given** a points scheme is in use by a championship, **When** an organizer attempts to delete it, **Then** they receive a warning about championship dependencies

---

### User Story 7 - Register for Championship (Priority: P2)

Drivers need to register for a championship to become participants in all events throughout the season. Championship-level registration commits drivers to the full championship and automatically enters them in all scheduled events.

**Why this priority**: Driver registration is essential for championship participation but can be tested after basic championship and event creation is working. This enables competitive racing by building a committed participant roster.

**Independent Test**: Can be fully tested by viewing an available championship as a driver, registering for the championship, and verifying automatic entry in all championship events with participant status visible to organizers. Delivers value by enabling driver commitment and championship participation.

**Acceptance Scenarios**:

1. **Given** a driver views a championship details page, **When** they click register for the championship, **Then** they are registered for the entire championship
2. **Given** a driver registers for a championship, **When** new events are added to the championship, **Then** the driver is automatically entered in those events
3. **Given** a driver is registered for a championship, **When** they view the championship page, **Then** they see their registration status and all events they're entered in
4. **Given** an organizer views championship participants, **When** they check the roster, **Then** they see all registered drivers with registration dates
5. **Given** a driver registers for a championship, **When** the organizer sets registration limits, **Then** registration closes once the limit is reached
6. **Given** a registered driver, **When** they want to withdraw from the championship, **Then** they can unregister (with restrictions if events have already occurred)

---

### User Story 8 - Browse and Search Championships (Priority: P3)

Users need to browse available championships, search by simulator or name, and filter by status (upcoming, active, completed) to discover championships to join or follow.

**Why this priority**: Discovery improves user engagement but isn't required for basic championship operation. This can be added after core championship and event management is working.

**Independent Test**: Can be fully tested by viewing the championship list, applying filters (simulator, status), searching by name, and verifying only matching championships appear. Delivers value through improved discoverability.

**Acceptance Scenarios**:

1. **Given** a user views the championship list, **When** the page loads, **Then** they see all available championships with name, simulator, and status
2. **Given** a user is browsing championships, **When** they filter by simulator, **Then** only championships using that simulator are displayed
3. **Given** a user is browsing championships, **When** they filter by status (upcoming, active, completed), **Then** only championships matching that status are shown
4. **Given** a user searches for a championship by name, **When** they enter search terms, **Then** only championships matching those terms appear
5. **Given** a user selects a championship from the list, **When** they click on it, **Then** they see the full championship details including events and standings

---

### User Story 9 - Import Championship from External URL (Priority: P3)

Organizers need to quickly create championships by importing schedule data from external sources (e.g., official racing series websites) rather than manually entering each event. This streamlines championship setup by automatically parsing event dates, tracks, and race formats from publicly available schedules.

**Why this priority**: While valuable for reducing setup time, manual championship creation (User Stories 1-2) works fine for initial functionality. This automation feature enhances productivity after core features are established.

**Independent Test**: Can be fully tested by providing a URL to a racing schedule (e.g., Formula 1 calendar), verifying the system extracts championship name, season dates, and event details (dates, locations), then creates the championship with all events pre-populated. Delivers value by dramatically reducing championship setup time from hours to minutes.

**Acceptance Scenarios**:

1. **Given** an organizer is creating a championship, **When** they provide a URL to an external racing schedule (e.g., https://www.formula1.com/en/racing/2026), **Then** the system parses the page and extracts championship metadata (name, season, events)
2. **Given** the system has parsed a racing schedule URL, **When** the organizer reviews the extracted data, **Then** they see a preview showing championship name, season dates, and a list of events with dates and track names
3. **Given** an organizer reviews parsed championship data, **When** they approve the import, **Then** the system creates the championship with all events, setting status to draft for further configuration
4. **Given** a championship has been imported from URL, **When** the organizer views the created championship, **Then** they can edit any details (add allowed cars, select points scheme, refine event details, map tracks to simulator)
5. **Given** the system attempts to parse an unsupported URL, **When** parsing fails or returns insufficient data, **Then** the organizer sees a clear error message with guidance to use manual creation instead
6. **Given** a parsed event references a track name, **When** the organizer maps events to the simulator, **Then** they can match extracted track names to tracks available in the selected simulator
7. **Given** an imported championship has all events configured, **When** the organizer finalizes setup, **Then** the championship becomes active and available for driver registration

---

### User Story 10 - Cancel or Reschedule Championship Events (Priority: P2)

Admins and championship organizers need to cancel or reschedule events in active championships due to unforeseen circumstances (real-world conflicts, technical issues, insufficient participation). This enables flexible championship management when conditions change after the schedule is published.

**Why this priority**: While championships can function with fixed schedules, real-world circumstances often require adjustments. This is essential for championship longevity and participant satisfaction but can be added after core event creation and results workflows are working.

**Independent Test**: Can be fully tested by creating an active championship with registered drivers, selecting an event, either cancelling it (with participant notifications) or rescheduling to a new date (checking for conflicts), and verifying the changes are reflected in the calendar and participants are notified. Delivers value by enabling championship adaptation to changing circumstances.

**Acceptance Scenarios**:

1. **Given** an admin views an active championship, **When** they select an event that hasn't occurred yet, **Then** they see options to cancel or reschedule the event
2. **Given** an admin cancels an event, **When** they confirm the cancellation with a reason, **Then** the event status changes to cancelled, participants are notified, and the event remains visible in history but doesn't count toward standings
3. **Given** an admin reschedules an event, **When** they select a new date and time, **Then** the system checks for scheduling conflicts with other events and warns if conflicts exist
4. **Given** an admin reschedules an event to a new date, **When** they confirm the change, **Then** the event date updates, all registered drivers remain entered, and participants receive notification of the new date
5. **Given** an event has already occurred with published results, **When** an admin attempts to cancel it, **Then** the system prevents cancellation and displays a message that events with results cannot be cancelled
6. **Given** an admin cancels multiple events, **When** viewing championship standings, **Then** only non-cancelled event results count toward driver points and standings calculations
7. **Given** a cancelled event, **When** an admin changes their decision, **Then** they can reinstate the event with its original or new date, restoring it to scheduled status
8. **Given** an event is rescheduled, **When** registered drivers view the championship, **Then** they see the updated date with a clear indication the event was rescheduled and the original date (for context)

---

### User Story 11 - Export Championship Calendar to External Calendars (Priority: P3)

Drivers and spectators need to export championship schedules to their personal calendars (Google Calendar, Outlook, Apple Calendar) to track upcoming events alongside their other commitments. This enables participants to integrate racing schedules into their daily planning tools.

**Why this priority**: While viewing the championship calendar in-app works, integration with personal calendar systems significantly improves participant engagement and reduces missed events. This convenience feature can be added after core championship functionality is established.

**Independent Test**: Can be fully tested by selecting a championship, exporting the calendar as an ICS file, importing it into a calendar application (Google Calendar, Outlook), and verifying all events appear with correct dates, times, and details. For Google Calendar publishing, verify events auto-update when the championship schedule changes. Delivers value by reducing scheduling conflicts and improving event attendance.

**Acceptance Scenarios**:

1. **Given** a user views a championship details page, **When** they click the export calendar option, **Then** they see choices to download ICS file or subscribe via calendar URL
2. **Given** a user downloads an ICS file for a championship, **When** they import it into their calendar application, **Then** all scheduled events appear with event name, date, time, track, and championship name
3. **Given** a user subscribes to a championship calendar via URL, **When** events are rescheduled or cancelled in the system, **Then** their calendar automatically reflects these changes within 24 hours
4. **Given** a championship has multiple race sessions per event, **When** a user exports the calendar, **Then** each session appears as a separate calendar entry with appropriate timing
5. **Given** a user wants Google Calendar integration, **When** they select "Add to Google Calendar", **Then** they are redirected to Google Calendar with the championship schedule pre-populated for confirmation
6. **Given** an exported ICS file includes event details, **When** a user views an event in their calendar, **Then** they see track name, race length, allowed cars, and a link back to the championship page
7. **Given** a user has subscribed to multiple championship calendars, **When** they view their calendar, **Then** each championship's events are distinguished by color or calendar name
8. **Given** a cancelled event, **When** a user's calendar syncs, **Then** the cancelled event is marked as cancelled or removed from future dates while preserving past occurrences for reference

---

### Edge Cases

- What happens when an organizer tries to create an event with a track not available in the selected simulator?
- How does the system handle adding cars to a championship that become unavailable in the simulator?
- What happens when an event's race length is set to zero laps or zero time?
- How are points calculated when fewer drivers participate than there are positions in the points scheme?
- What happens to championship standings when event results are modified after publication?
- How does the system handle events scheduled for the same date/time in the same championship?
- What happens when an organizer tries to delete a championship that has completed events with results?
- How are ties in championship standings resolved when drivers have equal points?
- What happens when a points scheme is modified mid-season?
- How does the system handle multiple race sessions awarding points in the same event?
- What happens to event data when a simulator updates its track or car list?
- How are drop scores or bonus points handled in the points scheme?
- What happens when a URL import fails partway through parsing (e.g., network timeout, incomplete data)?
- How does the system handle URLs that change format or structure between imports?
- What happens when an imported track name doesn't match any tracks in the selected simulator?
- How does the system handle duplicate championship imports from the same URL?
- What happens if the external website's structure changes and parsing breaks?
- How are race length details (laps vs time) determined when importing from external sources?
- What happens when an event is cancelled after some drivers have already prepared or qualified?
- How does the system handle rescheduling an event to a date that conflicts with another championship's event?
- What happens to results that were entered but not published when an event is cancelled?
- Can a reinstated event retain its previous registration list or must drivers re-register?
- How are participants notified when events are cancelled or rescheduled (email, in-app notifications)?
- What happens when an admin tries to reschedule an event to a date in the past?
- How does the system handle mass cancellations (e.g., remainder of season cancelled)?
- What happens to a cancelled event's position in the championship calendar (gaps vs renumbering)?
- How does the system handle timezone differences when exporting events to ICS files?
- What happens if a user's calendar application doesn't support recurring event updates from subscribed calendars?
- How are calendar subscription URLs secured to prevent unauthorized access?
- What happens when a championship is deleted but users still have active calendar subscriptions?
- How does the system handle very large championships (100+ events) in calendar exports?
- What happens if the Google Calendar API is unavailable during export?
- How are event reminders configured in exported calendars (default times or user-configurable)?
- What happens to calendar subscriptions when events are added to a championship mid-season?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow organizers to create a new championship with name, description, and season dates
- **FR-002**: System MUST allow organizers to select a simulator for the championship from available options
- **FR-003**: System MUST allow organizers to assign a points scheme to a championship
- **FR-004**: System MUST allow organizers to define or reference championship rules and regulations
- **FR-005**: System MUST allow organizers to specify which cars are allowed in a championship
- **FR-006**: System MUST allow organizers to create events within a championship
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
- **FR-021**: System MUST calculate championship standings based on event results and the championship points scheme
- **FR-022**: System MUST display drivers ranked by total points in championship standings
- **FR-023**: System MUST show event-by-event points breakdown for each driver
- **FR-024**: System MUST update standings automatically when new event results are published
- **FR-025**: System MUST display championships with name, simulator, status, and season dates
- **FR-026**: System MUST allow users to browse and filter championships by simulator and status
- **FR-027**: System MUST allow users to search for championships by name
- **FR-028**: System MUST allow drivers to register for a championship
- **FR-029**: System MUST automatically enter registered drivers in all events within their registered championship
- **FR-030**: System MUST automatically enter drivers in new events added after their championship registration
- **FR-031**: System MUST allow organizers to set maximum participant limits for championship registration
- **FR-032**: System MUST prevent new registrations once championship participant limit is reached
- **FR-033**: System MUST allow organizers to view all registered participants for their championship
- **FR-034**: System MUST allow registered drivers to withdraw from a championship with restrictions if events have occurred
- **FR-035**: System MUST validate that selected tracks and cars are available in the chosen simulator
- **FR-036**: System MUST prevent deletion of championships with historical event data
- **FR-037**: System MUST resolve tied championship standings using countback to best finishes (most wins, then most 2nd places, then most 3rd places, etc.)
- **FR-038**: System MUST recalculate all championship standings when a points scheme is modified, affecting all events retroactively
- **FR-039**: System MUST organize events chronologically within a championship calendar
- **FR-040**: System MUST allow organizers to import championship data from external URLs
- **FR-041**: System MUST parse external URLs to extract championship metadata (name, season dates) and event details (dates, track names)
- **FR-042**: System MUST display a preview of parsed championship data before creation, allowing organizers to review extracted information
- **FR-043**: System MUST create championships in draft status when imported from URLs, requiring organizer configuration before activation
- **FR-044**: System MUST allow organizers to map imported track names to tracks available in the selected simulator
- **FR-045**: System MUST handle parsing failures gracefully, providing clear error messages when URL import fails
- **FR-046**: System MUST allow organizers to edit all imported championship details (events, dates, tracks, settings) after import
- **FR-047**: System MUST allow admins and organizers to cancel scheduled events that have not yet occurred
- **FR-048**: System MUST allow admins and organizers to reschedule events to new dates and times
- **FR-049**: System MUST prevent cancellation of events that have published results
- **FR-050**: System MUST change cancelled event status to cancelled while preserving event data in championship history
- **FR-051**: System MUST exclude cancelled events from championship standings calculations
- **FR-052**: System MUST check for scheduling conflicts when rescheduling events and warn organizers
- **FR-053**: System MUST notify all registered participants when events are cancelled or rescheduled
- **FR-054**: System MUST allow admins to provide a cancellation reason that is visible to participants
- **FR-055**: System MUST allow admins to reinstate cancelled events, restoring them to scheduled status
- **FR-056**: System MUST display rescheduled events with both new date and original date for participant reference
- **FR-057**: System MUST maintain driver registrations when events are rescheduled
- **FR-058**: System MUST prevent rescheduling events to dates in the past
- **FR-059**: System MUST generate ICS (iCalendar) files containing all championship events
- **FR-060**: System MUST provide a subscribable calendar URL for each championship that supports automatic updates
- **FR-061**: System MUST include event details in calendar entries (event name, track, date, time, race length, championship name)
- **FR-062**: System MUST export each race session as a separate calendar entry when events have multiple sessions
- **FR-063**: System MUST update subscribed calendars when events are rescheduled, cancelled, or added
- **FR-064**: System MUST support "Add to Google Calendar" functionality with direct integration
- **FR-065**: System MUST include links to championship pages in exported calendar event descriptions
- **FR-066**: System MUST handle timezone conversions appropriately in ICS files based on event location or user preferences
- **FR-067**: System MUST mark cancelled events appropriately in calendar exports
- **FR-068**: System MUST secure calendar subscription URLs to prevent unauthorized access while allowing legitimate calendar applications to access them
- **FR-069**: System MUST handle calendar subscription requests for deleted championships gracefully with appropriate error messages

### Key Entities

- **Championship**: A complete racing championship. Key attributes include: unique identifier, name, description, simulator (e.g., iRacing, Assetto Corsa Competizione), season start date, season end date, status (upcoming, active, completed), points scheme identifier, championship rules text/document, allowed cars list, maximum participants (optional limit), current participant count, created by (organizer), creation date. Relationships: Contains multiple events; uses one points scheme; has multiple championship registrations; may have championship-specific organizer permissions

- **Championship Registration**: Links a driver to a championship for the full season. Key attributes include: unique identifier, championship identifier, driver (user identifier), registration date, status (active, withdrawn), withdrawal date (if applicable), withdrawal reason (optional). Relationships: Links one driver to one championship; creates automatic event entries for all championship events

- **Event**: A racing event within a championship, occurring at a specific track on a specific date. Key attributes include: unique identifier, championship identifier, event name, track (from simulator's track list), event date and time, race length value, race length unit (laps or time), status (scheduled, in-progress, completed, cancelled), created by (organizer), creation date, original event date (for rescheduled events), cancellation reason (if cancelled), cancellation date (if cancelled), cancelled by (admin/organizer identifier), rescheduled date history (list of previous dates if rescheduled multiple times). Relationships: Belongs to one championship; contains one or more race sessions; has entries from all registered championship participants; generates results contributing to championship standings (excluded if cancelled)

- **Race Session**: An individual racing session within an event. Key attributes include: unique identifier, event identifier, session name, session type (practice, qualifying, sprint race, feature race), session order (1st, 2nd, 3rd), duration value, duration unit (laps or time), points allocation (full, partial, none), scheduled start time. Relationships: Belongs to one event; has race results entered by organizers

- **Event Results**: Race results for participants in a session or event. Key attributes include: unique identifier, event identifier (or session identifier), driver (user identifier), finishing position, original position (before penalties), penalties applied (description and type), penalty time/positions, status (DNF, DNS, classified), points awarded, result status (draft, published), published date, entered by (organizer), last modified date, modification history. Relationships: Links to one event and one driver; used to calculate standings

- **Points Scheme**: Defines how championship points are awarded. Key attributes include: unique identifier, scheme name, description, position-to-points mapping (1st place: X points, 2nd place: Y points, etc.), bonus points rules (fastest lap, pole position - optional), drop scores rule (drop worst N results - optional), created by (organizer). Relationships: Can be used by multiple championships; defines points calculation

- **Championship Standings**: Championship leaderboard showing driver rankings. Key attributes include: championship identifier, driver identifier, total points, events participated, best finish, most recent finish, position in standings, points breakdown by event. Relationships: Links to one championship; calculated from event results and points scheme; updates when results are finalized

- **Allowed Cars**: List of cars permitted for competition in a championship. Key attributes include: championship identifier, car identifier (from simulator), car name, car class/category. Relationships: Links to one championship; restricts what participants can use in events

- **Championship Import**: Temporary entity representing parsed data from external URL. Key attributes include: unique identifier, source URL, parsed championship name, parsed season dates, list of parsed events (with dates and track names), import status (parsing, ready for review, imported, failed), created by (organizer), created timestamp, error messages (if parsing failed). Relationships: Becomes a Championship entity upon organizer approval; deleted after successful import or rejection

- **Calendar Subscription**: Tracks users who have subscribed to championship calendar feeds. Key attributes include: unique identifier, championship identifier, subscription URL (unique per championship), access token (for security), subscription format (ICS/webcal), created timestamp, last accessed timestamp, access count. Relationships: Links to one championship; provides feed of all championship events; auto-updates when schedule changes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Organizers can create a fully configured championship in under 5 minutes
- **SC-002**: Organizers can create and schedule an event with all required details in under 2 minutes
- **SC-003**: Championship standings update automatically within 30 seconds of event results being finalized
- **SC-004**: Users can browse and find relevant championships within 3 clicks from the championship list
- **SC-005**: 95% of organizers successfully create their first championship without errors or confusion
- **SC-006**: System accurately calculates standings for championships with 50+ events and 100+ participants
- **SC-007**: Points calculations are correct 100% of the time according to the selected points scheme
- **SC-008**: Event calendars display clearly with no scheduling conflicts or overlaps within a championship
- **SC-009**: Users can view complete championship information (events, standings, rules) within 2 seconds
- **SC-010**: Zero incidents of points calculation errors or standing ranking mistakes
- **SC-011**: Organizers can import and configure a championship with 20+ events from external URL in under 10 minutes (compared to 30+ minutes manual entry)
- **SC-012**: URL import successfully parses championship data from supported sources 90% of the time on first attempt
- **SC-013**: Admins can cancel or reschedule an event in under 2 minutes
- **SC-014**: All registered participants receive notifications within 5 minutes of event cancellation or rescheduling
- **SC-015**: Cancelled events are correctly excluded from standings calculations 100% of the time
- **SC-016**: Users can export a championship calendar in under 30 seconds
- **SC-017**: Calendar subscriptions reflect schedule changes (reschedules, cancellations, new events) within 24 hours
- **SC-018**: Exported ICS files are compatible with 95% of popular calendar applications (Google Calendar, Outlook, Apple Calendar, etc.)
- **SC-019**: Google Calendar integration completes successfully 98% of the time when API is available

## Assumptions *(if applicable)*

This section documents assumptions and decisions made while creating this specification:

1. **Simulator Options**: Assumed the system supports multiple racing simulators (iRacing, Assetto Corsa Competizione, rFactor 2, etc.) as selectable options. Each simulator provides its own track and car lists.

2. **Track and Car Data**: Assumed track and car lists are maintained per simulator and available for selection when creating events. The system validates selections against the chosen simulator's available content.

3. **Race Length Flexibility**: Assumed races can be configured either by lap count (e.g., 30 laps) or time duration (e.g., 60 minutes) to accommodate different racing formats. Both units are supported independently.

4. **Points Scheme Flexibility**: Assumed organizers can create custom points schemes or use standard schemes (F1-style, MotoGP-style, etc.). Points are assigned by finishing position with optional bonus points.

5. **Championship Status**: Championships have lifecycle statuses: upcoming (not started), active (in-season), completed (season ended). Status affects visibility and editing permissions.

6. **Event Scheduling**: Assumed events are scheduled with specific date and time. The system allows multiple events but should warn about potential scheduling conflicts.

7. **Multi-Session Events**: Events can have multiple race sessions (qualifying + race, or sprint + feature race, etc.). Each session can be configured independently and may or may not award points.

8. **Standings Calculation**: Championship standings are automatically calculated by summing points from all completed events. Assumed real-time or near-real-time updates when results are finalized.

9. **Historical Data Preservation**: Completed championships with results should not be deletable to preserve championship history. Edit restrictions apply to completed championships.

10. **Organizer Permissions**: Assumed championship creators (organizers) have full edit permissions for their championships. Admin users can manage all championships. Based on the admin-user spec, championship-specific permissions may allow other users to help manage specific championships.

11. **Tie Breaking**: Ties in championship standings are resolved using countback to best finishes. When drivers have equal points, the driver with more wins ranks higher. If still tied, compare 2nd place finishes, then 3rd place finishes, and so on. This provides a fair and objective tie-breaking mechanism common in racing championships.

12. **Points Scheme Changes**: When a points scheme is modified, all championship standings are recalculated retroactively to reflect the new scheme across all events. This ensures consistency in how points are awarded throughout the championship, though organizers should be warned about the impact of mid-season changes on existing standings.

13. **Default Points Scheme**: Assumed a standard F1-style points scheme (25-18-15-12-10-8-6-4-2-1 for top 10) is available as a default option to simplify initial championship creation.

14. **Championship Duration**: Assumed championships can span multiple months or a full season. No hard limits on number of events per championship, but practical limits depend on scheduling.

15. **URL Import Sources**: Assumed URL import initially supports common racing series websites (Formula 1, MotoGP, IndyCar, etc.) with publicly accessible schedule pages. Each source may require specific parsing logic based on page structure. The system should be extensible to add support for additional sources.

16. **Import Data Completeness**: URL parsing extracts available data (championship name, season, event dates, track/location names) but cannot extract simulator-specific details (car lists, track mappings, race lengths). Organizers must configure these details after import.

17. **Import Status Workflow**: Imported championships start in draft status, requiring organizer review and configuration (simulator selection, track mapping, car selection, points scheme) before becoming active and available for registration.

18. **Track Name Mapping**: Track names from external sources rarely match simulator track names exactly. The system should provide fuzzy matching suggestions or manual mapping interface to help organizers match imported tracks to simulator tracks.

19. **Event Cancellation Permissions**: Both admins and championship organizers (creators) can cancel or reschedule events. Regular users cannot modify event schedules, even if registered for the championship.

20. **Cancellation Restrictions**: Events can only be cancelled if they haven't occurred yet and don't have published results. Once results are published, the event is part of championship history and cannot be cancelled (only corrections via the results audit trail are permitted).

21. **Participant Notifications**: The system sends notifications to all registered participants when events are cancelled or rescheduled. Notification delivery is assumed (email, in-app, or both) but the specific mechanism is implementation-dependent.

22. **Cancelled Event Visibility**: Cancelled events remain visible in championship history and calendar (marked as cancelled) for transparency and record-keeping. They don't count toward standings but participants can see what was planned.

23. **Rescheduling Limitations**: Events can be rescheduled multiple times if needed, but the system tracks the history of date changes for transparency. Rescheduling to past dates is prevented to avoid confusion.

24. **Reinstatement Process**: Cancelled events can be reinstated by admins/organizers, returning them to scheduled status. This allows for reversing premature cancellations if circumstances change.

25. **Calendar Export Formats**: The system supports standard ICS (iCalendar) format for maximum compatibility with calendar applications. Subscription URLs use the webcal protocol or HTTPS for secure calendar feeds.

26. **Calendar Sync Frequency**: Subscribed calendars sync at intervals determined by the user's calendar application (typically 12-24 hours). The system provides an always-current feed, but actual update timing depends on the calendar client.

27. **Google Calendar Integration**: Direct "Add to Google Calendar" integration uses Google Calendar API or URL schemes. This requires users to have Google accounts and grant appropriate permissions.

28. **Calendar Event Details**: Exported events include comprehensive details (championship name, event name, track, race length, session types) in both the event title and description fields for maximum visibility across different calendar applications.

29. **Timezone Handling**: Event times in ICS files are exported with timezone information (typically UTC or event-specific timezone). Calendar applications handle conversion to user's local timezone automatically.

30. **Calendar Security**: Subscription URLs include unique access tokens to prevent unauthorized access while remaining accessible to legitimate calendar applications. Public championships may offer public calendar feeds, while private championships require authentication.

31. **Deleted Championships**: When championships are deleted, calendar subscription URLs return appropriate HTTP status codes (410 Gone) to inform calendar applications. Users should manually remove these subscriptions from their calendars.

32. **Multi-Session Events**: Each race session (practice, qualifying, race) within an event can be exported as a separate calendar entry with appropriate start times and durations, or combined into a single multi-hour event block depending on user preference.
