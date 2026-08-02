# Appointment Location Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let clients choose between two physical locations (Voorburg, The Hague Centre) when booking or rescheduling an appointment, with each location's availability checked independently.

**Architecture:** A hardcoded `LOCATIONS` constant in `backend/server.py` is the single source of truth, exposed via a new public `GET /api/locations` endpoint. `location_id` is threaded through the `Appointment`, `BlockedSlot`, and `RescheduleRequest` models, and `_slot_conflict`'s two DB queries (blocked slots, appointment overlap) are scoped by `location_id` so the two locations never conflict with each other. Three frontend pages (`Cart.js`, `Dashboard.js`, `Admin.js`) each fetch the location list independently (matching the codebase's existing per-page data-fetching pattern — there is no shared data layer to hook into) and add a location control alongside their existing date/time fields.

**Tech Stack:** FastAPI + Motor (async MongoDB) backend in a single `backend/server.py`; Create React App frontend with shadcn/ui components, Tailwind, `axios`, Playwright E2E tests with route-stub fixtures (`frontend/tests/e2e/fixtures.js`).

## Global Constraints

- Exactly two hardcoded locations: `voorburg` ("Voorburg") and `the_hague_centre` ("The Hague Centre"). No admin CRUD for locations.
- No cross-location conflict checking — the same date/time can be booked at both locations at once. This is intentional (confirmed with the business owner).
- Working hours (`WORKING_HOURS`) stay global across both locations; only blocked-slots and appointment-overlap checks become location-scoped.
- Reschedule may change an appointment's location (not just date/time).
- No backend test harness exists for DB-dependent behavior (`backend/tests/test_logic.py` only covers pure, DB-free functions) — new DB-dependent logic is verified manually via curl against a locally running instance, consistent with the rest of the codebase's testing approach. New *pure* logic gets a real pytest test.
- Location names are proper nouns and are not translated between English/Dutch; surrounding labels follow the existing inline `language === 'en' ? ... : ...` ternary pattern (no i18n library — see `frontend/src/contexts/LanguageContext.js`'s `t()` for the one exception, the `booking.*` namespace, which this plan also extends).

---

### Task 1: Backend — location catalog

**Files:**
- Modify: `backend/server.py:114-123` (add constant after `WORKING_HOURS`), and add a new endpoint near `backend/server.py:693-702` (the `GET /services` pattern).
- Test: `backend/tests/test_logic.py`

**Interfaces:**
- Produces: `LOCATIONS: List[dict]` (each `{"location_id": str, "name": str}`), `_is_valid_location(location_id: str) -> bool`, `GET /api/locations` → `List[dict]` (same shape as `LOCATIONS`). Tasks 2 and 3 both call `_is_valid_location`.

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_logic.py` (after `test_content_type_map`, following the file's existing style of one focused test per behavior):

```python
def test_is_valid_location():
    assert server._is_valid_location("voorburg") is True
    assert server._is_valid_location("the_hague_centre") is True
    assert server._is_valid_location("amsterdam") is False
    assert server._is_valid_location("") is False
    assert server._is_valid_location(None) is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_logic.py::test_is_valid_location -v`
Expected: FAIL with `AttributeError: module 'server' has no attribute '_is_valid_location'`

- [ ] **Step 3: Add the constant, helper, and endpoint**

In `backend/server.py`, immediately after the `WORKING_HOURS` block (`:114-123`), add:

```python
# The two physical locations the practitioner works from. Fixed list —
# there is no admin UI to manage these; adding a third is a code change.
LOCATIONS = [
    {"location_id": "voorburg", "name": "Voorburg"},
    {"location_id": "the_hague_centre", "name": "The Hague Centre"},
]
_VALID_LOCATION_IDS = {loc["location_id"] for loc in LOCATIONS}


def _is_valid_location(location_id) -> bool:
    return location_id in _VALID_LOCATION_IDS
```

Then, in the `# ============ SERVICES ENDPOINTS ============` section, immediately before `@api_router.get("/services", ...)` (`:693`), add a new public endpoint:

```python
# ============ LOCATIONS ENDPOINT ============

@api_router.get("/locations")
async def get_locations():
    """Get the two bookable locations (public, static list)."""
    return LOCATIONS

```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_logic.py -v`
Expected: all tests PASS, including the new `test_is_valid_location`.

- [ ] **Step 5: Manually verify the endpoint**

With the backend running locally (`cd backend && uvicorn server:app --reload`), run:

```bash
curl -s http://localhost:8000/api/locations
```

Expected: `[{"location_id":"voorburg","name":"Voorburg"},{"location_id":"the_hague_centre","name":"The Hague Centre"}]`

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_logic.py
git commit -m "feat(backend): add location catalog and GET /api/locations"
```

---

### Task 2: Backend — location field on Appointment/BlockedSlot + location-scoped conflict checks

**Files:**
- Modify: `backend/server.py` — `Appointment` (`:324`), `AppointmentCreate` (`:337`), `BlockedSlot` (`:357`), `BlockedSlotCreate` (`:366`), `_slot_conflict` (`:809`), `create_appointment` (`:851`), `create_blocked_slot` (`:1003`).

**Interfaces:**
- Consumes: `_is_valid_location` from Task 1.
- Produces: `_slot_conflict(date_str, time_str, duration, location_id, exclude_id=None)` (note the new required `location_id` positional param — Task 3's call site must be updated too, which it is, in Task 3). `Appointment`/`BlockedSlot` documents now always carry `location_id`.

- [ ] **Step 1: Add `location_id` to the four models**

In `backend/server.py`, update `Appointment` (`:324-335`):

```python
class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    appointment_id: str
    user_id: str
    items: List[dict]          # [{service_id, name, price, duration}]
    total_amount: float
    total_duration: int        # minutes
    booking_date: str
    booking_time: str
    location_id: str
    notes: Optional[str] = None
    status: str
    created_at: datetime
```

`AppointmentCreate` (`:337-341`):

```python
class AppointmentCreate(BaseModel):
    items: List[dict]
    booking_date: str
    booking_time: str
    location_id: str
    notes: Optional[str] = None
```

`BlockedSlot` (`:357-364`):

```python
class BlockedSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    block_id: str
    date: str
    location_id: str
    start_time: Optional[str] = None   # None = whole day blocked
    end_time: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime
```

`BlockedSlotCreate` (`:366-370`):

```python
class BlockedSlotCreate(BaseModel):
    date: str
    location_id: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None
```

- [ ] **Step 2: Scope `_slot_conflict` by location**

Replace `_slot_conflict` (`:809-837`):

```python
async def _slot_conflict(date_str: str, time_str: str, duration: int, location_id: str, exclude_id: str = None):
    """Return an error message if the requested visit is outside working hours,
    inside a blocked slot at this location, or overlaps another appointment at
    this location; else None. Locations are checked independently of each other."""
    problem = _hours_problem(date_str, time_str, duration)
    if problem:
        return problem

    start = _time_to_minutes(time_str)
    end = start + duration

    # Admin-blocked slots (whole-day, or a time range) at this location.
    for s in await db.blocked_slots.find({"date": date_str, "location_id": location_id}, {"_id": 0}).to_list(1000):
        st = _time_to_minutes(s.get("start_time")) if s.get("start_time") else None
        et = _time_to_minutes(s.get("end_time")) if s.get("end_time") else None
        if st is None or et is None or (start < et and st < end):
            return "That time is unavailable. Please choose another."

    # Overlap with existing (non-cancelled) appointments at this location.
    for a in await db.appointments.find({"booking_date": date_str, "location_id": location_id, "status": {"$ne": "cancelled"}}, {"_id": 0}).to_list(1000):
        if exclude_id and a.get("appointment_id") == exclude_id:
            continue
        s2 = _time_to_minutes(a.get("booking_time", ""))
        if s2 is None:
            continue
        e2 = s2 + int(a.get("total_duration", 0) or 0)
        if start < e2 and s2 < end:
            return "That time overlaps an existing appointment. Please choose another time."

    return None
```

- [ ] **Step 3: Validate and pass `location_id` in `create_appointment`**

In `create_appointment` (`:851-882`), after the existing `if not data.booking_date or not data.booking_time:` check (`:858-859`), add a location check, and update the `_slot_conflict` call and `appointment_doc`:

```python
    if not data.items:
        raise HTTPException(status_code=400, detail="No treatments selected")
    if not data.booking_date or not data.booking_time:
        raise HTTPException(status_code=400, detail="Please select a date and time")
    if not _is_valid_location(data.location_id):
        raise HTTPException(status_code=400, detail="Please select a valid location")

    total_amount = round(sum(float(i.get("price", 0)) for i in data.items), 2)
    total_duration = sum(int(i.get("duration", 0) or 0) for i in data.items)

    # Enforce working hours, admin blocks, and no overlap (scoped to this location).
    conflict = await _slot_conflict(data.booking_date, data.booking_time, total_duration, data.location_id)
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)

    appointment_id = f"appt_{uuid.uuid4().hex[:12]}"
    appointment_doc = {
        "appointment_id": appointment_id,
        "user_id": user.user_id,
        "items": data.items,
        "total_amount": total_amount,
        "total_duration": total_duration,
        "booking_date": data.booking_date,
        "booking_time": data.booking_time,
        "location_id": data.location_id,
        "notes": data.notes,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
```

- [ ] **Step 4: Validate and store `location_id` in `create_blocked_slot`**

In `create_blocked_slot` (`:1003-1022`):

```python
@api_router.post("/admin/blocked-slots", response_model=BlockedSlot)
async def create_blocked_slot(data: BlockedSlotCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Block a date (whole day) or a time range within a date, at one location (admin only)."""
    await require_admin(request, session_token)
    if not data.date:
        raise HTTPException(status_code=400, detail="A date is required")
    if not _is_valid_location(data.location_id):
        raise HTTPException(status_code=400, detail="Please select a valid location")

    block_id = f"block_{uuid.uuid4().hex[:12]}"
    doc = {
        "block_id": block_id,
        "date": data.date,
        "location_id": data.location_id,
        "start_time": data.start_time or None,
        "end_time": data.end_time or None,
        "reason": data.reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.blocked_slots.insert_one(doc)
    result = await db.blocked_slots.find_one({"block_id": block_id}, {"_id": 0})
    result['created_at'] = datetime.fromisoformat(result['created_at'])
    return BlockedSlot(**result)
```

- [ ] **Step 5: Run the existing pure test suite (regression check)**

Run: `cd backend && python -m pytest tests/test_logic.py -v`
Expected: all tests still PASS (this task doesn't touch `_hours_problem` or any other pure function).

- [ ] **Step 6: Manually verify location-scoped booking**

With the backend running locally against a real/dev Mongo instance and a valid session cookie (`SESSION` below — obtain by logging in through the app once and copying the `session_token` cookie value from browser devtools), run:

```bash
# Book Voorburg, Monday 14:00 (adjust date to a real upcoming Monday)
curl -s -X POST http://localhost:8000/api/appointments \
  -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-10","booking_time":"14:00","location_id":"voorburg"}'
# Expect: 200, appointment created with "location_id":"voorburg"

# Book the SAME date/time at the OTHER location — must succeed (no cross-location conflict)
curl -s -X POST http://localhost:8000/api/appointments \
  -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-10","booking_time":"14:00","location_id":"the_hague_centre"}'
# Expect: 200, appointment created

# Re-book Voorburg at the SAME date/time again — must be rejected
curl -s -X POST http://localhost:8000/api/appointments \
  -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-10","booking_time":"14:00","location_id":"voorburg"}'
# Expect: 409 "That time overlaps an existing appointment. Please choose another time."

# Invalid location
curl -s -X POST http://localhost:8000/api/appointments \
  -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-10","booking_time":"14:00","location_id":"nope"}'
# Expect: 400 "Please select a valid location"
```

Clean up the two test appointments afterwards via the admin panel or `DELETE /api/appointments/{id}`.

- [ ] **Step 7: Commit**

```bash
git add backend/server.py
git commit -m "feat(backend): scope appointment and blocked-slot conflict checks by location"
```

---

### Task 3: Backend — reschedule can change location

**Files:**
- Modify: `backend/server.py` — `RescheduleRequest` (`:343`), `reschedule_appointment` (`:960`).

**Interfaces:**
- Consumes: `_is_valid_location`, `_slot_conflict(..., location_id, exclude_id=None)` from Tasks 1–2.

- [ ] **Step 1: Add `location_id` to `RescheduleRequest`**

```python
class RescheduleRequest(BaseModel):
    booking_date: str
    booking_time: str
    location_id: str
```

- [ ] **Step 2: Validate and use `location_id` in `reschedule_appointment`**

Replace the body of `reschedule_appointment` (`:960-989`):

```python
@api_router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(appointment_id: str, data: RescheduleRequest, request: Request, background_tasks: BackgroundTasks, session_token: Optional[str] = Cookie(None)):
    """Move an appointment to a new date/time/location (owner or admin), re-checking availability."""
    user = await get_current_user(request, session_token)
    appt = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    if appt["status"] in ("cancelled", "completed"):
        raise HTTPException(status_code=400, detail="This appointment can no longer be rescheduled.")
    if not _is_valid_location(data.location_id):
        raise HTTPException(status_code=400, detail="Please select a valid location")

    conflict = await _slot_conflict(
        data.booking_date, data.booking_time,
        int(appt.get("total_duration", 0) or 0),
        data.location_id,
        exclude_id=appointment_id
    )
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)

    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"booking_date": data.booking_date, "booking_time": data.booking_time, "location_id": data.location_id, "status": "pending"}}
    )
    background_tasks.add_task(
        send_email,
        ADMIN_NOTIFY_EMAIL,
        "Appointment rescheduled",
        f"{user.name} ({user.email}) moved their appointment to {data.booking_date} at {data.booking_time}."
    )
    return {"message": "Appointment rescheduled"}
```

- [ ] **Step 3: Run the existing pure test suite (regression check)**

Run: `cd backend && python -m pytest tests/test_logic.py -v`
Expected: all tests still PASS.

- [ ] **Step 4: Manually verify reschedule with a location change**

Using an appointment ID from Task 2's manual testing (or a fresh booking), and the same `$SESSION` cookie:

```bash
curl -s -X PUT http://localhost:8000/api/appointments/<appointment_id>/reschedule \
  -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"booking_date":"2026-08-11","booking_time":"15:00","location_id":"the_hague_centre"}'
# Expect: 200 {"message":"Appointment rescheduled"}, and GET /api/appointments shows
# the appointment now at 2026-08-11 15:00 with "location_id":"the_hague_centre"
```

- [ ] **Step 5: Commit**

```bash
git add backend/server.py
git commit -m "feat(backend): allow changing location on reschedule"
```

---

### Task 4: Frontend — location picker in the booking flow (`Cart.js`)

**Files:**
- Modify: `frontend/src/pages/Cart.js`
- Modify: `frontend/src/contexts/LanguageContext.js:68-74` (en) and `:156-162` (nl)
- Modify: `frontend/tests/e2e/fixtures.js` (add `/api/locations` stub — needed by every test that loads this page)
- Modify: `frontend/tests/e2e/cart.spec.js`

**Interfaces:**
- Consumes: `GET /api/locations` → `[{location_id, name}, ...]` from Task 1.
- Produces: `POST /api/appointments` payload now includes `location_id` (consumed by Task 2's backend).

- [ ] **Step 1: Add the `/api/locations` stub to the shared E2E fixture**

In `frontend/tests/e2e/fixtures.js`, add a `LOCATIONS` constant near `SERVICES` (`:1-11`):

```javascript
const LOCATIONS = [
  { location_id: 'voorburg', name: 'Voorburg' },
  { location_id: 'the_hague_centre', name: 'The Hague Centre' },
];
```

Add a route for it inside `stubBackend` (`:15-25`), alongside the `services` route:

```javascript
  await page.route('**/api/locations', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LOCATIONS) }));
```

Add `location_id: 'voorburg'` to the `APPOINTMENTS` fixture entry (`:42-45`):

```javascript
const APPOINTMENTS = [
  { appointment_id: 'appt-1', booking_date: '2030-01-02', booking_time: '10:00', location_id: 'voorburg',
    items: [{ name: 'Ayurvedic Consultation' }], total_amount: 65, status: 'pending' },
];
```

Export `LOCATIONS` from the `module.exports` line (`:70`):

```javascript
module.exports = { stubBackend, stubAuth, seedCart, stubAdmin, SERVICES, USER, ADMIN, APPOINTMENTS, LOCATIONS };
```

- [ ] **Step 2: Write the failing E2E assertion**

In `frontend/tests/e2e/cart.spec.js`, update the `'authed happy path books and navigates to dashboard'` test (`:32-41`) to select a location before confirming:

```javascript
  test('authed happy path books and navigates to dashboard', async ({ page }) => {
    await stubBackend(page);
    await stubAuth(page); // /auth/me -> 200 user (registered after stubBackend => wins)
    await seedCart(page);
    await page.goto('/cart');
    await page.locator('#appt-date').fill('2030-01-01');
    await page.locator('#appt-time').fill('10:00');
    await page.locator('#appt-location').selectOption('voorburg');
    await page.getByTestId('confirm-appointment-button').click();
    await expect(page).toHaveURL(/\/dashboard$/); // clearCart + navigate('/dashboard')
  });
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd frontend && npx playwright test cart.spec.js -g "authed happy path"`
Expected: FAIL — `#appt-location` doesn't exist yet (Playwright locator times out / element not found).

- [ ] **Step 4: Add translation keys**

In `frontend/src/contexts/LanguageContext.js`, English `booking` block (`:68-74`):

```javascript
    booking: {
      title: 'Book Appointment',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      selectLocation: 'Select Location',
      notes: 'Additional Notes',
      submit: 'Book Appointment'
    },
```

Dutch `booking` block (`:156-162`):

```javascript
    booking: {
      title: 'Afspraak Maken',
      selectDate: 'Selecteer Datum',
      selectTime: 'Selecteer Tijd',
      selectLocation: 'Selecteer Locatie',
      notes: 'Aanvullende Opmerkingen',
      submit: 'Boek Afspraak'
    },
```

- [ ] **Step 5: Add location state, fetch, field, and validation to `Cart.js`**

Add `MapPin` to the `lucide-react` import (`:8`):

```javascript
import { Trash2, Euro, ShoppingBag, Calendar, Clock, MapPin } from 'lucide-react';
```

Add state and a fetch effect, right after the existing `useState` declarations (`:22-25`):

```javascript
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    axios.get(`${API}/locations`).then((res) => setLocations(res.data)).catch(() => {});
  }, []);
```

This requires adding `useEffect` to the React import (`:1`):

```javascript
import React, { useState, useEffect } from 'react';
```

Update the validation in `handleConfirm` (`:36-39`):

```javascript
    if (!date || !time || !location) {
      toast.error(language === 'en' ? 'Please select a location, date and time' : 'Selecteer een locatie, datum en tijd');
      return;
    }
```

Include `location_id` in the payload (`:43-53`):

```javascript
      const payload = {
        items: cartItems.map(item => ({
          service_id: item.service_id,
          name: language === 'en' ? item.name_en : item.name_nl,
          price: item.price,
          duration: item.duration
        })),
        booking_date: date,
        booking_time: time,
        location_id: location,
        notes
      };
```

Add the location field to the "Choose your slot" grid (`:153-181`), changing the grid to three columns and inserting a `<select>` before the date field:

```javascript
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="appt-location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('booking.selectLocation')}
                </Label>
                <select
                  id="appt-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>{language === 'en' ? 'Choose a location' : 'Kies een locatie'}</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('booking.selectDate')}
                </Label>
                <Input
                  id="appt-date"
                  type="date"
                  min={getMinDate()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('booking.selectTime')}
                </Label>
                <Input
                  id="appt-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
```

- [ ] **Step 6: Run the E2E test to confirm it passes**

Run: `cd frontend && npx playwright test cart.spec.js`
Expected: all tests in `cart.spec.js` PASS, including the updated happy-path test.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Cart.js frontend/src/contexts/LanguageContext.js frontend/tests/e2e/fixtures.js frontend/tests/e2e/cart.spec.js
git commit -m "feat(cart): add location selection to the booking flow"
```

---

### Task 5: Frontend — location on the dashboard (display + reschedule)

**Files:**
- Modify: `frontend/src/pages/Dashboard.js`

**Interfaces:**
- Consumes: `GET /api/locations` (Task 1), `PUT /api/appointments/{id}/reschedule` now requires `location_id` (Task 3). `LOCATIONS`/`APPOINTMENTS` fixtures already updated in Task 4's Step 1 cover this page too (both use the shared `fixtures.js`).

- [ ] **Step 1: Add location state, fetch, and a lookup helper**

Add `MapPin` to the `lucide-react` import (`:5`):

```javascript
import { Calendar, Clock, User, Euro, MailWarning, MapPin } from 'lucide-react';
```

Add state next to the existing ones (`:18-23`):

```javascript
  const [appointments, setAppointments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rDate, setRDate] = useState('');
  const [rTime, setRTime] = useState('');
  const [rLocation, setRLocation] = useState('');
  const [busy, setBusy] = useState(false);
```

Fetch locations once on mount, independent of the auth-gated `fetchData` (this endpoint is public):

```javascript
  useEffect(() => {
    axios.get(`${API}/locations`).then((res) => setLocations(res.data)).catch(() => {});
  }, []);
```

Add this `useEffect` right after the existing one at `:25-33`. Add a lookup helper near `getMinDate` (`:46`):

```javascript
  const getMinDate = () => new Date().toISOString().split('T')[0];
  const locationName = (id) => locations.find((l) => l.location_id === id)?.name || '';
```

- [ ] **Step 2: Prefill and submit location in the reschedule flow**

Update `startReschedule` (`:71-75`):

```javascript
  const startReschedule = (appt) => {
    setRescheduleId(appt.appointment_id);
    setRDate(appt.booking_date);
    setRTime(appt.booking_time);
    setRLocation(appt.location_id || '');
  };
```

Update `submitReschedule` (`:77-93`):

```javascript
  const submitReschedule = async (id) => {
    if (!rDate || !rTime || !rLocation) {
      toast.error(language === 'en' ? 'Please choose a location, date and time.' : 'Kies een locatie, datum en tijd.');
      return;
    }
    setBusy(true);
    try {
      await axios.put(`${API}/appointments/${id}/reschedule`, { booking_date: rDate, booking_time: rTime, location_id: rLocation }, { withCredentials: true });
      toast.success(language === 'en' ? 'Appointment rescheduled.' : 'Afspraak verzet.');
      setRescheduleId(null);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.detail || (language === 'en' ? 'Could not reschedule.' : 'Kan niet verzetten.'));
    } finally {
      setBusy(false);
    }
  };
```

- [ ] **Step 3: Show the location on each appointment card**

Update the card header (`:186-189`):

```javascript
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {appt.booking_date} · {appt.booking_time}
                        {locationName(appt.location_id) && (
                          <span className="inline-flex items-center gap-1 text-sm font-normal text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" /> {locationName(appt.location_id)}
                          </span>
                        )}
                      </p>
```

- [ ] **Step 4: Add the location select to the reschedule dialog**

Update the reschedule form (`:210-218`) to include a location select before the date field:

```javascript
                        <div className="flex flex-wrap items-end gap-3 bg-muted/50 p-3 rounded-xl">
                          <div className="space-y-1">
                            <Label htmlFor={`rl-${appt.appointment_id}`} className="text-xs">{language === 'en' ? 'Location' : 'Locatie'}</Label>
                            <select
                              id={`rl-${appt.appointment_id}`}
                              value={rLocation}
                              onChange={(e) => setRLocation(e.target.value)}
                              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                            >
                              <option value="" disabled>{language === 'en' ? 'Choose a location' : 'Kies een locatie'}</option>
                              {locations.map((loc) => (
                                <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`rd-${appt.appointment_id}`} className="text-xs">{language === 'en' ? 'Date' : 'Datum'}</Label>
                            <Input id={`rd-${appt.appointment_id}`} type="date" min={getMinDate()} value={rDate} onChange={(e) => setRDate(e.target.value)} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`rt-${appt.appointment_id}`} className="text-xs">{language === 'en' ? 'Time' : 'Tijd'}</Label>
                            <Input id={`rt-${appt.appointment_id}`} type="time" value={rTime} onChange={(e) => setRTime(e.target.value)} className="h-9" />
                          </div>
                          <Button size="sm" onClick={() => submitReschedule(appt.appointment_id)} disabled={busy}>
                            {language === 'en' ? 'Save' : 'Opslaan'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRescheduleId(null)} disabled={busy}>
                            {language === 'en' ? 'Cancel' : 'Annuleren'}
                          </Button>
                        </div>
```

- [ ] **Step 5: Run the dashboard E2E suite (regression check)**

Run: `cd frontend && npx playwright test dashboard.spec.js`
Expected: all tests PASS. `'renders appointments and reschedules'` should pass unmodified because `APPOINTMENTS` (updated in Task 4, Step 1) now has `location_id: 'voorburg'`, which `startReschedule` copies into `rLocation`, so the select already has a valid value when Save is clicked.

- [ ] **Step 6: Also run the axe suite for `/dashboard` (this page is a11y-scanned)**

Run: `cd frontend && npx playwright test axe.spec.js -g "dashboard"`
Expected: PASS — the new `<select>` has an associated `<Label htmlFor>`, matching the existing `rd-`/`rt-` pattern, so it won't introduce an unlabeled-form-field violation.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Dashboard.js
git commit -m "feat(dashboard): show appointment location and allow changing it on reschedule"
```

---

### Task 6: Frontend — location in Admin (appointments display + blocked-slot form)

**Files:**
- Modify: `frontend/src/pages/Admin.js`

**Interfaces:**
- Consumes: `GET /api/locations` (Task 1), `POST /api/admin/blocked-slots` now requires `location_id` (Task 2).

- [ ] **Step 1: Fetch locations alongside the other admin data**

Add `locations` state next to `blockedSlots` (`:24`):

```javascript
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [locations, setLocations] = useState([]);
```

Add `location_id: ''` to the initial `blockForm` state (`:25`):

```javascript
  const [blockForm, setBlockForm] = useState({ date: '', location_id: '', start_time: '', end_time: '', reason: '' });
```

Add a `locations` entry to the `endpoints` array in `fetchData` (`:54-60`):

```javascript
    const endpoints = [
      { label: 'services', url: `${API}/services`, set: setServices },
      { label: 'appointments', url: `${API}/appointments`, set: setAppointments },
      { label: 'users', url: `${API}/admin/users`, set: setUsers },
      { label: 'messages', url: `${API}/admin/contact`, set: setMessages },
      { label: 'availability', url: `${API}/admin/blocked-slots`, set: setBlockedSlots },
      { label: 'locations', url: `${API}/locations`, set: setLocations }
    ];
```

Add a lookup helper right after the early-return guard (`:316`), alongside the other derived values like `messageCounts`:

```javascript
  if (!user || user.role !== 'admin') return null;

  const locationName = (id) => locations.find((l) => l.location_id === id)?.name || '';

  const messageCounts = {
```

- [ ] **Step 2: Show location on each appointment row**

Update the appointments tab row header (`:772-779`):

```javascript
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {appt.booking_date} at {appt.booking_time}
                            {locationName(appt.location_id) && (
                              <span className="text-sm font-normal text-muted-foreground">· {locationName(appt.location_id)}</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {appt.total_duration} min • €{(appt.total_amount || 0).toFixed(2)}
                          </p>
                        </div>
```

- [ ] **Step 3: Require and submit location in the blocked-slot form**

Update `handleAddBlock` (`:217-237`):

```javascript
  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!blockForm.date) {
      toast.error('Please choose a date to block');
      return;
    }
    if (!blockForm.location_id) {
      toast.error('Please choose a location to block');
      return;
    }
    try {
      await axios.post(`${API}/admin/blocked-slots`, {
        date: blockForm.date,
        location_id: blockForm.location_id,
        start_time: blockForm.start_time || null,
        end_time: blockForm.end_time || null,
        reason: blockForm.reason || null,
      }, { withCredentials: true });
      toast.success('Blocked time added');
      setBlockForm({ date: '', location_id: '', start_time: '', end_time: '', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding blocked slot:', error);
      toast.error('Failed to add blocked time');
    }
  };
```

- [ ] **Step 4: Add the location field to the block form and display it on each row**

Update the block form grid (`:827-844`) to add a location field (changing the grid to 6 columns to fit it):

```javascript
                <form onSubmit={handleAddBlock} className="bg-muted p-6 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end" data-testid="block-form">
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="block-location">Location</label>
                    <select
                      id="block-location"
                      value={blockForm.location_id}
                      onChange={(e) => setBlockForm({ ...blockForm, location_id: e.target.value })}
                      required
                      className="w-full h-9 rounded-lg border border-border bg-background px-3"
                    >
                      <option value="" disabled>Choose a location</option>
                      {locations.map((loc) => (
                        <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="block-date">Date</label>
                    <Input id="block-date" type="date" value={blockForm.date} onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="block-start-time">From (optional)</label>
                    <Input id="block-start-time" type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="block-end-time">To (optional)</label>
                    <Input id="block-end-time" type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="block-reason">Reason (optional)</label>
                    <Input id="block-reason" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="e.g. Holiday" />
                  </div>
                  <Button type="submit" className="bg-primary text-primary-foreground">Add block</Button>
                </form>
```

Update the blocked-slot row display (`:850-857`):

```javascript
                    {blockedSlots.map((b) => (
                      <div key={b.block_id} className="border border-border rounded-xl p-4 flex items-center justify-between" data-testid={`block-${b.block_id}`}>
                        <div>
                          <p className="font-semibold text-foreground">
                            {locationName(b.location_id) && `${locationName(b.location_id)} · `}
                            {b.date}
                            {b.start_time && b.end_time ? ` · ${b.start_time}–${b.end_time}` : ' · Whole day'}
                          </p>
                          {b.reason && <p className="text-sm text-muted-foreground">{b.reason}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(b.block_id)} aria-label="Remove blocked time" data-testid={`delete-block-${b.block_id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
```

- [ ] **Step 5: Run the admin E2E suite (regression check)**

Run: `cd frontend && npx playwright test admin.spec.js`
Expected: all tests PASS. None of them submit the blocked-slot form or assert on appointment-row text, so the new required field and display don't break existing assertions; the ad hoc `appts` array in `'appointment filter narrows the visible list'` (`:80-83`) has no `location_id`, and `locationName()` returns `''` for that, so the `·  Location` fragment is simply omitted rather than rendering `undefined`.

- [ ] **Step 6: Run the axe suite for `/admin` (all tabs, since this page is scanned tab-by-tab)**

Run: `cd frontend && npx playwright test axe.spec.js -g "admin"`
Expected: PASS — the new blocked-slot location `<select>` has a `<label htmlFor>` matching the existing Date/From/To/Reason fields' pattern.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Admin.js
git commit -m "feat(admin): show appointment location and require it when blocking a slot"
```

---

### Task 7: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && python -m pytest -v`
Expected: all tests PASS.

- [ ] **Step 2: Run the full frontend E2E suite**

Run: `cd frontend && npx playwright test`
Expected: all tests PASS, including the full `axe.spec.js` sweep across every page and every admin tab.

- [ ] **Step 3: Manual smoke test in a browser**

Start both servers locally (backend `uvicorn server:app --reload`, frontend `npm start` or `yarn start`), then:
1. Add a service to the cart, go to `/cart`, confirm the "Choose your slot" section now shows Location before Date/Time, and that submitting without a location shows the "select a location" error.
2. Book an appointment at Voorburg, then log in as admin and check `/admin` → Appointments shows "· Voorburg" on that row.
3. In `/admin` → Availability, add a blocked slot without selecting a location — confirm it's rejected client-side. Add one for The Hague Centre — confirm it appears with "The Hague Centre ·" prefix.
4. As the client user, go to `/dashboard`, click Reschedule on the appointment, change the location dropdown to The Hague Centre, save, and confirm the card now shows the new location.

No commit for this task — it's verification only.
