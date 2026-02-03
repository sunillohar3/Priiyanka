import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const About = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-4">
            {language === 'en' ? 'About VD. Priyanka Singh' : 'Over VD. Priyanka Singh'}
          </h1>
          <p className="text-xl text-muted-foreground">
            B.A.M.S Ayurvedic Consultant
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          {language === 'en' ? (
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                VD. Priyanka Singh is a certified Ayurvedic consultant holding a Bachelor of Ayurvedic Medicine and Surgery (B.A.M.S) degree. With extensive training in traditional Ayurvedic medicine and holistic healing practices, she brings authentic Ayurvedic care to the Netherlands.
              </p>
              <p>
                As a registered member of LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten), Priyanka adheres to the highest standards of professional practice and ethical care. Her practice is officially registered with the Chamber of Commerce (KVK No: 98872109).
              </p>
              <p>
                Her expertise includes Panchakarma therapy, Ayurvedic massage techniques (Abhyanga), therapeutic body treatments, and personalized Ayurvedic consultations. She specializes in treating chronic conditions, stress-related disorders, and promoting overall wellness through natural, time-tested Ayurvedic methods.
              </p>
              <p>
                Priyanka's approach combines ancient Ayurvedic wisdom with modern understanding of health and wellness, offering personalized treatment plans tailored to each individual's unique constitution (Prakriti) and health concerns.
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                VD. Priyanka Singh is een gecertificeerde Ayurvedische consultant met een Bachelor of Ayurvedic Medicine and Surgery (B.A.M.S) graad. Met uitgebreide training in traditionele Ayurvedische geneeskunde en holistische genezingspraktijken, brengt ze authentieke Ayurvedische zorg naar Nederland.
              </p>
              <p>
                Als geregistreerd lid van LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten), houdt Priyanka zich aan de hoogste normen van professionele praktijk en ethische zorg. Haar praktijk is officieel geregistreerd bij de Kamer van Koophandel (KVK Nr: 98872109).
              </p>
              <p>
                Haar expertise omvat Panchakarma-therapie, Ayurvedische massagetechnieken (Abhyanga), therapeutische lichaamsbehandelingen en gepersonaliseerde Ayurvedische consulten. Ze is gespecialiseerd in de behandeling van chronische aandoeningen, stressgerelateerde stoornissen en het bevorderen van algemeen welzijn door middel van natuurlijke, beproefde Ayurvedische methoden.
              </p>
              <p>
                Priyanka's benadering combineert oude Ayurvedische wijsheid met modern begrip van gezondheid en welzijn, en biedt gepersonaliseerde behandelplannen afgestemd op de unieke constitutie (Prakriti) en gezondheidsproblemen van elk individu.
              </p>
            </div>
          )}
        </div>

        <div className="mt-16 bg-muted p-8 rounded-2xl">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
            {language === 'en' ? 'Qualifications & Certifications' : 'Kwalificaties & Certificeringen'}
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• B.A.M.S (Bachelor of Ayurvedic Medicine and Surgery)</li>
            <li>• LVNT Registered Therapist</li>
            <li>• KVK Registration: 98872109</li>
            <li>• Specialized in Panchakarma Therapy</li>
            <li>• Advanced Ayurvedic Massage Techniques</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;