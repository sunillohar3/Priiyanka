import React from 'react';
import Reveal from './Reveal';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <Reveal className="h-full">
    <div className="h-full bg-background p-8 rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {Icon && <Icon className="w-12 h-12 text-primary mb-4" aria-hidden="true" />}
      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </Reveal>
);

export default FeatureCard;
