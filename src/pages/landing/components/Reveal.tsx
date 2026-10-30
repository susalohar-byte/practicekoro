import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

// Start a little before the block scrolls in (bottom margin), so a fast scroll
// never lands on an empty section still waiting to animate.
const VIEWPORT = { once: true, amount: 0, margin: '0px 0px 15% 0px' } as const;

/** Slides up and fades in. Used by RevealItem and by anything that reveals on its own. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
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
    viewport={VIEWPORT}
    transition={delay ? { delay, ...transition } : transition}
    {...props}
  />
);

/** A grid or list whose RevealItem children come in one after another. */
export const RevealGroup: React.FC<DivProps & { stagger?: number; as?: 'div' | 'ol' }> = ({
  stagger = 0.06,
  as = 'div',
  ...props
}) => {
  const Component = as === 'ol' ? motion.ol : motion.div;
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
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
