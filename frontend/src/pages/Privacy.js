import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Privacy = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">
          {language === 'en' ? 'Privacy Policy' : 'Privacybeleid'}
        </h1>
        
        <div className="prose max-w-none text-muted-foreground leading-relaxed space-y-6">
          {language === 'en' ? (
            <>
              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Data Collection</h2>
                <p>
                  Priiyanka's Nature Nest collects personal information necessary for providing Ayurvedic treatments and services. This includes name, contact details, health information, and appointment data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Data Usage</h2>
                <p>
                  Your personal data is used solely for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing Ayurvedic consultations and treatments</li>
                  <li>Managing appointments and bookings</li>
                  <li>Communicating about your treatments</li>
                  <li>Maintaining medical records as required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal data. All data is stored securely and accessed only by authorized personnel.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Your Rights</h2>
                <p>
                  Under GDPR, you have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to data processing</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Cookies</h2>
                <p>
                  Our website uses essential cookies for authentication and functionality. We use technical cookies that do not require consent under the Telecommunications Act.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Contact</h2>
                <p>
                  For privacy-related questions, contact us at: priiyankasingh87@gmail.com
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Gegevensverzameling</h2>
                <p>
                  Priiyanka's Nature Nest verzamelt persoonlijke informatie die nodig is voor het verstrekken van Ayurvedische behandelingen en diensten. Dit omvat naam, contactgegevens, gezondheidsinformatie en afspraakgegevens.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Gegevensgebruik</h2>
                <p>
                  Uw persoonlijke gegevens worden uitsluitend gebruikt voor:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Het verstrekken van Ayurvedische consulten en behandelingen</li>
                  <li>Het beheren van afspraken en boekingen</li>
                  <li>Communicatie over uw behandelingen</li>
                  <li>Het bijhouden van medische dossiers zoals wettelijk vereist</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Gegevensbeveiliging</h2>
                <p>
                  We implementeren passende technische en organisatorische maatregelen om uw persoonlijke gegevens te beschermen. Alle gegevens worden veilig opgeslagen en alleen toegankelijk voor geautoriseerd personeel.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Uw Rechten</h2>
                <p>
                  Onder de AVG heeft u het recht om:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Toegang tot uw persoonlijke gegevens</li>
                  <li>Onjuiste gegevens te corrigeren</li>
                  <li>Verwijdering van uw gegevens te verzoeken</li>
                  <li>Bezwaar te maken tegen gegevensverwerking</li>
                  <li>Gegevensportabiliteit</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Cookies</h2>
                <p>
                  Onze website gebruikt essentiële cookies voor authenticatie en functionaliteit. We gebruiken technische cookies die geen toestemming vereisen onder de Telecommunicatiewet.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Contact</h2>
                <p>
                  Voor privacygerelateerde vragen, neem contact met ons op via: priiyankasingh87@gmail.com
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Privacy;