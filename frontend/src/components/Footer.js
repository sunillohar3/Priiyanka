import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Priiyanka's Nature Nest</h3>
            <p className="text-sm text-primary-foreground/80 italic">"Where Nature Nurtures You"</p>
            <p className="text-sm text-primary-foreground/80 mt-4">
              VD. Priyanka Singh<br />
              B.A.M.S Ayurvedic Consultant
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link to="/about" className="block hover:text-accent transition-colors">{t('footer.about')}</Link>
              <Link to="/services" className="block hover:text-accent transition-colors">{t('footer.services')}</Link>
              <Link to="/contact" className="block hover:text-accent transition-colors">{t('footer.contact')}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal & Compliance</h4>
            <div className="space-y-2 text-sm">
              <Link to="/privacy" className="block hover:text-accent transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="block hover:text-accent transition-colors">{t('footer.terms')}</Link>
              <Link to="/complaint" className="block hover:text-accent transition-colors">{t('footer.complaint')}</Link>
              <p className="text-primary-foreground/80 mt-4">KVK No: 98872109</p>
              <p className="text-primary-foreground/80">LVNT Member</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <p>Frans Mortelmansstraat 68<br />Voorburg, Netherlands</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+31623955935" className="hover:text-accent">+31 623955935</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:priiyankasingh87@gmail.com" className="hover:text-accent">priiyankasingh87@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/80">
          <p>© {new Date().getFullYear()} Priiyanka's Nature Nest. {t('footer.rights')}.</p>
          <p className="mt-2">Compliant with LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten) regulations.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;