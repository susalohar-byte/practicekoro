import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Slides up and fades in. Used by RevealItem and by anything that reveals on its own. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

type DivProps = HTMLMotionProps<'div'>;

/** Reveals its children once, as it scrolls into view. */
export const Reveal: React.FC<DivProps & { variants?: Variants; delay?: number }> = ({
  variants = fadeUp,
  delay = 0,
  transition,
  ...props
}) => (
  <motion.div
    variants={variants}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.25 }}
    transition={delay ? { delay, ...transition } : transition}
    {...props}
  />
);

/** A grid or list whose RevealItem children come in one after another. */
export const RevealGroup: React.FC<DivProps & { stagger?: number; as?: 'div' | 'ol' }> = ({
  stagger = 0.09,
  as = 'div',
  ...props
}) => {
  const Component = as === 'ol' ? motion.ol : motion.div;
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      {...(props as object)}
    />
  );
};

/** Lift on hover, used by the cards. */
export const hoverLift = {
  whileHover: { y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  whileTap: { scale: 0.98 },
} as const;
