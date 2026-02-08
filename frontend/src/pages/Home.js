import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Leaf, Clock, Shield, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Home = () => {
  const { t, language } = useLanguage();

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
        className="relative h-[80vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1685881050089-746db3e93938?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGZvcmVzdCUyMHN1bmxpZ2h0JTIwbmF0dXJlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzAxMzI0NDN8MA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            {t('hero.subtitle')}
          </p>
          <Link to="/services">
            <Button 
              size="lg" 
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-12 py-6 text-lg shadow-2xl"
              data-testid="hero-cta-button"
            >
              {t('hero.cta')}
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-foreground mb-4">
              {language === 'en' ? 'Why Choose Us' : 'Waarom Voor Ons Kiezen'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Experience authentic Ayurvedic care in the heart of the Netherlands'
                : 'Ervaar authentieke Ayurvedische zorg in het hart van Nederland'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-background p-8 rounded-2xl border border-border hover:shadow-lg transition-shadow">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-semibold text-foreground mb-6">
                {t('about.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {language === 'en'
                  ? 'VD. Priyanka Singh is a certified Ayurvedic consultant (B.A.M.S) with extensive training in traditional Ayurvedic medicine. As a registered member of LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten), she brings authentic Ayurvedic healing practices to the Netherlands.'
                  : 'VD. Priyanka Singh is een gecertificeerde Ayurvedische consultant (B.A.M.S) met uitgebreide training in traditionele Ayurvedische geneeskunde. Als geregistreerd lid van LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten) brengt ze authentieke Ayurvedische genezingspraktijken naar Nederland.'}
              </p>
              <Link to="/about">
                <Button variant="outline" className="rounded-full px-8">
                  {language === 'en' ? 'Learn More' : 'Meer Informatie'}
                </Button>
              </Link>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://customer-assets.emergentagent.com/job_priiyanka-nature/artifacts/xt0dda6u_profile.jpg"
                alt="VD. Priyanka Singh - Ayurvedic Consultant"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;