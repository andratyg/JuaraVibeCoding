export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: "easeOut" }
} as any;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 }
} as any;

export const slideUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 32 },
  transition: { type: 'spring', damping: 26, stiffness: 300 }
} as any;

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } }
} as any;

export const cardHover = {
  whileHover: { scale: 1.015, transition: { duration: 0.15 } },
  whileTap: { scale: 0.985 }
} as any;

export const itemFadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 }
} as any;
