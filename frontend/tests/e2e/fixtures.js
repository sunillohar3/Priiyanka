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

module.exports = { stubBackend, stubAuth, seedCart, SERVICES, USER };
