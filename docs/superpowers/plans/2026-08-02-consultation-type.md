# Online/Offline Consultation Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let clients pick an Online or Offline consultation type when booking or rescheduling, independent of which location they choose, with no conflict between the two modes — while guaranteeing a legacy appointment with no consultation type on file still blocks any new booking at its slot.

**Architecture:** A `CONSULTATION_TYPES` constant (`{"online", "offline"}`) and `_is_valid_consultation_type` helper in `backend/server.py`, mirroring the existing `LOCATIONS`/`_is_valid_location` pattern but without a lookup table (the two values are already display-ready). `consultation_type` is added to `Appointment` (read-lenient, `Optional[str] = None`), `AppointmentCreate`, and `RescheduleRequest` (both required). `_slot_conflict` gains a `consultation_type` parameter, and its appointment-overlap query changes from an exact match to `{"$in": [consultation_type, None]}` so a record with no `consultation_type` on file still conflicts regardless of what the new request's mode is. `BlockedSlot`/`create_blocked_slot` are untouched. The frontend adds a plain `<select>` (Online/Offline, no fetch needed) to `Cart.js`'s booking flow and `Dashboard.js`'s reschedule dialog, and displays it read-only next to location on `Dashboard.js` and `Admin.js`.

**Tech Stack:** FastAPI + Motor (async MongoDB) backend in `backend/server.py`; React frontend (`Cart.js`, `Dashboard.js`, `Admin.js`); Playwright E2E tests with route-stub fixtures (`frontend/tests/e2e/fixtures.js`).

## Global Constraints

- Consultation type is independent of location — neither restricts the other; location stays required regardless of mode.
- No conflict between Online and Offline at the same location/date/time.
- A legacy appointment with no `consultation_type` field must still conflict with any new booking at its slot, regardless of the new booking's requested mode.
- `BlockedSlot`/`BlockedSlotCreate`/`create_blocked_slot` are NOT changed — blocked slots apply to both modes uniformly.
- No admin CRUD, no `GET /api/...` endpoint for consultation types — exactly two fixed values, hardcoded directly in the frontend `<select>` options.
- Reschedule may change consultation type, same as it can already change location.

---

### Task 1: Backend — consultation type validation, model fields, conflict scoping

**Files:**
- Modify: `backend/server.py` — new constant/helper near `LOCATIONS`/`_is_valid_location` (`:126-143`); `Appointment` (`:344-356`); `AppointmentCreate` (`:358-363`); `RescheduleRequest` (`:365-368`); `_slot_conflict` (`:862-896`); `create_appointment` (`:910-970`); `reschedule_appointment` (`:1021-1054`)
- Test: `backend/tests/test_logic.py`

**Interfaces:**
- Produces: `_is_valid_consultation_type(value) -> bool`. `_slot_conflict(date_str, time_str, duration, location_id, consultation_type, exclude_id=None)` — `consultation_type` is a new required positional parameter inserted after `location_id` and before the keyword-only `exclude_id`.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_logic.py`, after `test_location_name`:

```python
def test_is_valid_consultation_type():
    assert server._is_valid_consultation_type("online") is True
    assert server._is_valid_consultation_type("offline") is True
    assert server._is_valid_consultation_type("hybrid") is False
    assert server._is_valid_consultation_type("") is False
    assert server._is_valid_consultation_type(None) is False


def test_appointment_model_tolerates_missing_consultation_type():
    """Records created before this feature shipped have no consultation_type
    at all — the response model must not reject them."""
    doc = {
        "appointment_id": "appt_y",
        "user_id": "u_y",
        "items": [],
        "total_amount": 0.0,
        "total_duration": 0,
        "booking_date": "2026-01-01",
        "booking_time": "14:00",
        "status": "pending",
        "created_at": server.datetime.now(server.timezone.utc),
    }
    appt = server.Appointment(**doc)
    assert appt.consultation_type is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./.venv/Scripts/python -m pytest tests/test_logic.py -v -k consultation_type`
Expected: FAIL with `AttributeError: module 'server' has no attribute '_is_valid_consultation_type'` (and the model test fails because `Appointment` has no `consultation_type` field yet, so `appt.consultation_type` raises `AttributeError`).

- [ ] **Step 3: Add the constant and helper**

In `backend/server.py`, immediately after `_location_name` (`:139-143`):

```python
# Two fixed, independent booking modes — no admin UI, no name-lookup needed
# (the values are already display-ready labels once capitalized).
CONSULTATION_TYPES = {"online", "offline"}


