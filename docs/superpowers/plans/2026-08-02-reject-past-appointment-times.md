# Reject Past Dates/Times on Booking and Reschedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject booking or rescheduling an appointment into the past — including a same-day time slot that has already gone by — with the backend as the authoritative check and the frontend as a fast best-effort pre-check.

**Architecture:** One new pure-ish backend function, `_past_problem`, evaluated in `Europe/Amsterdam` local time (the business's own timezone, not server UTC or the client's browser timezone), wired into the existing `_slot_conflict` gate so both `POST /api/appointments` and `PUT /api/appointments/{id}/reschedule` get it automatically with no per-endpoint duplication. The frontend adds a matching browser-clock pre-check in `Cart.js` and `Dashboard.js` for immediate feedback; the backend check is what actually enforces correctness.

**Tech Stack:** FastAPI + Motor (async MongoDB) backend in `backend/server.py`; React frontend (`Cart.js`, `Dashboard.js`); Python's stdlib `zoneinfo` (backed by the already-pinned `tzdata` package — no new dependency).

## Global Constraints

- The check is date-AND-time-of-day — a same-day booking must be rejected if the requested time has already passed today, not just if the date itself is in the past.
- The authoritative clock is `Europe/Amsterdam` local time, not server UTC and not the client's browser timezone.
- Applies to both new bookings (`POST /api/appointments`) and reschedules (`PUT /api/appointments/{id}/reschedule`) via one shared backend check — not duplicated per endpoint.
- Does NOT apply to admin blocked-slot creation (`POST /api/admin/blocked-slots`) — out of scope.
- Backend is authoritative; the frontend pre-check may use the browser's own (non-Amsterdam) clock — it's a UX nicety, not the real gate.
- No new translation-namespace entries — new validation messages follow each file's existing inline `language === 'en' ? ... : ...` ternary pattern.

---

### Task 1: Backend — `_past_problem` and `_slot_conflict` wiring

**Files:**
- Modify: `backend/server.py:1-22` (add `zoneinfo` import), `backend/server.py:820` (add `_past_problem` after `_hours_problem`), `backend/server.py:840-846` (wire into `_slot_conflict`)
- Test: `backend/tests/test_logic.py`

**Interfaces:**
- Produces: `_past_problem(date_str: str, time_str: str, now: datetime = None) -> Optional[str]` — pure function; returns an error message string if the requested date/time has already passed (in `Europe/Amsterdam` time), else `None`. Assumes `date_str`/`time_str` are already well-formed (caller must run `_hours_problem` first). The optional `now` parameter lets tests inject a fixed instant instead of the real clock.
- Consumes: `_time_to_minutes` (existing helper, already used by `_hours_problem`).

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_logic.py`, after the existing `test_hours_closed_and_out_of_range` test:

```python
from datetime import datetime as _dt


def test_past_problem_rejects_clearly_past_date():
    assert server._past_problem("2020-01-01", "14:00") is not None


def test_past_problem_rejects_past_time_today():
    now = _dt(2026, 1, 5, 15, 0, tzinfo=server.AMSTERDAM_TZ)  # Monday 15:00
    assert server._past_problem("2026-01-05", "14:00", now=now) is not None


def test_past_problem_allows_future_time_today():
    now = _dt(2026, 1, 5, 10, 0, tzinfo=server.AMSTERDAM_TZ)  # Monday 10:00
    assert server._past_problem("2026-01-05", "14:00", now=now) is None


def test_past_problem_allows_far_future_date():
    assert server._past_problem("2099-01-01", "14:00") is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./.venv/Scripts/python -m pytest tests/test_logic.py -v -k past_problem`
Expected: FAIL with `AttributeError: module 'server' has no attribute '_past_problem'` (and no `AMSTERDAM_TZ` attribute either).

- [ ] **Step 3: Add the `zoneinfo` import**

In `backend/server.py`, add to the import block (near the other `datetime` import, `:20`):

```python
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
```

- [ ] **Step 4: Add `AMSTERDAM_TZ` and `_past_problem`**

In `backend/server.py`, immediately after `_hours_problem` (`:820-837`), add:

```python
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

