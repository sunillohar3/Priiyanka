import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ShoppingCart, Clock, Euro } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import API from '../lib/api';

const Services = () => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
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
    addToCart(service);
    toast.success(
      language === 'en' 
        ? `Added ${service.name_en} to cart` 
        : `${service.name_nl} toegevoegd aan winkelwagen`
    );
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
                className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border group"
                data-testid={`service-card-${service.service_id}`}
              >
                {service.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={service.image_url} 
                      alt={language === 'en' ? service.name_en : service.name_nl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">
                    {language === 'en' ? service.name_en : service.name_nl}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {language === 'en' ? service.description_en : service.description_nl}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} {t('services.minutes')}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-primary text-lg">
                      <Euro className="w-5 h-5" />
                      <span>{service.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleAddToCart(service)}
                    className="w-full bg-primary text-primary-foreground hover:bg-secondary rounded-full"
                    data-testid={`add-to-cart-${service.service_id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t('services.addToCart')}
                  </Button>
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