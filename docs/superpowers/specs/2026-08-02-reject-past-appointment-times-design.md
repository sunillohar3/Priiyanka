# Reject Past Dates/Times on Booking and Reschedule

**Date:** 2026-08-02
**Scope:** Prevent booking or rescheduling an appointment into the past.
**Status:** Approved design.

## Goal

Neither the backend nor the client's button-click handlers currently reject
a booking or reschedule dated in the past. The date `<input>`'s `min`
attribute is cosmetic here — `Confirm Appointment`/`Save` are plain button
`onClick` handlers, not native form submissions, so HTML5 constraint
validation never runs. Concretely: opening "Reschedule" on an old
appointment pre-fills the dialog with its original (possibly past) date,
and clicking Save with no changes currently succeeds, silently resetting
the appointment to `status: "pending"` with the same stale date.

Add real validation — server-side authoritative, client-side best-effort —
so a booking or reschedule must be for a date/time that hasn't already
passed, evaluated in the business's own timezone (Netherlands).

## Constraints (hard)

- **Date-and-time-of-day check, not date-only.** A same-day booking must
  also be rejected if the specific time has already passed today (e.g. it's
  15:00 and someone requests 13:00 today).
- **Authoritative clock is Europe/Amsterdam**, not server UTC or the
  client's browser timezone — the business and its working hours are
  defined in Netherlands local time.
- **Applies to both new bookings and reschedules** (`POST /api/appointments`
  and `PUT /api/appointments/{id}/reschedule`), via one shared backend
  check — not duplicated per endpoint.
- **No change to admin blocked-slot creation** — admins may still record a
  block for any date; this constraint is scoped to client bookings only.
- **Backend is authoritative; frontend is a fast best-effort pre-check**
  using the browser's own clock. It does not need to be timezone-exact —
  a mismatched client just falls through to the backend's error response,
  same as any other validation failure today.

## Design

### 1. Backend — `_past_problem` (`backend/server.py`)

Add near `_hours_problem` (`:820`):

```python
from zoneinfo import ZoneInfo

AMSTERDAM_TZ = ZoneInfo("Europe/Amsterdam")


def _past_problem(date_str: str, time_str: str, now: datetime = None):
    """Pure check that the requested date/time hasn't already passed,
    evaluated in the business's own timezone. Assumes date_str/time_str are
    already well-formed (checked by _hours_problem, called first in
    _slot_conflict). `now` can be injected for testing; defaults to the
    real current time."""
    minutes = _time_to_minutes(time_str)
    requested_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    requested = datetime(
        requested_date.year, requested_date.month, requested_date.day,
        minutes // 60, minutes % 60, tzinfo=AMSTERDAM_TZ
    )
    current = now or datetime.now(AMSTERDAM_TZ)
    if requested < current:
        return "Please choose a date and time in the future."
    return None
```

`ZoneInfo("Europe/Amsterdam")` works via the `tzdata` package, already a
pinned dependency (`backend/requirements.txt`), so this needs no new
dependency.

### 2. Wiring into `_slot_conflict` (`backend/server.py:840`)

Call `_past_problem` immediately after the existing `_hours_problem` check,
so it can assume valid, parseable input:

```python
async def _slot_conflict(date_str, time_str, duration, location_id, exclude_id=None):
    problem = _hours_problem(date_str, time_str, duration)
    if problem:
        return problem
    problem = _past_problem(date_str, time_str)
    if problem:
        return problem
    ...
```

Because both `create_appointment` (`:884`) and `reschedule_appointment`
(`:995`) already funnel through `_slot_conflict`, this is the only backend
change needed — neither endpoint's own code changes.

### 3. Frontend — best-effort pre-check

**`frontend/src/pages/Cart.js`**, in `handleConfirm` (`:40`), right after
the existing `if (!date || !time || !location)` check:

```javascript
if (new Date(`${date}T${time}`) < new Date()) {
  toast.error(language === 'en' ? 'Please choose a date and time in the future.' : 'Kies een datum en tijd in de toekomst.');
  return;
}
```

**`frontend/src/pages/Dashboard.js`**, in `submitReschedule` (`:88`), right
after the existing `if (!rDate || !rTime || !rLocation)` check:

```javascript
if (new Date(`${rDate}T${rTime}`) < new Date()) {
  toast.error(language === 'en' ? 'Please choose a date and time in the future.' : 'Kies een datum en tijd in de toekomst.');
  return;
}
```

Both follow the existing inline ternary i18n pattern already used for the
adjacent validation message in each file — no new translation-namespace
entries needed.

### 4. Testing

`_past_problem` is unit-testable exactly like `_hours_problem`, using the
injectable `now` parameter:
- A clearly-past fixed date (e.g. `"2020-01-01"`) is always rejected,
  regardless of when the test runs.
- A fixed `now` plus a same-day time before it is rejected; a same-day time
  after it is accepted.
- A far-future fixed date (e.g. `"2099-01-01"`) is always accepted.

These land in `backend/tests/test_logic.py` alongside the existing
`_hours_problem` tests. No DB-backed testing is needed since the change is
fully contained in a pure function plus its wiring into an already-tested
gate (`_slot_conflict`); the create/reschedule endpoint integration is
covered the same way prior location-scoping work was — manual curl
verification against a locally running instance.

## Out of scope

- Hiding/disabling the Reschedule button on already-past appointments —
  the button stays; only the actual save is blocked until a valid
  future date/time is chosen.
- Rejecting past dates on admin blocked-slot creation.
- Precise timezone-awareness on the frontend pre-check (kept simple,
  browser-local; backend is the real gate).
