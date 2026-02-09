import React, { createContext, useContext, useState } from 'react';

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
      title: 'About VD. Priyanka Singh',
      subtitle: 'B.A.M.S Ayurvedic Consultant'
    },
    contact: {
      title: 'Contact Us',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      hours: 'Operating Hours',
      mondayFriday: 'Monday - Friday: 13:00 - 18:00',
      saturday: 'Saturday: 10:00 - 13:00'
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
      title: 'Over VD. Priyanka Singh',
      subtitle: 'B.A.M.S Ayurvedische Consultant'
    },
    contact: {
      title: 'Contact',
      address: 'Adres',
      phone: 'Telefoon',
      email: 'E-mail',
      hours: 'Openingstijden',
      mondayFriday: 'Maandag - Vrijdag: 13:00 - 18:00',
      saturday: 'Zaterdag: 10:00 - 13:00'
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
      complaint: 'Klachtenprocedure',
      rights: 'Alle rechten voorbehouden'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('nl');

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