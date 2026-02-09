import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Suggestions = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">
          {language === 'en' ? 'Suggestions & Feedback' : 'Suggesties & Feedback'}
        </h1>
        
        <div className="prose max-w-none text-muted-foreground leading-relaxed space-y-6">
          {language === 'en' ? (
            <>
              <section>
                <p>
                  At Priiyanka's Nature Nest, we strive to provide the highest quality of care and continuously improve our services. Your feedback and suggestions are invaluable to us in achieving this goal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Share Your Thoughts</h2>
                <p>
                  We welcome your suggestions, feedback, and ideas to help us enhance your experience. You can share your thoughts:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>In person during your appointment</li>
                  <li>By phone: +31 623955935</li>
                  <li>By email: priiyankasingh87@gmail.com</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">What We Value</h2>
                <p>
                  Your input helps us:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Improve our treatment quality and service delivery</li>
                  <li>Better understand your needs and preferences</li>
                  <li>Develop new services that benefit our community</li>
                  <li>Enhance your overall wellness experience</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Our Response</h2>
                <p>
                  All feedback and suggestions are:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Carefully reviewed and considered</li>
                  <li>Acknowledged within 5 business days</li>
                  <li>Used to continuously improve our services</li>
                  <li>Treated with confidentiality and respect</li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <section>
                <p>
                  Bij Priiyanka's Nature Nest streven we naar de hoogste kwaliteit van zorg en verbeteren we onze diensten voortdurend. Uw feedback en suggesties zijn van onschatbare waarde om dit doel te bereiken.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Deel Uw Gedachten</h2>
                <p>
                  We verwelkomen uw suggesties, feedback en ideeen om uw ervaring te verbeteren. U kunt uw gedachten delen:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Persoonlijk tijdens uw afspraak</li>
                  <li>Per telefoon: +31 623955935</li>
                  <li>Per e-mail: priiyankasingh87@gmail.com</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Wat Wij Waarderen</h2>
                <p>
                  Uw input helpt ons:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Onze behandelkwaliteit en dienstverlening te verbeteren</li>
                  <li>Uw behoeften en voorkeuren beter te begrijpen</li>
                  <li>Nieuwe diensten te ontwikkelen die onze gemeenschap ten goede komen</li>
                  <li>Uw algehele wellness-ervaring te verbeteren</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Onze Reactie</h2>
                <p>
                  Alle feedback en suggesties worden:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Zorgvuldig beoordeeld en overwogen</li>
                  <li>Binnen 5 werkdagen bevestigd</li>
                  <li>Gebruikt om onze diensten voortdurend te verbeteren</li>
                  <li>Behandeld met vertrouwelijkheid en respect</li>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Suggestions;