def _is_valid_consultation_type(value) -> bool:
    return value in CONSULTATION_TYPES
```

- [ ] **Step 4: Add `consultation_type` to the three models**

`Appointment` (`:344-356`) — add after `location_id`:

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
    location_id: Optional[str] = None
    consultation_type: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
```

`AppointmentCreate` (`:358-363`):

```python
class AppointmentCreate(BaseModel):
    items: List[dict]
    booking_date: str
    booking_time: str
    location_id: str
    consultation_type: str
    notes: Optional[str] = None
```

`RescheduleRequest` (`:365-368`):

```python
class RescheduleRequest(BaseModel):
    booking_date: str
    booking_time: str
    location_id: str
    consultation_type: str
```

- [ ] **Step 5: Wire `consultation_type` into `_slot_conflict`**

Replace `_slot_conflict` (`:862-896`):

```python
async def _slot_conflict(date_str: str, time_str: str, duration: int, location_id: str, consultation_type: str, exclude_id: str = None):
    """Return an error message if the requested visit is outside working hours,
    already in the past, inside a blocked slot at this location, or overlaps
    another appointment at this location; else None. Locations are checked
    independently of each other, and so are consultation types — except a
    legacy appointment with no consultation_type on file (predates this
    field) still conflicts regardless of the new request's mode, since we
    don't actually know what mode it was."""
    problem = _hours_problem(date_str, time_str, duration)
    if problem:
        return problem

    problem = _past_problem(date_str, time_str)
    if problem:
        return problem

    start = _time_to_minutes(time_str)
    end = start + duration

    # Admin-blocked slots (whole-day, or a time range) at this location.
    # Blocked slots apply to both consultation types uniformly.
    for s in await db.blocked_slots.find({"date": date_str, "location_id": location_id}, {"_id": 0}).to_list(1000):
        st = _time_to_minutes(s.get("start_time")) if s.get("start_time") else None
        et = _time_to_minutes(s.get("end_time")) if s.get("end_time") else None
        if st is None or et is None or (start < et and st < end):
            return "That time is unavailable. Please choose another."

    # Overlap with existing (non-cancelled) appointments at this location and
    # consultation type. A record with no consultation_type on file (legacy,
    # predates this field) matches regardless of the requested type.
    for a in await db.appointments.find({
        "booking_date": date_str,
        "location_id": location_id,
        "consultation_type": {"$in": [consultation_type, None]},
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(1000):
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

- [ ] **Step 6: Validate and use `consultation_type` in `create_appointment`**

In `create_appointment` (`:910-970`), after the existing location check (`:919-920`):

```python
    if not _is_valid_location(data.location_id):
        raise HTTPException(status_code=400, detail="Please select a valid location")
    if not _is_valid_consultation_type(data.consultation_type):
        raise HTTPException(status_code=400, detail="Please select a valid consultation type")
```

Update the `_slot_conflict` call (`:926`):

```python
    conflict = await _slot_conflict(data.booking_date, data.booking_time, total_duration, data.location_id, data.consultation_type)
