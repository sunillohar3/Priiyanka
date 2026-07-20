import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Leaf, Clock, Shield, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import Section from '../components/common/Section';
import SectionHeading from '../components/common/SectionHeading';
import Stagger from '../components/common/Stagger';
import Reveal from '../components/common/Reveal';
import FeatureCard from '../components/common/FeatureCard';

const Home = () => {
  const { t, language } = useLanguage();

  useSEO(
    language === 'en'
      ? "Priiyanka's Nature Nest | Ayurvedic Wellness in Voorburg"
      : "Priiyanka's Nature Nest | Ayurvedische Wellness in Voorburg",
    language === 'en'
      ? 'Authentic Ayurvedic care, Panchakarma therapies and holistic consultations in Voorburg, Netherlands. LVNT-registered practitioner.'
      : 'Authentieke Ayurvedische zorg, Panchakarma-therapieën en holistische consulten in Voorburg, Nederland. LVNT-geregistreerd.'
  );

  const features = [
    {
      icon: Leaf,
      title: language === 'en' ? 'Authentic Ayurveda' : 'Authentieke Ayurveda',
      description: language === 'en' 
        ? 'Traditional treatments based on ancient wisdom'
        : 'Traditionele behandelingen gebaseerd op oude wijsheid'
    },
    {
      icon: Shield,
      title: language === 'en' ? 'LVNT Certified' : 'LVNT Gecertificeerd',
      description: language === 'en'
        ? 'Officially registered with LVNT Netherlands'
        : 'Officieel geregistreerd bij LVNT Nederland'
    },
    {
      icon: Clock,
      title: language === 'en' ? 'Flexible Booking' : 'Flexibel Boeken',
      description: language === 'en'
        ? 'Easy online booking and appointment management'
        : 'Eenvoudig online boeken en afspraakbeheer'
    },
    {
      icon: Heart,
      title: language === 'en' ? 'Holistic Care' : 'Holistische Zorg',
      description: language === 'en'
        ? 'Personalized treatments for body, mind and soul'
        : 'Persoonlijke behandelingen voor lichaam, geest en ziel'
    }
  ];

  return (
    <div className="min-h-screen">
      <section
        className="relative h-[80dvh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1685881050089-746db3e93938?crop=entropy&cs=srgb&fm=webp&w=1920&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGZvcmVzdCUyMHN1bmxpZ2h0JTIwbmF0dXJlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzAxMzI0NDN8MA&ixlib=rb-4.1.0&q=78)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <Reveal className="relative z-10 text-center px-6 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6">{t('hero.title')}</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">{t('hero.subtitle')}</p>
          <Link to="/services">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-12 py-6 text-lg shadow-2xl" data-testid="hero-cta-button">
              {t('hero.cta')}
            </Button>
          </Link>
        </Reveal>
      </section>

      <Section background="card">
        <SectionHeading
          eyebrow={language === 'en' ? 'Our Promise' : 'Onze Belofte'}
          title={language === 'en' ? 'Why Choose Us' : 'Waarom Voor Ons Kiezen'}
          subtitle={language === 'en'
            ? 'Experience authentic Ayurvedic care in the heart of the Netherlands'
            : 'Ervaar authentieke Ayurvedische zorg in het hart van Nederland'}
        />
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </Stagger>
      </Section>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-semibold text-foreground mb-6">
                {t('about.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {language === 'en'
                  ? 'VD. Priiyanka Singh is a certified Ayurvedic consultant (B.A.M.S) with extensive training in traditional Ayurvedic medicine. As a registered member of LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten), she brings authentic Ayurvedic healing practices to the Netherlands.'
                  : 'VD. Priiyanka Singh is een gecertificeerde Ayurvedische consultant (B.A.M.S) met uitgebreide training in traditionele Ayurvedische geneeskunde. Als geregistreerd lid van LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten) brengt ze authentieke Ayurvedische genezingspraktijken naar Nederland.'}
              </p>
              <Link to="/about">
                <Button variant="outline" className="rounded-full px-8">
                  {language === 'en' ? 'Learn More' : 'Meer Informatie'}
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/assets/profile.jpg"
                alt="VD. Priiyanka Singh - Ayurvedic Consultant"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>
    </div>
  );
};

export default Home;
