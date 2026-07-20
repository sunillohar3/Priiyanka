import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useSEO } from '../hooks/useSEO';
import { toast } from 'sonner';
import API from '../lib/api';
import SectionHeading from '../components/common/SectionHeading';
import Stagger from '../components/common/Stagger';
import ServiceCard from '../components/common/ServiceCard';

const Services = () => {
  const { t, language } = useLanguage();
  const { addToCart, isInCart } = useCart();

  useSEO(
    language === 'en'
      ? "Services & Treatments | Priiyanka's Nature Nest"
      : "Diensten & Behandelingen | Priiyanka's Nature Nest",
    language === 'en'
      ? 'Ayurvedic consultations, Abhyanga massage, Panchakarma detox, and therapeutic treatments in Voorburg.'
      : 'Ayurvedische consulten, Abhyanga-massage, Panchakarma-detox en therapeutische behandelingen in Voorburg.'
  );
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (service) => {
    const added = addToCart(service);
    if (added) {
      toast.success(
        language === 'en'
          ? `Added ${service.name_en} to cart`
          : `${service.name_nl} toegevoegd aan winkelwagen`
      );
    } else {
      toast.info(
        language === 'en'
          ? `${service.name_en} is already in your cart`
          : `${service.name_nl} staat al in uw winkelwagen`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div data-testid="services-header">
          <SectionHeading
            as="h1"
            eyebrow={language === 'en' ? 'Treatments' : 'Behandelingen'}
            title={t('services.title')}
            subtitle={t('services.subtitle')}
            className="mb-12"
          />
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {language === 'en' ? 'No services available yet.' : 'Nog geen diensten beschikbaar.'}
            </p>
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service.service_id} service={service} language={language} t={t}
                isInCart={isInCart} onAdd={handleAddToCart} />
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
};

export default Services;