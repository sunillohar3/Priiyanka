import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Award, BookOpen, Shield } from 'lucide-react';

const About = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-4">
            {language === 'en' ? 'About VD. Priyanka Singh' : 'Over VD. Priyanka Singh'}
          </h1>
          <p className="text-xl text-muted-foreground">
            B.A.M.S Ayurvedic Consultant
          </p>
        </div>

        {/* Profile Image Section */}
        <div className="flex justify-center mb-16">
          <div className="relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-4 border-primary shadow-2xl">
              <img 
                src="https://customer-assets.emergentagent.com/job_priiyanka-nature/artifacts/e6g6txgb_Media.jfif" 
                alt="VD. Priyanka Singh" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground px-6 py-3 rounded-full shadow-lg">
              <p className="font-bold text-sm">13+ Years Experience</p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <section className="bg-card p-8 rounded-2xl border border-border">
            <h2 className="text-3xl font-heading font-semibold text-foreground mb-6">
              {language === 'en' ? 'About Me' : 'Over Mij'}
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              {language === 'en' ? (
                <>
                  <p>
                    I am a highly qualified Ayurvedic Physician (BAMS) with over 13 years of hands-on clinical experience, specializing in holistic consultations, Panchakarma therapies, and lifestyle-based healing. Based in the Netherlands, I combine traditional Ayurvedic practice with knowledge of Dutch healthcare quality standards, documentation, and client-centered care.
                  </p>
                  <p>
                    My approach integrates holistic consultations (physical, mental, and lifestyle) with ethical, evidence-aware practices to ensure long-term wellness for my clients. I believe in treating the root cause of health issues rather than just managing symptoms, empowering each individual on their journey to optimal health.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Ik ben een hoogopgeleide Ayurvedische arts (BAMS) met meer dan 13 jaar hands-on klinische ervaring, gespecialiseerd in holistische consulten, Panchakarma-therapieën en levensstijlgerichte genezing. Gevestigd in Nederland, combineer ik traditionele Ayurvedische praktijk met kennis van Nederlandse zorgkwaliteitsnormen, documentatie en cliëntgerichte zorg.
                  </p>
                  <p>
                    Mijn aanpak integreert holistische consulten (fysiek, mentaal en levensstijl) met ethische, evidence-aware praktijken om langdurig welzijn voor mijn cliënten te waarborgen. Ik geloof in het behandelen van de grondoorzaak van gezondheidsproblemen in plaats van alleen symptomen te beheren, waardoor elk individu wordt gestimuleerd op hun reis naar optimale gezondheid.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="bg-muted p-8 rounded-2xl">
            <h2 className="text-3xl font-heading font-semibold text-foreground mb-6">
              {language === 'en' ? 'What is Ayurveda?' : 'Wat is Ayurveda?'}
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              {language === 'en' ? (
                <>
                  <p>
                    Ayurveda is a traditional system of medicine from India that promotes holistic health through a balance of body, mind, and spirit. It focuses on individualized treatment plans based on a person's unique constitution, known as Prakriti analysis.
                  </p>
                  <p>
                    By utilizing natural therapies, detoxification (Panchakarma), and lifestyle guidance, Ayurveda aims to prevent illness and treat the root cause of health issues. This ancient science of life has been practiced for over 5,000 years and continues to offer effective solutions for modern health challenges.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Ayurveda is een traditioneel geneeskundig systeem uit India dat holistische gezondheid bevordert door een evenwicht van lichaam, geest en ziel. Het richt zich op geïndividualiseerde behandelplannen op basis van iemands unieke constitutie, bekend als Prakriti-analyse.
                  </p>
                  <p>
                    Door gebruik te maken van natuurlijke therapieën, detoxificatie (Panchakarma) en levensstijlbegeleiding, heeft Ayurveda tot doel ziekte te voorkomen en de grondoorzaak van gezondheidsproblemen te behandelen. Deze oude levenswetenschap wordt al meer dan 5.000 jaar beoefend en blijft effectieve oplossingen bieden voor moderne gezondheidsuitdagingen.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-heading font-semibold text-foreground">
                {language === 'en' ? 'Professional Credentials & Compliance' : 'Professionele Kwalificaties & Compliance'}
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              {language === 'en' ? (
                <>
                  <p>
                    I am committed to maintaining high standards of care and compliance with EU/Dutch quality and hygiene standards.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-muted p-6 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Registrations</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• LVNT Registered Therapist</li>
                        <li>• RBCZ Registration</li>
                        <li>• KVK: 98872109</li>
                        <li>• VAT: NL005359083B24</li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted p-6 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Diplomas & Certifications</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• B.A.M.S (Bachelor of Ayurvedic Medicine and Surgery)</li>
                        <li>• MBK (Medische Basiskennis) - De Stichting Hoger Onderwijs, NL (17/12/2025)</li>
                        <li>• Good Clinical Laboratory Practice (GCLP) - Whitehall Training</li>
                        <li>• Good Distribution Practice (GDP) - Whitehall Training</li>
                        <li>• Corporate Sustainability and Reliability (CSR) - Cerba Healthcare Institute</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Ik ben toegewijd aan het handhaven van hoge zorgstandaarden en naleving van EU/Nederlandse kwaliteits- en hygiënenormen.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-muted p-6 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Registraties</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• LVNT Geregistreerde Therapeut</li>
                        <li>• RBCZ Registratie</li>
                        <li>• KVK: 98872109</li>
                        <li>• BTW: NL005359083B24</li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted p-6 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Diploma's & Certificeringen</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• B.A.M.S (Bachelor of Ayurvedic Medicine and Surgery)</li>
                        <li>• MBK (Medische Basiskennis) - De Stichting Hoger Onderwijs, NL (17/12/2025)</li>
                        <li>• Good Clinical Laboratory Practice (GCLP) - Whitehall Training</li>
                        <li>• Good Distribution Practice (GDP) - Whitehall Training</li>
                        <li>• Corporate Sustainability and Reliability (CSR) - Cerba Healthcare Institute</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="bg-primary/5 p-8 rounded-2xl border-2 border-primary/20">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              {language === 'en' ? 'My Approach' : 'Mijn Aanpak'}
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              {language === 'en' ? (
                <>
                  <p>✓ Holistic assessment of body, mind, and lifestyle</p>
                  <p>✓ Personalized treatment plans based on individual constitution (Prakriti)</p>
                  <p>✓ Integration of traditional wisdom with modern healthcare standards</p>
                  <p>✓ Focus on root cause treatment, not just symptom management</p>
                  <p>✓ Ethical, evidence-aware, and client-centered care</p>
                </>
              ) : (
                <>
                  <p>✓ Holistische beoordeling van lichaam, geest en levensstijl</p>
                  <p>✓ Gepersonaliseerde behandelplannen op basis van individuele constitutie (Prakriti)</p>
                  <p>✓ Integratie van traditionele wijsheid met moderne zorgstandaarden</p>
                  <p>✓ Focus op behandeling van de grondoorzaak, niet alleen symptoombeheersing</p>
                  <p>✓ Ethische, evidence-aware en cliëntgerichte zorg</p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;