import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { revealVariants } from '../../lib/motionVariants';

const Reveal = ({ children, delay = 0, y = 24, once = true, className, ...rest }) => {
  const reduced = useReducedMotion();
  const variants = revealVariants(reduced, y);
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      transition={{ delay: reduced ? 0 : delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
