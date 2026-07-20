import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerVariants } from '../../lib/motionVariants';
import { StaggerContext } from './staggerContext';

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
      <StaggerContext.Provider value={true}>{children}</StaggerContext.Provider>
    </motion.div>
  );
};

export default Stagger;