```

Update `appointment_doc` (`:931-943`) to add the field after `location_id`:

```python
    appointment_doc = {
        "appointment_id": appointment_id,
        "user_id": user.user_id,
        "items": data.items,
        "total_amount": total_amount,
        "total_duration": total_duration,
        "booking_date": data.booking_date,
        "booking_time": data.booking_time,
        "location_id": data.location_id,
        "consultation_type": data.consultation_type,
        "notes": data.notes,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
```

- [ ] **Step 7: Validate and use `consultation_type` in `reschedule_appointment`**

In `reschedule_appointment` (`:1021-1054`), after the existing location check (`:1032-1033`):

```python
    if not _is_valid_location(data.location_id):
        raise HTTPException(status_code=400, detail="Please select a valid location")
    if not _is_valid_consultation_type(data.consultation_type):
        raise HTTPException(status_code=400, detail="Please select a valid consultation type")
```

Update the `_slot_conflict` call (`:1035-1040`):

```python
    conflict = await _slot_conflict(
        data.booking_date, data.booking_time,
        int(appt.get("total_duration", 0) or 0),
        data.location_id,
        data.consultation_type,
        exclude_id=appointment_id
    )
```

Update the `$set` update (`:1044-1047`):

```python
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"booking_date": data.booking_date, "booking_time": data.booking_time, "location_id": data.location_id, "consultation_type": data.consultation_type, "status": "pending"}}
    )
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd backend && ./.venv/Scripts/python -m pytest tests/test_logic.py -v`
Expected: all tests PASS, pristine output.

- [ ] **Step 9: Manually verify the legacy-safe conflict filter end-to-end**

Same local Mongo + `.venv` setup used for prior backend tasks in this repo. From `backend/`:

```bash
MONGO_URL=mongodb://localhost:27017 DB_NAME=priiyanka_task1_manual_test ./.venv/Scripts/python -m uvicorn server:app --port 8013 &
```

Register + log in (login's JSON includes `"session_token"` directly):

```bash
curl -s -X POST http://localhost:8013/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"consulttest@example.com","password":"testpass123","name":"Consult Test"}'
curl -s -X POST http://localhost:8013/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"consulttest@example.com","password":"testpass123"}'
```

Book an Online consultation, then an Offline one at the SAME date/time/location — both must succeed (independent modes):

```bash
curl -s -X POST http://localhost:8013/api/appointments -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-10","booking_time":"14:00","location_id":"voorburg","consultation_type":"online"}'
# Expect: 200

curl -s -X POST http://localhost:8013/api/appointments -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-10","booking_time":"14:00","location_id":"voorburg","consultation_type":"offline"}'
# Expect: 200 — different mode, same slot, no conflict
```

Now simulate a legacy record (created before this field existed) directly via the driver, at a fresh date/time so it doesn't collide with the two bookings above, then confirm a NEW booking at that same slot is rejected regardless of which mode it requests:

```bash
./.venv/Scripts/python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['priiyanka_task1_manual_test']
    await db.appointments.insert_one({
        'appointment_id': 'appt_legacy_test',
        'user_id': 'someone',
        'items': [],
        'total_amount': 0,
        'total_duration': 60,
        'booking_date': '2026-08-11',
        'booking_time': '14:00',
        'location_id': 'voorburg',
        'status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat(),
    })  # note: no consultation_type key at all
asyncio.run(main())
"

curl -s -X POST http://localhost:8013/api/appointments -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-11","booking_time":"14:00","location_id":"voorburg","consultation_type":"online"}'
# Expect: 409 "That time overlaps an existing appointment. Please choose another time."
# (rejected even though the legacy record has no consultation_type and this request says "online")
```

Also verify the invalid-value case:

```bash
curl -s -X POST http://localhost:8013/api/appointments -H "Content-Type: application/json" \
  -b "session_token=$SESSION" \
  -d '{"items":[{"service_id":"x","name":"Test","price":10,"duration":60}],"booking_date":"2026-08-12","booking_time":"14:00","location_id":"voorburg","consultation_type":"hybrid"}'
# Expect: 400 "Please select a valid consultation type"
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

- [ ] **Step 10: Commit**

```bash
git add backend/server.py backend/tests/test_logic.py
git commit -m "feat(backend): add online/offline consultation type with legacy-safe conflict checking"
```

---

