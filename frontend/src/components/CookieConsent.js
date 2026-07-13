import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { GA_ID, loadAnalytics } from '../lib/analytics';

const STORAGE_KEY = 'cookie_consent';

/**
 * GDPR cookie-consent banner. Only appears when analytics is configured
 * (GA_ID set) and the visitor hasn't chosen yet. Strictly-necessary cookies
 * (auth session) don't require consent, so the banner only gates analytics.
 */
const CookieConsent = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA_ID) return; // nothing non-essential to consent to
    const choice = localStorage.getItem(STORAGE_KEY);
    if (choice === 'accepted') {
      loadAnalytics();
    } else if (!choice) {
      setVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = (accepted) => {
    localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'rejected');
    if (accepted) loadAnalytics();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={language === 'en' ? 'Cookie consent' : 'Cookie toestemming'}
      className="fixed bottom-0 inset-x-0 z-[1000] bg-card border-t border-border shadow-2xl"
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          {language === 'en'
            ? 'We use analytics cookies to understand how the site is used and improve it. You can accept or decline. Essential cookies for login are always active.'
            : 'We gebruiken analytische cookies om te begrijpen hoe de site wordt gebruikt en deze te verbeteren. U kunt accepteren of weigeren. Essentiële cookies voor inloggen zijn altijd actief.'}{' '}
          <Link to="/privacy" className="underline hover:text-primary">
            {language === 'en' ? 'Privacy Policy' : 'Privacybeleid'}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => decide(false)} data-testid="cookie-decline">
            {language === 'en' ? 'Decline' : 'Weigeren'}
          </Button>
          <Button
            onClick={() => decide(true)}
            className="bg-primary text-primary-foreground hover:bg-secondary"
            data-testid="cookie-accept"
          >
            {language === 'en' ? 'Accept' : 'Accepteren'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
