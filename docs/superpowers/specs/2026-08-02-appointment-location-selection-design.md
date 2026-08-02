# Appointment Location Selection

**Date:** 2026-08-02
**Scope:** Add a location choice (Voorburg / The Hague Centre) to the booking and reschedule flow.
**Status:** Approved design.

## Goal

The practitioner works from two physical locations. Today `Appointment` and
`BlockedSlot` have no concept of location at all — booking is a single global
schedule (`WORKING_HOURS` in `backend/server.py:114`). Add a location field
throughout the booking flow so clients pick where their appointment happens,
and the two locations' schedules are checked independently.

## Constraints (hard)

- **No admin CRUD for locations.** Exactly two locations, hardcoded as a
  backend constant. Adding a third location later is a code change, not a
  data change — acceptable since there is no near-term plan for more.
- **No cross-location conflict checking.** The same date/time slot can be
  booked at both locations simultaneously. This was an explicit choice:
  the business already manages which days the practitioner is at which
  location; the system does not need to enforce it.
- **Working hours stay global.** Both locations share `WORKING_HOURS`;
  only blocked-slots and appointment overlap are location-scoped.
- **No backend framework/route restructuring.** Keep the existing
  single-file `backend/server.py` pattern; add fields and params, don't
  refactor.

## In scope

- Backend: `LOCATIONS` constant, `GET /api/locations`, `location_id` on
  `Appointment`/`AppointmentCreate`/`BlockedSlot`/`BlockedSlotCreate`/
  `RescheduleRequest`, location-scoped `_slot_conflict`.
- Frontend: location picker in `Cart.js` (booking), `Dashboard.js`
  (reschedule dialog + appointment card display), `Admin.js` (appointments
  list display + blocked-slot form and list).

## Design

### 1. Location constant + endpoint (`backend/server.py`)

```python
LOCATIONS = [
    {"location_id": "voorburg", "name": "Voorburg"},
    {"location_id": "the_hague_centre", "name": "The Hague Centre"},
]
```

Placed near `WORKING_HOURS` (`:114`). A helper `_is_valid_location(location_id)`
checks membership. New public endpoint:

```python
@api_router.get("/locations")
async def get_locations():
    return LOCATIONS
```

No auth required — same visibility as public service listings. This is the
single source of truth; the frontend fetches it rather than duplicating the
list.

### 2. Data model changes (`backend/server.py`)

- `Appointment` (`:324`) and `AppointmentCreate` (`:337`): add
  `location_id: str`.
- `BlockedSlot` (`:357`) and `BlockedSlotCreate` (`:366`): add
  `location_id: str`.
- `RescheduleRequest` (`:343`): add `location_id: str` — reschedule can move
  an appointment to the other location, not just change date/time.

### 3. Conflict checking (`backend/server.py`)

- `_slot_conflict` (`:809`) gains a `location_id` parameter. Its two DB
  queries add `location_id` to their filters:
  - blocked slots: `{"date": date_str, "location_id": location_id}`
  - appointment overlap: `{"booking_date": date_str, "location_id": location_id, "status": {"$ne": "cancelled"}}`
- `_hours_problem` (`:789`) is untouched — working hours stay global.
- `create_appointment` (`:851`): validate `data.location_id` against
  `LOCATIONS` (400 if unknown) before calling `_slot_conflict`.
- `reschedule_appointment` (`:960`): validate `data.location_id`, pass it
  into `_slot_conflict`, and persist it on the appointment doc (so moving
  location on reschedule actually updates the stored location).
- Admin blocked-slot creation endpoint (`:993` area): validate
  `location_id` the same way.

### 4. Booking flow (`frontend/src/pages/Cart.js`)

- On mount, `GET /api/locations` into `locations` state.
- New `location` state (`location_id`), no default — user must choose.
- In the "Choose your slot" block (`:146-181`), add a location `Select`
  (`components/ui/select.jsx`) as a third field alongside date and time.
- Extend the existing required-fields check (`:36`) to include location,
  with translated error text (matching the en/nl pattern already used for
  date/time).
- Include `location_id` in the `POST /api/appointments` payload (`:43-53`).

### 5. Dashboard (`frontend/src/pages/Dashboard.js`)

- Appointment card (`:188`): show the location name next to date/time.
  Resolve `location_id` → display name from the fetched `locations` list
  (fetch it here too, or lift to a shared context — implementation detail
  for the plan).
- Reschedule dialog (`:73-84`): add a location `Select`, pre-filled with
  the appointment's current `location_id`; include it in the
  `PUT /api/appointments/{id}/reschedule` payload.

### 6. Admin (`frontend/src/pages/Admin.js`)

- Appointments tab (`:775`): show the location name next to date/time on
  each row. Display only — no filter/sort by location, not requested.
- Availability tab (`:820-859`): add a required location `Select` to the
  "add blocked slot" form (`:224` submit handler); show the location name
  on each existing blocked-slot row.

### 7. i18n

Location names (Voorburg, The Hague Centre) are proper nouns and are not
translated. Surrounding labels ("Location" / "Locatie") follow the existing
inline `language === 'en' ? ... : ...` pattern used throughout these pages.

### 8. Testing

- `_hours_problem` is unaffected; existing pure unit tests in
  `backend/tests/test_logic.py` stay green as-is.
- `_slot_conflict` becomes DB-dependent on `location_id` filtering. The
  repo has no DB-backed test harness today (only pure-function unit
  tests), so this is verified manually: booking the same date/time at both
  locations succeeds for both; booking the same date/time/location twice
  rejects the second with a 409.
- Manual/UI verification: booking flow requires a location before submit;
  reschedule dialog can move an appointment to the other location; admin
  blocked-slot form requires a location and displays it correctly.

## Out of scope

- Admin CRUD for managing/renaming/adding locations.
- Per-location working hours.
- Cross-location double-booking prevention.
- Filtering/sorting the admin appointments list by location.
