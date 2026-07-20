import React from 'react';
import { ShoppingCart, Clock, Euro, Check } from 'lucide-react';
import { Button } from '../ui/button';
import Reveal from './Reveal';

const ServiceCard = ({ service, language, t, isInCart, onAdd }) => {
  const name = language === 'en' ? service.name_en : service.name_nl;
  const description = language === 'en' ? service.description_en : service.description_nl;
  return (
    <Reveal className="h-full">
      <div
        className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-border group flex flex-col h-full"
        data-testid={`service-card-${service.service_id}`}
      >
        {service.image_url && (
          <div className="h-48 overflow-hidden flex-shrink-0">
            <img src={service.image_url} alt={name} loading="lazy" decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">{name}</h3>
          <p className="text-muted-foreground mb-6">{description}</p>
          <div className="flex items-center gap-4 mb-6 mt-auto text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{service.duration} {t('services.minutes')}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary text-lg">
              <Euro className="w-5 h-5" aria-hidden="true" />
              <span>{service.price.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isInCart(service.service_id) ? (
              <Button disabled className="flex-1 bg-secondary text-secondary-foreground rounded-full disabled:opacity-100" data-testid={`in-cart-${service.service_id}`}>
                <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                {language === 'en' ? 'In cart' : 'In winkelwagen'}
              </Button>
            ) : (
              <Button onClick={() => onAdd(service)} className="flex-1 bg-primary text-primary-foreground hover:bg-secondary rounded-full" data-testid={`add-to-cart-${service.service_id}`}>
                <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('services.addToCart')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
};

export default ServiceCard;
