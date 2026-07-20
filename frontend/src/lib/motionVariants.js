// Pure, reduced-motion-aware Framer Motion variant factories.
// When `reduced` is true, elements are fully visible and static — no motion.
export function revealVariants(reduced, y = 24) {
  if (reduced) return { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };
  return {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
}

export function staggerVariants(reduced, stagger = 0.1) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : stagger } },
  };
}
