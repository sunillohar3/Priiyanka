import React from 'react';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';

const SectionHeading = ({ eyebrow, title, subtitle, align = 'center', as: Tag = 'h2', className }) => (
  <Reveal className={cn(align === 'center' ? 'text-center mx-auto' : 'text-left', 'max-w-2xl mb-12 md:mb-16', className)}>
    {eyebrow && (
      <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-3">{eyebrow}</p>
    )}
    <Tag className="text-4xl md:text-5xl font-heading font-semibold text-foreground tracking-tight">{title}</Tag>
    {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
  </Reveal>
);

export default SectionHeading;
