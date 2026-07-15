import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ShoppingCart, Clock, Euro, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useSEO } from '../hooks/useSEO';
import { toast } from 'sonner';
import API from '../lib/api';

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
        <div className="text-center mb-16" data-testid="services-header">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-4">
            {t('services.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {language === 'en' ? 'No services available yet.' : 'Nog geen diensten beschikbaar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.service_id}
                className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border group flex flex-col h-full"
                data-testid={`service-card-${service.service_id}`}
              >
                {service.image_url && (
                  <div className="h-48 overflow-hidden flex-shrink-0">
                    <img
                      src={service.image_url}
                      alt={language === 'en' ? service.name_en : service.name_nl}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">
                    {language === 'en' ? service.name_en : service.name_nl}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {language === 'en' ? service.description_en : service.description_nl}
                  </p>

                  <div className="flex items-center gap-4 mb-6 mt-auto text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} {t('services.minutes')}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-primary text-lg">
                      <Euro className="w-5 h-5" />
                      <span>{service.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isInCart(service.service_id) ? (
                      <Button
                        disabled
                        className="flex-1 bg-secondary text-secondary-foreground rounded-full disabled:opacity-100"
                        data-testid={`in-cart-${service.service_id}`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'In cart' : 'In winkelwagen'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(service)}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-secondary rounded-full"
                        data-testid={`add-to-cart-${service.service_id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {t('services.addToCart')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;