import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../lib/api';

const Contact = () => {
  const { t, language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  useSEO(
    language === 'en'
      ? "Contact | Priiyanka's Nature Nest, Voorburg"
      : "Contact | Priiyanka's Nature Nest, Voorburg",
    language === 'en'
      ? 'Get in touch to book an Ayurvedic consultation or treatment in Voorburg. Address, phone, email and enquiry form.'
      : 'Neem contact op voor een Ayurvedisch consult of behandeling in Voorburg. Adres, telefoon, e-mail en contactformulier.'
  );
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, form);
      toast.success(t('contact.formSuccess'));
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact submit error:', error);
      toast.error(t('contact.formError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-4">
            {t('contact.title')}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Inquiry form */}
          <div className="bg-card p-8 rounded-2xl border border-border">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
              {t('contact.formHeading')}
            </h2>
            <p className="text-muted-foreground mb-6">{t('contact.formIntro')}</p>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">
                    {t('contact.formName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">
                    {t('contact.formEmail')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{t('contact.formPhone')}</Label>
                  <Input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">{t('contact.formSubject')}</Label>
                  <Input
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">
                  {t('contact.formMessage')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                  maxLength={5000}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground hover:bg-secondary rounded-full"
                data-testid="contact-submit"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    {t('contact.formSending')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t('contact.formSend')}
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Contact details */}
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
        </div>

        <div className="h-[450px] rounded-2xl overflow-hidden border border-border">
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
  );
};

export default Contact;
