import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Contact = () => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-4">
            {t('contact.title')}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{t('contact.address')}</h3>
                  <p className="text-muted-foreground">
                    Frans Mortelmansstraat 68<br />
                    Voorburg, Netherlands
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{t('contact.phone')}</h3>
                  <a href="tel:+31623955935" className="text-muted-foreground hover:text-primary transition-colors">
                    +31 623955935
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{t('contact.email')}</h3>
                  <a href="mailto:priiyankasingh87@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                    priiyankasingh87@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{t('contact.hours')}</h3>
                  <div className="text-muted-foreground space-y-1">
                    <p>{t('contact.mondayFriday')}</p>
                    <p>{t('contact.saturday')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[600px] rounded-2xl overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2451.8!2d4.3608!3d52.0698!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDA0JzExLjMiTiA0wrAyMSczOS4xIkU!5e0!3m2!1sen!2snl!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Location Map"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;