### Task 2: Frontend — Consultation Type field in the booking flow (`Cart.js`)

**Files:**
- Modify: `frontend/src/pages/Cart.js`
- Modify: `frontend/tests/e2e/cart.spec.js`

**Interfaces:**
- Consumes: `POST /api/appointments` now requires `consultation_type` (`"online"` or `"offline"`) in its payload (Task 1).
- Produces: nothing consumed by later tasks — Task 3/4 add their own independent `<select>` for this field.

- [ ] **Step 1: Write the failing E2E assertion**

In `frontend/tests/e2e/cart.spec.js`, update the `'authed happy path books and navigates to dashboard'` test (`:32-42`) to also pick a consultation type:

```javascript
  test('authed happy path books and navigates to dashboard', async ({ page }) => {
    await stubBackend(page);
    await stubAuth(page); // /auth/me -> 200 user (registered after stubBackend => wins)
    await seedCart(page);
    await page.goto('/cart');
    await page.locator('#appt-date').fill('2030-01-01');
    await page.locator('#appt-time').fill('10:00');
    await page.locator('#appt-location').selectOption('voorburg');
    await page.locator('#appt-consultation-type').selectOption('online');
    await page.getByTestId('confirm-appointment-button').click();
    await expect(page).toHaveURL(/\/dashboard$/); // clearCart + navigate('/dashboard')
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd frontend && npx playwright test cart.spec.js -g "authed happy path"`
Expected: FAIL — `#appt-consultation-type` doesn't exist yet.

- [ ] **Step 3: Add the field to `Cart.js`**

Add state next to the existing `location` state (`:22-27`):

```javascript
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [consultationType, setConsultationType] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
```

Extend the required-fields check in `handleConfirm` (`:45-48`):

```javascript
    if (!date || !time || !location || !consultationType) {
      toast.error(language === 'en' ? 'Please select a location, consultation type, date and time' : 'Selecteer een locatie, consulttype, datum en tijd');
      return;
    }
```

Include it in the payload (`:56-67`):

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
        consultation_type: consultationType,
        notes
      };
```

The "Choose your slot" grid currently reads (find this exact block — it has Location, Date, and Time as its three grid items, in that order):

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
```

Change the grid's column count from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4` (four fields now: Location, Consultation Type, Date, Time), and insert the new field's grid item immediately after the Location item's closing `</div>` (i.e. between Location and Date):

```javascript
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <Label htmlFor="appt-consultation-type">
                  {language === 'en' ? 'Consultation Type' : 'Consulttype'}
                </Label>
                <select
                  id="appt-consultation-type"
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>{language === 'en' ? 'Choose a type' : 'Kies een type'}</option>
                  <option value="online">{language === 'en' ? 'Online' : 'Online'}</option>
                  <option value="offline">{language === 'en' ? 'Offline' : 'Offline'}</option>
                </select>
              </div>
```

The Date and Time grid items that follow (`appt-date`, `appt-time`) stay exactly as they are — only the class on the parent grid `<div>` and the new Consultation Type item change.

- [ ] **Step 4: Run the E2E test to confirm it passes**

Run: `cd frontend && npx playwright test cart.spec.js`
Expected: all tests in `cart.spec.js` PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Cart.js frontend/tests/e2e/cart.spec.js
git commit -m "feat(cart): add online/offline consultation type to the booking flow"
```

---

### Task 3: Frontend — Consultation Type on the dashboard (display + reschedule)

**Files:**
- Modify: `frontend/src/pages/Dashboard.js`
- Modify: `frontend/tests/e2e/fixtures.js`

**Interfaces:**
- Consumes: `PUT /api/appointments/{id}/reschedule` now requires `consultation_type` (Task 1).

- [ ] **Step 1: Add `consultation_type` to the shared `APPOINTMENTS` fixture**

In `frontend/tests/e2e/fixtures.js`, update the `APPOINTMENTS` entry (`:49-52`) — Dashboard's reschedule dialog will now also require a consultation type, prefilled from the appointment's own value, and the existing `'renders appointments and reschedules'` test in `dashboard.spec.js` doesn't select one explicitly, so the fixture needs a valid value for that test to keep passing unmodified:

```javascript
const APPOINTMENTS = [
  { appointment_id: 'appt-1', booking_date: '2030-01-02', booking_time: '10:00', location_id: 'voorburg', consultation_type: 'offline',
    items: [{ name: 'Ayurvedic Consultation' }], total_amount: 65, status: 'pending' },
];
```

- [ ] **Step 2: Add state, display helper, and reschedule wiring in `Dashboard.js`**

Add state next to `rLocation` (`:24`):

```javascript
  const [rLocation, setRLocation] = useState('');
  const [rConsultationType, setRConsultationType] = useState('');
