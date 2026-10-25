import React from 'react';
import { motion } from 'motion/react';

/*
 * Three friends studying together at one table, drawn in SVG and looped with motion so the
 * banner plays like a short video: they bob and blink, one raises a hand, chat bubbles pop
 * up, and a quiz card above them lights up the right answer.
 */

const loop = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  ease: 'easeInOut' as const,
});

interface StudentProps {
  x: number;
  y: number;
  skin: string;
  hoodie: string;
  hoodieShade: string;
  hair: 'short' | 'long' | 'curly';
  delay: number;
  raisesHand?: boolean;
}

const Student: React.FC<StudentProps> = ({ x, y, skin, hoodie, hoodieShade, hair, delay, raisesHand }) => (
  <motion.g animate={{ y: [0, -4, 0] }} transition={loop(3.2, delay)}>
    {/* Raised arm sits behind the body */}
    {raisesHand && (
      <motion.g
        style={{ originX: `${x + 40}px`, originY: `${y + 70}px` }}
        animate={{ rotate: [0, -8, 0, -8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, delay: 1 }}
      >
        <path d={`M${x + 40} ${y + 70} L${x + 66} ${y - 6}`} stroke={hoodie} strokeWidth="20" strokeLinecap="round" />
        <circle cx={x + 68} cy={y - 14} r="11" fill={skin} />
      </motion.g>
    )}
    {/* Body */}
    <path
      d={`M${x - 58} ${y + 150} C${x - 58} ${y + 80} ${x - 40} ${y + 50} ${x} ${y + 50} C${x + 40} ${y + 50} ${x + 58} ${y + 80} ${x + 58} ${y + 150} Z`}
      fill={hoodie}
    />
    <path d={`M${x - 20} ${y + 52} Q${x} ${y + 74} ${x + 20} ${y + 52}`} fill={hoodieShade} />
    {/* Neck and head */}
    <rect x={x - 9} y={y + 30} width="18" height="24" rx="8" fill={skin} />
    <circle cx={x} cy={y} r="32" fill={skin} />
    {hair === 'short' && <path d={`M${x - 33} ${y - 2} C${x - 34} ${y - 40} ${x + 34} ${y - 44} ${x + 33} ${y - 4} C${x + 20} ${y - 22} ${x - 12} ${y - 24} ${x - 33} ${y - 2} Z`} fill="#1F1A17" />}
    {hair === 'curly' && (
      <g fill="#1F1A17">
        <path d={`M${x - 34} ${y} C${x - 38} ${y - 42} ${x + 38} ${y - 46} ${x + 34} ${y - 2} C${x + 22} ${y - 20} ${x - 14} ${y - 24} ${x - 34} ${y} Z`} />
        {[-24, -10, 6, 20].map((dx) => (
          <circle key={dx} cx={x + dx} cy={y - 30} r="10" />
        ))}
      </g>
    )}
    {hair === 'long' && (
      <path
        d={`M${x - 35} ${y + 34} C${x - 44} ${y - 10} ${x - 30} ${y - 44} ${x} ${y - 40} C${x + 30} ${y - 44} ${x + 44} ${y - 10} ${x + 35} ${y + 34} L${x + 26} ${y + 34} C${x + 30} ${y} ${x + 24} ${y - 18} ${x} ${y - 20} C${x - 24} ${y - 18} ${x - 30} ${y} ${x - 26} ${y + 34} Z`}
        fill="#2A1F1A"
      />
    )}
    {/* Eyes blink now and then */}
    <motion.g
      style={{ originX: `${x}px`, originY: `${y + 4}px` }}
      animate={{ scaleY: [1, 1, 0.1, 1] }}
      transition={{ duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity, delay }}
    >
      <circle cx={x - 11} cy={y + 4} r="3.4" fill="#1F1A17" />
      <circle cx={x + 11} cy={y + 4} r="3.4" fill="#1F1A17" />
    </motion.g>
    <path d={`M${x - 9} ${y + 16} Q${x} ${y + 23} ${x + 9} ${y + 16}`} stroke="#7A3E2B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    <circle cx={x - 19} cy={y + 13} r="5" fill="#FF8A80" opacity="0.35" />
    <circle cx={x + 19} cy={y + 13} r="5" fill="#FF8A80" opacity="0.35" />
  </motion.g>
);

const Bubble: React.FC<{ x: number; y: number; delay: number; children: React.ReactNode; width?: number }> = ({
  x,
  y,
  delay,
  children,
  width = 64,
}) => (
  <motion.g
    style={{ originX: `${x}px`, originY: `${y + 30}px` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.08, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
    transition={{ duration: 3, times: [0, 0.12, 0.2, 0.85, 1], repeat: Infinity, repeatDelay: 3, delay }}
  >
    <rect x={x - width / 2} y={y} width={width} height="34" rx="17" fill="#FFFFFF" />
    <path d={`M${x - 6} ${y + 33} L${x} ${y + 44} L${x + 6} ${y + 33} Z`} fill="#FFFFFF" />
    <text x={x} y={y + 23} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0B1B4F" fontFamily="Poppins, sans-serif">
      {children}
    </text>
  </motion.g>
);

export const GroupStudyScene: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 560 420" className={className} role="img" aria-label="Three friends practising together on Practice Koro">
    <defs>
      <radialGradient id="gss-glow" cx="50%" cy="45%" r="55%">
        <stop offset="0" stopColor="#3D7BFF" stopOpacity="0.55" />
        <stop offset="1" stopColor="#3D7BFF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="gss-table" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B07A4F" />
        <stop offset="1" stopColor="#7A4E2E" />
      </linearGradient>
      <linearGradient id="gss-screen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7FB2FF" />
        <stop offset="1" stopColor="#2F6BFF" />
      </linearGradient>
    </defs>

    {/* Soft light behind the group */}
    <motion.ellipse cx="280" cy="210" rx="270" ry="200" fill="url(#gss-glow)" animate={{ opacity: [0.6, 1, 0.6] }} transition={loop(4)} />

    {/* Twinkling sparkles */}
    {[
      [70, 70, 0],
      [500, 60, 0.8],
      [520, 210, 1.6],
      [40, 220, 2.2],
      [300, 30, 1.2],
    ].map(([cx, cy, d]) => (
      <motion.path
        key={`${cx}-${cy}`}
        d={`M${cx} ${cy - 7} L${cx + 2} ${cy - 2} L${cx + 7} ${cy} L${cx + 2} ${cy + 2} L${cx} ${cy + 7} L${cx - 2} ${cy + 2} L${cx - 7} ${cy} L${cx - 2} ${cy - 2} Z`}
        fill="#FFD43B"
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
        animate={{ scale: [0.4, 1.2, 0.4], opacity: [0.3, 1, 0.3] }}
        transition={loop(2.4, d)}
      />
    ))}

    {/* Quiz card: the right answer lights up green, then it resets */}
    <motion.g animate={{ y: [0, -6, 0] }} transition={loop(4)}>
      <rect x="196" y="22" width="168" height="98" rx="16" fill="#FFFFFF" />
      <rect x="212" y="36" width="96" height="8" rx="4" fill="#C9D2EC" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <motion.rect
            x="212"
            y={54 + i * 20}
            width="136"
            height="14"
            rx="7"
            fill="#EEF2FB"
            animate={i === 1 ? { fill: ['#EEF2FB', '#EEF2FB', '#22C55E', '#22C55E', '#EEF2FB'] } : undefined}
            transition={i === 1 ? { duration: 6, times: [0, 0.3, 0.38, 0.85, 1], repeat: Infinity } : undefined}
          />
          <circle cx="221" cy={61 + i * 20} r="4" fill={i === 1 ? '#FFFFFF' : '#C9D2EC'} />
        </g>
      ))}
      <motion.path
        d="M328 58 L333 64 L343 52"
        stroke="#FFFFFF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0 20)"
        animate={{ pathLength: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 6, times: [0, 0.34, 0.45, 0.85, 1], repeat: Infinity }}
      />
    </motion.g>

    {/* The three friends */}
    <Student x={130} y={210} skin="#C98B62" hoodie="#FFD43B" hoodieShade="#E6B800" hair="long" delay={0} />
    <Student x={430} y={210} skin="#8D5A3B" hoodie="#22C55E" hoodieShade="#169C49" hair="curly" delay={0.8} raisesHand />
    <Student x={280} y={190} skin="#B57A52" hoodie="#2F6BFF" hoodieShade="#1A4FD6" hair="short" delay={0.4} />
    {/* Practice Koro badge on the middle hoodie */}
    <rect x="268" y="270" width="24" height="24" rx="6" fill="#FFFFFF" />
    <path d="M274 278 h12 M274 284 h8" stroke="#2F6BFF" strokeWidth="2.6" strokeLinecap="round" />

    {/* Chat bubbles pop up in turn */}
    <Bubble x={130} y={118} delay={0.5} width={88}>
      ✓ Done
    </Bubble>
    <Bubble x={430} y={110} delay={2} width={70}>
      95%
    </Bubble>
    <Bubble x={280} y={132} delay={3.5} width={54}>
      🎯
    </Bubble>

    {/* Table with what they are working on */}
    <rect x="20" y="330" width="520" height="90" rx="18" fill="url(#gss-table)" />
    <rect x="20" y="330" width="520" height="10" rx="5" fill="#C99266" />
    {/* Laptop */}
    <path d="M226 334 L240 280 H320 L334 334 Z" fill="#2B3445" />
    <motion.path d="M245 286 H315 L304 328 H256 Z" fill="url(#gss-screen)" animate={{ opacity: [0.85, 1, 0.85] }} transition={loop(2)} />
    <rect x="214" y="332" width="132" height="8" rx="4" fill="#3A4558" />
    {/* Books on the left */}
    <rect x="72" y="314" width="78" height="14" rx="3" fill="#E5484D" />
    <rect x="78" y="300" width="70" height="14" rx="3" fill="#2F6BFF" />
    <rect x="74" y="320" width="74" height="3" fill="#FFFFFF" opacity="0.6" />
    {/* Phone on the right, buzzing with a notification */}
    <motion.g animate={{ rotate: [0, -4, 4, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3.4, delay: 1.5 }} style={{ originX: '432px', originY: '318px' }}>
      <rect x="414" y="296" width="36" height="34" rx="6" fill="#1F2633" />
      <rect x="418" y="300" width="28" height="22" rx="3" fill="#7FB2FF" />
    </motion.g>
    {/* Mugs */}
    <rect x="482" y="306" width="26" height="26" rx="5" fill="#FFFFFF" />
    <path d="M508 312 q10 0 10 8 q0 8 -10 8" stroke="#FFFFFF" strokeWidth="4" fill="none" />
    <motion.path
      d="M490 300 q-4 -8 0 -14 M500 300 q-4 -8 0 -14"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      animate={{ opacity: [0, 0.8, 0], y: [4, -4, -10] }}
      transition={loop(2.6)}
    />
  </svg>
);
