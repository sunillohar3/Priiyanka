import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Terms = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">
          {language === 'en' ? 'Terms & Conditions' : 'Algemene Voorwaarden'}
        </h1>
        
        <div className="prose max-w-none text-muted-foreground leading-relaxed space-y-6">
          {language === 'en' ? (
            <>
              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Services</h2>
                <p>
                  Priiyanka's Nature Nest provides Ayurvedic consultations and treatments. All services are provided by VD. Priyanka Singh (B.A.M.S), a certified Ayurvedic consultant registered with LVNT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Booking & Payment</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Advance booking is recommended for all services</li>
                  <li>Payment is due at the time of service</li>
                  <li>Prices are in Euros and include applicable taxes</li>
                  <li>Some services may be eligible for health insurance reimbursement</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Cancellation Policy</h2>
                <p>
                  Appointments can be cancelled or rescheduled up to 24 hours before the scheduled time. Late cancellations may incur fees.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Disclaimer</h2>
                <p>
                  Information on this website should not be considered as professional medical advice. Always consult with a qualified healthcare provider for personalized medical guidance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Liability</h2>
                <p>
                  While we strive to provide the highest quality care, results may vary. Ayurvedic treatments are complementary therapies and should not replace conventional medical treatment when necessary.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Diensten</h2>
                <p>
                  Priiyanka's Nature Nest biedt Ayurvedische consulten en behandelingen. Alle diensten worden verleend door VD. Priyanka Singh (B.A.M.S), een gecertificeerde Ayurvedische consultant geregistreerd bij LVNT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Boeking & Betaling</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vooraf boeken wordt aanbevolen voor alle diensten</li>
                  <li>Betaling is verschuldigd op het moment van de dienst</li>
                  <li>Prijzen zijn in Euro's en inclusief toepasselijke belastingen</li>
                  <li>Sommige diensten komen mogelijk in aanmerking voor vergoeding door de zorgverzekeraar</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Annuleringsbeleid</h2>
                <p>
                  Afspraken kunnen tot 24 uur voor de geplande tijd worden geannuleerd of verzet. Late annuleringen kunnen kosten met zich meebrengen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Disclaimer</h2>
                <p>
                  Informatie op deze website mag niet worden beschouwd als professioneel medisch advies. Raadpleeg altijd een gekwalificeerde zorgverlener voor persoonlijke medische begeleiding.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">Aansprakelijkheid</h2>
                <p>
                  Hoewel we streven naar de hoogste kwaliteit van zorg, kunnen resultaten variëren. Ayurvedische behandelingen zijn complementaire therapieën en mogen conventionele medische behandeling niet vervangen wanneer dat nodig is.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terms;