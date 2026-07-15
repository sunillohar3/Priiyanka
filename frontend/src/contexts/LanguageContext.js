import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    nav: {
      home: 'Home',
      services: 'Services',
      about: 'About',
      contact: 'Contact',
      cart: 'Cart',
      login: 'Login',
      dashboard: 'Dashboard',
      admin: 'Admin',
      logout: 'Logout'
    },
    hero: {
      title: 'Where Nature Nurtures You',
      subtitle: 'Experience authentic Ayurvedic wellness in the Netherlands',
      cta: 'Book Now'
    },
    services: {
      title: 'Our Services',
      subtitle: 'Traditional Ayurvedic treatments for holistic well-being',
      addToCart: 'Add to Cart',
      bookNow: 'Book Now',
      duration: 'Duration',
      price: 'Price',
      minutes: 'min'
    },
    about: {
      title: 'About VD. Priiyanka Singh',
      subtitle: 'B.A.M.S Ayurvedic Consultant'
    },
    contact: {
      title: 'Contact Us',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      hours: 'Operating Hours',
      mondayFriday: 'Monday - Friday: 13:00 - 18:00',
      saturday: 'Saturday: 10:00 - 13:00',
      locationsHeading: 'Our Locations',
      loc1Name: 'Voorburg',
      loc2Name: 'The Hague Natural Health Centre',
      loc2Hours: 'Tuesday & Thursday: 10:00 - 17:00',
      formHeading: 'Send us a message',
      formIntro: 'Have a question or want to book a consultation? Fill in the form and we will get back to you within 2 business days.',
      formName: 'Name',
      formEmail: 'Email',
      formPhone: 'Phone (optional)',
      formSubject: 'Subject',
      formMessage: 'Message',
      formSend: 'Send Message',
      formSending: 'Sending...',
      formSuccess: 'Thank you! Your message has been sent. We will get back to you soon.',
      formError: 'Something went wrong. Please try again or email us directly.'
    },
    cart: {
      title: 'Your Cart',
      empty: 'Your cart is empty',
      total: 'Total',
      checkout: 'Checkout',
      continueShopping: 'Continue Shopping',
      remove: 'Remove'
    },
    booking: {
      title: 'Book Appointment',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      notes: 'Additional Notes',
      submit: 'Book Appointment'
    },
    footer: {
      about: 'About',
      services: 'Services',
      contact: 'Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      suggestions: 'Suggestions',
      rights: 'All rights reserved'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      loginDescription: 'Enter your credentials to access your account',
      continueLogin: 'Continue'
    }
  },
  nl: {
    nav: {
      home: 'Home',
      services: 'Diensten',
      about: 'Over Ons',
      contact: 'Contact',
      cart: 'Winkelwagen',
      login: 'Inloggen',
      dashboard: 'Dashboard',
      admin: 'Admin',
      logout: 'Uitloggen'
    },
    hero: {
      title: 'Waar de Natuur Je Koestert',
      subtitle: 'Ervaar authentieke Ayurvedische wellness in Nederland',
      cta: 'Nu Boeken'
    },
    services: {
      title: 'Onze Diensten',
      subtitle: 'Traditionele Ayurvedische behandelingen voor holistisch welzijn',
      addToCart: 'Toevoegen aan Winkelwagen',
      bookNow: 'Nu Boeken',
      duration: 'Duur',
      price: 'Prijs',
      minutes: 'min'
    },
    about: {
      title: 'Over VD. Priiyanka Singh',
      subtitle: 'B.A.M.S Ayurvedische Consultant'
    },
    contact: {
      title: 'Contact',
      address: 'Adres',
      phone: 'Telefoon',
      email: 'E-mail',
      hours: 'Openingstijden',
      mondayFriday: 'Maandag - Vrijdag: 13:00 - 18:00',
      saturday: 'Zaterdag: 10:00 - 13:00',
      locationsHeading: 'Onze Locaties',
      loc1Name: 'Voorburg',
      loc2Name: 'The Hague Natural Health Centre',
      loc2Hours: 'Dinsdag & Donderdag: 10:00 - 17:00',
      formHeading: 'Stuur ons een bericht',
      formIntro: 'Heeft u een vraag of wilt u een consult boeken? Vul het formulier in en wij nemen binnen 2 werkdagen contact met u op.',
      formName: 'Naam',
      formEmail: 'E-mail',
      formPhone: 'Telefoon (optioneel)',
      formSubject: 'Onderwerp',
      formMessage: 'Bericht',
      formSend: 'Bericht Versturen',
      formSending: 'Versturen...',
      formSuccess: 'Bedankt! Uw bericht is verzonden. We nemen spoedig contact met u op.',
      formError: 'Er ging iets mis. Probeer het opnieuw of e-mail ons rechtstreeks.'
    },
    cart: {
      title: 'Uw Winkelwagen',
      empty: 'Uw winkelwagen is leeg',
      total: 'Totaal',
      checkout: 'Afrekenen',
      continueShopping: 'Verder Winkelen',
      remove: 'Verwijderen'
    },
    booking: {
      title: 'Afspraak Maken',
      selectDate: 'Selecteer Datum',
      selectTime: 'Selecteer Tijd',
      notes: 'Aanvullende Opmerkingen',
      submit: 'Boek Afspraak'
    },
    footer: {
      about: 'Over Ons',
      services: 'Diensten',
      contact: 'Contact',
      privacy: 'Privacybeleid',
      terms: 'Algemene Voorwaarden',
      suggestions: 'Suggesties',
      rights: 'Alle rechten voorbehouden'
    },
    auth: {
      login: 'Inloggen',
      register: 'Registreren',
      email: 'E-mail',
      password: 'Wachtwoord',
      name: 'Naam',
      loginDescription: 'Voer uw gegevens in om toegang te krijgen tot uw account',
      continueLogin: 'Doorgaan'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    return saved === 'en' || saved === 'nl' ? saved : 'en';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try { localStorage.setItem('language', lang); } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};