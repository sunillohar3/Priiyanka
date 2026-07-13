// Consent-gated Google Analytics (GA4) loader.
// The measurement ID comes from the build env (REACT_APP_GA_ID). If it's not
// set, analytics never loads and no consent banner is shown (there are then no
// non-essential cookies to consent to).

export const GA_ID = process.env.REACT_APP_GA_ID || '';

let loaded = false;

export function loadAnalytics() {
  if (loaded || !GA_ID || typeof window === 'undefined') return;
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  // anonymize_ip keeps it privacy-friendly for EU/GDPR.
  gtag('config', GA_ID, { anonymize_ip: true });
}
