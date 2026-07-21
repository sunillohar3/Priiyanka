// Deterministic backend stubs so E2E runs without the Python backend.
const SERVICES = [
  { service_id: 'svc-consult', name_en: 'Ayurvedic Consultation', name_nl: 'Ayurvedisch Consult',
    description_en: 'Comprehensive assessment of your body constitution (Prakriti).',
    description_nl: 'Uitgebreide beoordeling van uw lichaamsconstitutie (Prakriti).',
    price: 65, duration: 60, image_url: '', display_order: 1 },
  { service_id: 'svc-abhyanga', name_en: 'Abhyanga Massage', name_nl: 'Abhyanga Massage',
    description_en: 'Full body traditional Ayurvedic oil massage.',
    description_nl: 'Traditionele Ayurvedische oliemassage voor het hele lichaam.',
    price: 80, duration: 60, image_url: '', display_order: 2 },
];

const USER = { id: 'u-test', email: 'test@example.com', name: 'Test User', role: 'client' };

async function stubBackend(page) {
  await page.route('**/api/services', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SERVICES) }));
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.route('**/api/appointments', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, appointment_id: 'appt-1' }) }));
  // Default: unauthenticated. Call stubAuth(page) AFTER this to override /auth/me.
  await page.route('**/api/auth/**', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'unauthenticated' }) }));
}

// Registered AFTER stubBackend so it takes precedence for /auth/me (most-recent route wins).
async function stubAuth(page, user = USER) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
}

// Seed the cart (localStorage) before the app loads. Items match SERVICES shape + quantity.
async function seedCart(page, items = [{ ...SERVICES[0], quantity: 1 }]) {
  await page.addInitScript((data) => {
    localStorage.setItem('cart', JSON.stringify(data));
  }, items);
}

const ADMIN = { id: 'u-admin', email: 'admin@example.com', name: 'Admin User', role: 'admin', email_verified: true };

const APPOINTMENTS = [
  { appointment_id: 'appt-1', booking_date: '2030-01-02', booking_time: '10:00',
    items: [{ name: 'Ayurvedic Consultation' }], total_amount: 65, status: 'pending' },
];

const ADMIN_USERS = [ { id: 'u-admin', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
                      { id: 'u-1', email: 'client@example.com', name: 'Client One', role: 'client' } ];
const ADMIN_MESSAGES = [ { id: 'm-1', name: 'Jane', email: 'jane@example.com', subject: 'Hi', message: 'Question', status: 'new' } ];
const BLOCKED_SLOTS = [];

async function stubAdmin(page) {
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/appointments', (r) => r.fulfill(json(APPOINTMENTS)));
  await page.route('**/api/appointments/*/cancel', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/appointments/*/reschedule', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/appointments/*/status', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/admin/users', (r) => r.fulfill(json(ADMIN_USERS)));
  await page.route('**/api/admin/contact', (r) => r.fulfill(json(ADMIN_MESSAGES)));
  await page.route('**/api/admin/contact/*', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/admin/blocked-slots', (r) => r.fulfill(json(BLOCKED_SLOTS)));
  await page.route('**/api/admin/blocked-slots/*', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/admin/services/reorder', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/services/*', (r) => r.fulfill(json({ ok: true }))); // PUT/DELETE single service
  await page.route('**/api/auth/resend-verification', (r) => r.fulfill(json({ ok: true })));
  // NOTE: `**/api/services` (list) is stubbed by stubBackend; call stubBackend first.
}

module.exports = { stubBackend, stubAuth, seedCart, stubAdmin, SERVICES, USER, ADMIN, APPOINTMENTS };
