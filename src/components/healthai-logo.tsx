/**
 * HealthAI Logo Component
 * 
 * SVG recreation of the HealthAI badge logo:
 * - Circular emblem with outer double-ring
 * - Caduceus (winged medical staff) centerpiece
 * - "HEALTHAI" text band
 * - "EST. 2026" top arc text
 * - "SMARTER CARE • SAFER HEALTH" bottom arc text
 * 
 * Props:
 *   size     — pixel size of the logo (default 64)
 *   color    — fill/stroke color (default "currentColor")
 *   variant  — "full" (badge) | "icon" (just caduceus) | "wordmark" (inline)
 */

import React from 'react';

interface HealthAILogoProps {
  size?: number;
  color?: string;
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
}

/** Full circular badge logo matching the HealthAI brand mark */
export function HealthAILogo({
  size = 64,
  color = '#1e3a6e',
  variant = 'full',
  className,
}: HealthAILogoProps) {
  if (variant === 'icon') return <HealthAIIcon size={size} color={color} className={className} />;
  if (variant === 'wordmark') return <HealthAIWordmark size={size} color={color} className={className} />;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HealthAI Logo"
      role="img"
    >
      {/* ── Outer ring ── */}
      <circle cx="100" cy="100" r="97" stroke={color} strokeWidth="2.5" fill="none" />
      <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="1" fill="none" />

      {/* ── Top arc text: EST. 2026 ── */}
      <defs>
        <path id="topArc" d="M 18,100 A 82,82 0 0,1 182,100" />
        <path id="bottomArc" d="M 22,110 A 80,80 0 0,0 178,110" />
      </defs>
      <text fontSize="10" fontFamily="Georgia, serif" fontWeight="700" letterSpacing="3" fill={color}>
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">EST. • 2026</textPath>
      </text>

      {/* ── Top decorative dots ── */}
      <circle cx="50" cy="37" r="2.5" fill={color} />
      <circle cx="150" cy="37" r="2.5" fill={color} />

      {/* ── Wings ── */}
      {/* Left wing */}
      <g opacity="0.9">
        <path
          d="M100,68 C90,62 72,58 58,62 C48,65 42,72 44,78 C48,72 60,70 72,72 C62,76 52,82 48,90 C55,84 68,80 80,82 C70,88 60,96 58,106 C66,98 78,94 88,96"
          stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Wing feather details */}
        <path d="M58,62 C54,68 52,75 54,80" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M48,90 C46,96 46,102 50,106" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>
      {/* Right wing (mirrored) */}
      <g opacity="0.9">
        <path
          d="M100,68 C110,62 128,58 142,62 C152,65 158,72 156,78 C152,72 140,70 128,72 C138,76 148,82 152,90 C145,84 132,80 120,82 C130,88 140,96 142,106 C134,98 122,94 112,96"
          stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M142,62 C146,68 148,75 146,80" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M152,90 C154,96 154,102 150,106" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* ── Star / cross at top of staff ── */}
      <polygon points="100,50 102,56 108,56 103,60 105,66 100,62 95,66 97,60 92,56 98,56"
        fill={color} opacity="0.9" />

      {/* ── Caduceus staff ── */}
      <line x1="100" y1="58" x2="100" y2="130" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* ── Serpent left (upper loop) ── */}
      <path
        d="M100,70 C92,68 84,72 84,80 C84,88 92,90 100,88 C108,86 112,82 108,76 C104,70 96,68 92,74"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"
      />
      {/* ── Serpent right (lower loop) ── */}
      <path
        d="M100,88 C108,90 116,94 116,102 C116,110 108,112 100,110 C92,108 88,104 92,98 C96,92 104,90 108,96"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"
      />

      {/* ── Bottom decorative flourishes ── */}
      <path
        d="M88,128 C88,132 94,135 100,135 C106,135 112,132 112,128"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"
      />
      <path d="M80,124 Q100,130 120,124" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />

      {/* ── Horizontal divider band ── */}
      <rect x="16" y="135" width="168" height="28" fill={color} rx="2" />

      {/* ── HEALTHAI wordmark on band ── */}
      <text
        x="100" y="154"
        textAnchor="middle"
        fontSize="17"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        letterSpacing="4"
        fill="white"
      >
        HEALTHAI
      </text>

      {/* ── Bottom arc text ── */}
      <text fontSize="7.5" fontFamily="Georgia, serif" fontWeight="600" letterSpacing="2" fill={color}>
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">SMARTER CARE  •  SAFER HEALTH</textPath>
      </text>

      {/* ── Bottom decorative dots ── */}
      <circle cx="50" cy="166" r="2" fill={color} />
      <circle cx="150" cy="166" r="2" fill={color} />
    </svg>
  );
}

/** Compact caduceus-only icon (for favicon, small spaces) */
export function HealthAIIcon({
  size = 32,
  color = 'currentColor',
  className,
}: { size?: number; color?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HealthAI Icon"
      role="img"
    >
      {/* Staff */}
      <line x1="16" y1="4" x2="16" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Star */}
      <polygon points="16,2 17.2,5.6 21,5.6 18,7.8 19.2,11.4 16,9.2 12.8,11.4 14,7.8 11,5.6 14.8,5.6"
        fill={color} />
      {/* Wings */}
      <path d="M16,8 C12,6 6,8 5,12 C8,9 12,9 14,10 C10,12 7,15 8,18 C10,15 14,13 16,14"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M16,8 C20,6 26,8 27,12 C24,9 20,9 18,10 C22,12 25,15 24,18 C22,15 18,13 16,14"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Serpents */}
      <path d="M16,10 C12,10 10,13 12,15 C14,17 18,16 16,14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M16,18 C20,18 22,21 20,23 C18,25 14,24 16,22" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Inline wordmark for headers (icon + text side by side) */
export function HealthAIWordmark({
  size = 40,
  color = 'currentColor',
  className,
}: { size?: number; color?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ''}`}
      style={{ color }}
      aria-label="HealthAI"
    >
      <HealthAIIcon size={size * 0.6} color={color} />
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900,
          fontSize: size * 0.45,
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        HEALTHAI
      </span>
    </span>
  );
}

export default HealthAILogo;
