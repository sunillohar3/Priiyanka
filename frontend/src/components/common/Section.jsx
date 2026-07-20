import React from 'react';
import { cn } from '../../lib/utils';

const BG = {
  default: '',
  card: 'bg-card',
  muted: 'bg-muted',
};

const Section = ({ as: Tag = 'section', background = 'default', id, className, innerClassName, children, ...rest }) => (
  <Tag id={id} className={cn('py-20 md:py-32', BG[background], className)} {...rest}>
    <div className={cn('max-w-7xl mx-auto px-6 md:px-12', innerClassName)}>{children}</div>
  </Tag>
);

export default Section;
