import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const NotFound = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-7xl md:text-8xl font-heading font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground mb-3">
          {language === 'en' ? 'Page not found' : 'Pagina niet gevonden'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {language === 'en'
            ? "The page you're looking for doesn't exist or has moved."
            : 'De pagina die u zoekt bestaat niet of is verplaatst.'}
        </p>
        <Link to="/">
          <Button className="bg-primary text-primary-foreground hover:bg-secondary rounded-full px-8">
            <Home className="w-4 h-4 mr-2" />
            {language === 'en' ? 'Back to Home' : 'Terug naar Home'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
