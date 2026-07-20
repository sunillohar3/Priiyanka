import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerVariants } from '../../lib/motionVariants';

const Stagger = ({ children, stagger = 0.1, className, ...rest }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={staggerVariants(reduced, stagger)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Stagger;