- [ ] **Step 5: Wire it into `_slot_conflict`**

In `backend/server.py`, update `_slot_conflict` (`:840-846`):

```python
async def _slot_conflict(date_str: str, time_str: str, duration: int, location_id: str, exclude_id: str = None):
    """Return an error message if the requested visit is outside working hours,
    already in the past, inside a blocked slot at this location, or overlaps
    another appointment at this location; else None. Locations are checked
    independently of each other."""
    problem = _hours_problem(date_str, time_str, duration)
    if problem:
        return problem

    problem = _past_problem(date_str, time_str)
    if problem:
        return problem

    start = _time_to_minutes(time_str)
    end = start + duration
```

(The rest of `_slot_conflict` — the blocked-slots query and the overlap query — is unchanged.)

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && ./.venv/Scripts/python -m pytest tests/test_logic.py -v`
Expected: all tests PASS, including the four new `test_past_problem_*` tests, pristine output.

- [ ] **Step 7: Manually verify end-to-end via a locally running instance**

A local MongoDB is available at `127.0.0.1:27017` (Windows service). From `backend/`:

```bash
MONGO_URL=mongodb://localhost:27017 DB_NAME=priiyanka_task1_manual_test ./.venv/Scripts/python -m uvicorn server:app --port 8012 &
```

Register + log in to get a session token (login's JSON response includes `"session_token"` directly):

```bash
curl -s -X POST http://localhost:8012/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"pasttest@example.com","password":"testpass123","name":"Past Test"}'
curl -s -X POST http://localhost:8012/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"pasttest@example.com","password":"testpass123"}'
# copy the "session_token" value as $SESSION below
```

Try booking a clearly-past date — must be rejected with a 409 and the new message:

```bash
curl -s -X POST http://localhost:8012/api/appointments -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2020-01-01","booking_time":"14:00","location_id":"voorburg"}'
# Expect: 409 "Please choose a date and time in the future."
```

Try booking a far-future valid slot — must still succeed as before (regression check that the new gate doesn't reject legitimate future bookings):

```bash
curl -s -X POST http://localhost:8012/api/appointments -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2099-01-05","booking_time":"14:00","location_id":"voorburg"}'
# Expect: 200, appointment created (2099-01-05 is a Monday, 14:00 is within Mon-Fri 13:00-18:00 hours)
```

Clean up: stop the uvicorn process and drop the scratch database:

```bash
./.venv/Scripts/python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    await client.drop_database('priiyanka_task1_manual_test')
asyncio.run(main())
"
```

- [ ] **Step 8: Commit**

```bash
git add backend/server.py backend/tests/test_logic.py
git commit -m "feat(backend): reject booking/reschedule dates and times already in the past"
```

---

### Task 2: Frontend — best-effort pre-checks in `Cart.js` and `Dashboard.js`

**Files:**
- Modify: `frontend/src/pages/Cart.js:40-48` (`handleConfirm`)
- Modify: `frontend/src/pages/Dashboard.js:88-92` (`submitReschedule`)

**Interfaces:**
- Consumes: nothing new — uses the browser's built-in `Date` object only.
- Produces: nothing consumed by later tasks (this is the final task before the regression pass).

- [ ] **Step 1: Add the pre-check to `Cart.js`**

In `frontend/src/pages/Cart.js`, update `handleConfirm` (`:40-48`):

```javascript
  const handleConfirm = async () => {
    if (!user) {
      toast.error(language === 'en' ? 'Please login to book an appointment' : 'Log in om een afspraak te maken');
      return;
    }
    if (!date || !time || !location) {
      toast.error(language === 'en' ? 'Please select a location, date and time' : 'Selecteer een locatie, datum en tijd');
      return;
    }
    if (new Date(`${date}T${time}`) < new Date()) {
      toast.error(language === 'en' ? 'Please choose a date and time in the future.' : 'Kies een datum en tijd in de toekomst.');
      return;
    }
```

- [ ] **Step 2: Add the pre-check to `Dashboard.js`**

In `frontend/src/pages/Dashboard.js`, update `submitReschedule` (`:88-92`):

```javascript
  const submitReschedule = async (id) => {
    if (!rDate || !rTime || !rLocation) {
      toast.error(language === 'en' ? 'Please choose a location, date and time.' : 'Kies een locatie, datum en tijd.');
      return;
    }
    if (new Date(`${rDate}T${rTime}`) < new Date()) {
      toast.error(language === 'en' ? 'Please choose a date and time in the future.' : 'Kies een datum en tijd in de toekomst.');
      return;
    }
```

- [ ] **Step 3: Manually verify in a browser**

With the backend from Task 1's Step 7 available again (re-run the same `MONGO_URL=... DB_NAME=... uvicorn` command on a fresh scratch DB, and `yarn start` or `npm start` in `frontend/` pointed at it via `REACT_APP_BACKEND_URL`), or simply by reading the code path: confirm that on the Cart page, manually setting the date input to a past date via devtools (or by having the browser clock artificially advance past a chosen time) and clicking "Confirm Appointment" shows the new toast and does not navigate to `/dashboard`. Same check for the Dashboard reschedule dialog's "Save" button. This is a lightweight manual check since Playwright's fake system clock isn't part of this repo's existing E2E patterns and the backend check (Task 1) is what actually guarantees correctness — a full E2E test isn't required for this best-effort UI layer, but reading the two diffs against `handleConfirm`/`submitReschedule`'s existing structure is sufficient to confirm the guard clause is correctly placed before the network call in both cases.

- [ ] **Step 4: Run the existing Cart/Dashboard E2E suites as a regression check**

Run: `cd frontend && npx playwright test cart.spec.js dashboard.spec.js`
Expected: all tests still PASS — none of the existing fixtures use a past date/time, so the new guard clause doesn't reject anything the existing tests rely on. (`cart.spec.js` uses `2030-01-01`/`10:00`; `dashboard.spec.js`'s `APPOINTMENTS` fixture uses `2030-01-02`/`10:00` and its reschedule test sets `2030-02-02`/`11:00` — all safely in the future.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Cart.js frontend/src/pages/Dashboard.js
git commit -m "feat(cart,dashboard): block booking/reschedule submission for past dates and times"
```

---

### Task 3: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && ./.venv/Scripts/python -m pytest -v`
Expected: all tests PASS (including the four new `_past_problem` tests from Task 1).

- [ ] **Step 2: Run the full frontend E2E suite**

Run: `cd frontend && npx playwright test`
Expected: all tests PASS (matching the existing baseline of 187 passed / 2 pre-existing skips — no new failures).

- [ ] **Step 3: Manual smoke test in a browser**

Using the same local-Mongo + scratch-DB setup as Task 1's Step 7 and a `yarn start`/`npm start` frontend pointed at it:
1. Log in as a client, add a service to the cart, go to `/cart`. Pick a location, then use the browser's date/time inputs to select today's date and a time earlier than the current time (if working hours allow, otherwise pick yesterday). Click "Confirm Appointment" — expect the new "choose a date and time in the future" toast and no navigation.
2. Pick a valid future date/time instead and confirm — expect the normal success flow (navigates to `/dashboard`), unaffected by this change.
3. On the Dashboard, click "Reschedule" on that appointment, and try saving with a past date entered directly into the date field (bypassing the calendar picker's `min` restriction by typing) — expect the same toast and no request sent.
4. Save with a valid future date instead — expect the normal "Appointment rescheduled" success flow.

No commit for this task — it's verification only.
