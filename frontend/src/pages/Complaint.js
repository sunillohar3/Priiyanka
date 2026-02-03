import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Complaint = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">
          {language === 'en' ? 'Complaint Procedure' : 'Klachtenprocedure'}
        </h1>
        
        <div className="prose max-w-none text-muted-foreground leading-relaxed space-y-6">
          {language === 'en' ? (
            <>
              <section>
                <p>
                  At Priiyanka's Nature Nest, we strive to provide the highest quality of care. If you have any concerns or complaints about our services, we encourage you to let us know.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">How to Submit a Complaint</h2>
                <p>
                  You can submit a complaint:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>In person during your appointment</li>
                  <li>By phone: +31 623955935</li>
                  <li>By email: priiyankasingh87@gmail.com</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Complaint Handling</h2>
                <p>
                  All complaints are taken seriously and will be:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acknowledged within 5 business days</li>
                  <li>Investigated thoroughly and objectively</li>
                  <li>Responded to within 4 weeks</li>
                  <li>Documented in accordance with legal requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">External Dispute Resolution</h2>
                <p>
                  As a member of LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten), we adhere to professional standards and are subject to their dispute resolution procedures.
                </p>
                <p className="mt-4">
                  Under the Quality, Complaints and Disputes Care Act (Wkkgz), you have the right to file a complaint with the relevant healthcare complaints committee if you are not satisfied with our response.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Professional Registration</h2>
                <p>
                  VD. Priyanka Singh is registered with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten)</li>
                  <li>Chamber of Commerce (KVK): 98872109</li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <section>
                <p>
                  Bij Priiyanka's Nature Nest streven we naar de hoogste kwaliteit van zorg. Als u zorgen of klachten heeft over onze diensten, moedigen we u aan om dit met ons te delen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Hoe een Klacht Indienen</h2>
                <p>
                  U kunt een klacht indienen:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Persoonlijk tijdens uw afspraak</li>
                  <li>Per telefoon: +31 623955935</li>
                  <li>Per e-mail: priiyankasingh87@gmail.com</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Klachtenbehandeling</h2>
                <p>
                  Alle klachten worden serieus genomen en zullen:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Binnen 5 werkdagen worden bevestigd</li>
                  <li>Grondig en objectief worden onderzocht</li>
                  <li>Binnen 4 weken worden beantwoord</li>
                  <li>Worden gedocumenteerd volgens wettelijke vereisten</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Externe Geschillenbeslechting</h2>
                <p>
                  Als lid van LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten), houden wij ons aan professionele normen en zijn we onderworpen aan hun geschillenbeslechtingsprocedures.
                </p>
                <p className="mt-4">
                  Onder de Wet kwaliteit, klachten en geschillen zorg (Wkkgz) heeft u het recht om een klacht in te dienen bij de relevante klachtencommissie voor de gezondheidszorg als u niet tevreden bent met onze reactie.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Professionele Registratie</h2>
                <p>
                  VD. Priyanka Singh is geregistreerd bij:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>LVNT (Landelijke Vereniging Natuurgeneeskundig Therapeuten)</li>
                  <li>Kamer van Koophandel (KVK): 98872109</li>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Complaint;