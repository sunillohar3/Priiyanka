# Online/Offline Consultation Type

**Date:** 2026-08-02
**Scope:** Add a Consultation Type (Online / Offline) field to booking, reschedule, and display.
**Status:** Approved design.

## Goal

Clients should be able to indicate whether a booked appointment is an
Online or an Offline (in-person) consultation. This is independent of
which physical location is selected — location stays required and
meaningful even for an Online consultation.

## Constraints (hard)

- **Independent of location.** Consultation type does not imply or
  restrict which location can be chosen, and vice versa. Location remains
  required regardless of consultation type.
- **No conflict between modes.** Two appointments at the exact same
  location/date/time don't conflict with each other if one is Online and
  the other Offline — this mirrors the existing decision that the two
  locations don't conflict with each other either.
- **Legacy-safe conflict checking.** Appointments created before this
  field existed have no `consultation_type` on file. Such a record must
  still be treated as conflicting with any new booking at the same
  location/date/time, regardless of the new booking's mode — we don't get
  to silently ignore old bookings just because they predate this concept.
  (This is the same class of bug the location feature's final review
  caught: a new field must not let old data slip through conflict checks
  or break response serialization.)
- **Blocked slots are mode-agnostic.** Admin's blocked-slot creation is
  NOT changed — a blocked slot (e.g. a holiday) blocks both Online and
  Offline uniformly at that location. No new field on `BlockedSlot`.
- **Reschedule can change consultation type**, same as it can already
  change location.
- **No admin CRUD needed** — exactly two fixed values (`online`, `offline`),
  hardcoded, no name-lookup required (unlike locations, these two words
  are self-explanatory display labels — no `GET /api/...` endpoint needed).

## Design

### 1. Backend validation (`backend/server.py`)

Near `LOCATIONS`/`_is_valid_location` (`:126-136`):

```python
CONSULTATION_TYPES = {"online", "offline"}


def _is_valid_consultation_type(value) -> bool:
    return value in CONSULTATION_TYPES
```

### 2. Data model changes

- `Appointment` (`:344-356`): add `consultation_type: Optional[str] = None`
  — read-lenient, so `GET /api/appointments` never breaks on old records
  (same reasoning already applied to `location_id` on this model).
- `AppointmentCreate` (`:358-363`) and `RescheduleRequest` (`:365-368`):
  add `consultation_type: str` — required, validated via
  `_is_valid_consultation_type` at the same points `_is_valid_location` is
  already checked.
- `BlockedSlot`/`BlockedSlotCreate`: **unchanged.**

### 3. Conflict checking (`_slot_conflict`, `:862-896`)

Add `consultation_type` as a new parameter. The appointment-overlap query
changes from an exact match to a "match this type OR match nothing on
file" filter, so legacy records without the field still conflict:

```python
async def _slot_conflict(date_str, time_str, duration, location_id, consultation_type, exclude_id=None):
    ...
    for a in await db.appointments.find({
        "booking_date": date_str,
        "location_id": location_id,
        "consultation_type": {"$in": [consultation_type, None]},
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(1000):
        ...
```

The blocked-slots query is unchanged (still scoped by `location_id` only —
blocked slots apply to both modes).

`create_appointment` and `reschedule_appointment` each validate
`consultation_type` via `_is_valid_consultation_type` (mirroring the
existing `_is_valid_location` check) before calling `_slot_conflict`, and
persist it on the appointment document / in the reschedule `$set` update.

### 4. Frontend — booking flow (`frontend/src/pages/Cart.js`)

A fourth field, "Consultation Type", added to the "Choose your slot" grid
alongside Location/Date/Time (grid becomes `sm:grid-cols-2 lg:grid-cols-4`
to accommodate it). A plain `<select>` (matching the existing Location
field's styling — this codebase doesn't use the shadcn `Select`
component), with a disabled placeholder option, then "Online" / "Offline".
Required — extends the existing `if (!date || !time || !location)` check.
Included in the `POST /api/appointments` payload as `consultation_type`.

### 5. Frontend — reschedule (`frontend/src/pages/Dashboard.js`)

Same field added to the reschedule dialog, pre-filled from the
appointment's current `consultation_type` in `startReschedule`, validated
and included in the `PUT /api/appointments/{id}/reschedule` payload in
`submitReschedule`.

### 6. Display

- **Dashboard.js** appointment card: show consultation type next to
  location (e.g. "Voorburg · Online"), using the same graceful-fallback
  pattern already used for location name (blank if absent, not
  "undefined").
- **Admin.js** appointments tab: same — shown next to location on each
  row, display-only (no filter/sort by consultation type — not requested).

### 7. Testing

- `_is_valid_consultation_type` is a pure function — trivially unit
  tested (valid values, invalid value, `None`, empty string), same
  pattern as `_is_valid_location`'s test.
- `_slot_conflict`'s new legacy-safe filter is DB-dependent and, per this
  repo's established pattern (no DB test harness), verified manually via
  curl against a locally running instance with a real MongoDB: create a
  legacy-style document with no `consultation_type` field directly via
  the driver, then confirm a new booking at the same
  location/date/time is rejected regardless of which mode it requests.
- E2E fixtures (`frontend/tests/e2e/fixtures.js`) and specs
  (`cart.spec.js`, `dashboard.spec.js`) need updating the same way they
  were for the location feature: a required new field means the existing
  happy-path tests must select a value or they'll fail.

## Out of scope

- Admin CRUD for consultation types.
- Any filter/sort UI by consultation type.
- Changing `BlockedSlot`/`BlockedSlotCreate`.
- Any interaction between consultation type and which locations/working
  hours are available (fully independent, as specified).
