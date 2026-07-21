import React, { useContext } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { revealVariants } from '../../lib/motionVariants';
import { StaggerContext } from './staggerContext';

const Reveal = ({ children, delay = 0, y = 24, once = true, className, ...rest }) => {
  const reduced = useReducedMotion();
  const inStagger = useContext(StaggerContext);
  const variants = revealVariants(reduced, y);

  if (inStagger) {
    return (
      <motion.div className={className} variants={variants} {...rest}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0 }}
      transition={{ delay: reduced ? 0 : delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