```

Add a display-label helper next to `locationName` (`:56`):

```javascript
  const locationName = (id) => locations.find((l) => l.location_id === id)?.name || '';
  const consultationTypeLabel = (value) => (value === 'online' ? (language === 'en' ? 'Online' : 'Online') : value === 'offline' ? (language === 'en' ? 'Offline' : 'Offline') : '');
```

Update `startReschedule` (`:81-86`):

```javascript
  const startReschedule = (appt) => {
    setRescheduleId(appt.appointment_id);
    setRDate(appt.booking_date);
    setRTime(appt.booking_time);
    setRLocation(appt.location_id || '');
    setRConsultationType(appt.consultation_type || '');
  };
```

Update `submitReschedule` (`:88-108`):

```javascript
  const submitReschedule = async (id) => {
    if (!rDate || !rTime || !rLocation || !rConsultationType) {
      toast.error(language === 'en' ? 'Please choose a location, consultation type, date and time.' : 'Kies een locatie, consulttype, datum en tijd.');
      return;
    }
    if (new Date(`${rDate}T${rTime}`) < new Date()) {
      toast.error(language === 'en' ? 'Please choose a date and time in the future.' : 'Kies een datum en tijd in de toekomst.');
      return;
    }
    setBusy(true);
    try {
      await axios.put(`${API}/appointments/${id}/reschedule`, { booking_date: rDate, booking_time: rTime, location_id: rLocation, consultation_type: rConsultationType }, { withCredentials: true });
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

- [ ] **Step 3: Show consultation type on the appointment card**

Update the card header (`:201-209`) to add the consultation type label next to the location pill:

```javascript
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {appt.booking_date} · {appt.booking_time}
                        {locationName(appt.location_id) && (
                          <span className="inline-flex items-center gap-1 text-sm font-normal text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" /> {locationName(appt.location_id)}
                          </span>
                        )}
                        {consultationTypeLabel(appt.consultation_type) && (
                          <span className="text-sm font-normal text-muted-foreground">· {consultationTypeLabel(appt.consultation_type)}</span>
                        )}
                      </p>
```

- [ ] **Step 4: Add the field to the reschedule dialog**

Update the reschedule form (`:230-244`) to add a consultation-type select right after the Location select:

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
                            <Label htmlFor={`rc-${appt.appointment_id}`} className="text-xs">{language === 'en' ? 'Consultation Type' : 'Consulttype'}</Label>
                            <select
                              id={`rc-${appt.appointment_id}`}
                              value={rConsultationType}
                              onChange={(e) => setRConsultationType(e.target.value)}
                              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                            >
                              <option value="" disabled>{language === 'en' ? 'Choose a type' : 'Kies een type'}</option>
                              <option value="online">{language === 'en' ? 'Online' : 'Online'}</option>
                              <option value="offline">{language === 'en' ? 'Offline' : 'Offline'}</option>
                            </select>
                          </div>
```

(The Date, Time, Save, and Cancel elements that follow stay exactly as they are — only the new consultation-type block is inserted between the Location `<select>`'s closing `</div>` and the Date field's opening `<div>`.)

- [ ] **Step 5: Run the dashboard E2E suite (regression check)**

Run: `cd frontend && npx playwright test dashboard.spec.js`
Expected: all tests PASS unmodified — `'renders appointments and reschedules'` works because `APPOINTMENTS`'s `consultation_type: 'offline'` (Step 1) is copied into `rConsultationType` by `startReschedule`, so the select already has a valid value when Save is clicked.

- [ ] **Step 6: Run the axe suite for `/dashboard`**

Run: `cd frontend && npx playwright test axe.spec.js -g "dashboard"`
Expected: PASS — the new `<select>` has an associated `<Label htmlFor>`.

- [ ] **Step 7: Also run `cart.spec.js` and `admin.spec.js` as a broader regression check**

Run: `cd frontend && npx playwright test cart.spec.js admin.spec.js`
Expected: all PASS — these share `fixtures.js`, which only gained one new field on one fixture entry.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/Dashboard.js frontend/tests/e2e/fixtures.js
git commit -m "feat(dashboard): show consultation type and allow changing it on reschedule"
```

---

### Task 4: Frontend — Consultation Type display in Admin

**Files:**
- Modify: `frontend/src/pages/Admin.js`

**Interfaces:**
- Consumes: nothing new — `appointments` already includes `consultation_type` from `GET /api/appointments` (Task 1).

- [ ] **Step 1: Add a display-label helper**

In `frontend/src/pages/Admin.js`, right after the `locationName` helper (`:325`, immediately after the `if (!user || user.role !== 'admin') return null;` guard):

```javascript
  const locationName = (id) => locations.find((l) => l.location_id === id)?.name || '';
  const consultationTypeLabel = (value) => (value === 'online' ? 'Online' : value === 'offline' ? 'Offline' : '');
```

- [ ] **Step 2: Show it on each appointment row**

Update the appointments-tab row header (`:781-788`):

```javascript
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {appt.booking_date} at {appt.booking_time}
                            {locationName(appt.location_id) && (
                              <span className="text-sm font-normal text-muted-foreground">· {locationName(appt.location_id)}</span>
                            )}
                            {consultationTypeLabel(appt.consultation_type) && (
                              <span className="text-sm font-normal text-muted-foreground">· {consultationTypeLabel(appt.consultation_type)}</span>
                            )}
                          </p>
```

- [ ] **Step 3: Run the admin E2E suite (regression check)**

Run: `cd frontend && npx playwright test admin.spec.js`
Expected: all tests PASS. The ad hoc `appts` array in `'appointment filter narrows the visible list'` has no `consultation_type` field; `consultationTypeLabel()` returns `''` for `undefined`, so the `· Type` fragment is simply omitted rather than crashing or rendering something odd.

- [ ] **Step 4: Run the axe suite for `/admin`**

Run: `cd frontend && npx playwright test axe.spec.js -g "admin"`
Expected: PASS — this change adds no new form controls to Admin.js, only read-only display text, so there's nothing new to label.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Admin.js
git commit -m "feat(admin): show appointment consultation type"
```

---

### Task 5: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && ./.venv/Scripts/python -m pytest -v`
Expected: all tests PASS.

- [ ] **Step 2: Run the full frontend E2E suite**

Run: `cd frontend && npx playwright test`
Expected: all tests PASS, matching the existing baseline (187 passed / 2 pre-existing skips) with no new failures.

- [ ] **Step 3: Manual smoke test in a browser**

Using a locally running backend (local Mongo + scratch DB, dropped after) and frontend pointed at it:
1. Add a service to the cart, go to `/cart`. Confirm "Choose your slot" now shows a Consultation Type field alongside Location/Date/Time, and that submitting without picking one is blocked.
2. Book an Online consultation at Voorburg for some date/time. Then book an Offline one at the SAME location/date/time — expect both to succeed (independent modes).
3. On the Dashboard, reschedule one of them, change its consultation type, save, and confirm the card updates.
4. As admin, check the Appointments tab shows the consultation type next to the location on each row.

No commit for this task — it's verification only.
