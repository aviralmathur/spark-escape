"use client";

import { ComponentType } from "@/lib/types";

interface Props {
  type: ComponentType;
  size?: number;
  flipped?: boolean;
  closed?: boolean; // switch
  lit?: boolean; // bulb / led glowing (on/off)
  bright?: number; // 0..1 brightness (overrides lit when provided)
  count?: number; // cell stack size
  blown?: boolean; // fuse blown
}

/** Inline-SVG art for every game component. No external images. */
export default function ComponentIcon({
  type,
  size = 56,
  flipped = false,
  closed = false,
  lit = false,
  bright,
  count,
  blown = false,
}: Props) {
  const s = size;
  const flip = flipped ? "scaleX(-1)" : undefined;
  // Effective brightness: explicit `bright` wins, else on/off from `lit`.
  const b = bright != null ? bright : lit ? 1 : 0;
  const on = b > 0.02;

  switch (type) {
    case "cell":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={{ transform: flip }}>
          <rect x="10" y="22" width="34" height="20" rx="3" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2" />
          <rect x="44" y="27" width="6" height="10" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
          <text x="16" y="37" fontSize="16" fontWeight="800" fill="#fff">+</text>
          <text x="34" y="37" fontSize="18" fontWeight="800" fill="#fff">–</text>
          {count && count > 1 && (
            <>
              <circle cx="27" cy="14" r="11" fill="#f59e0b" stroke="#7c2d12" strokeWidth="2" />
              <text x={count >= 10 ? 18 : 22} y="19" fontSize="13" fontWeight="900" fill="#fff">
                {count}×
              </text>
            </>
          )}
        </svg>
      );
    case "wire":
      return (
        <svg width={s} height={s * 0.5} viewBox="0 0 64 32">
          <rect x="2" y="12" width="60" height="8" rx="4" fill="#22c55e" stroke="#166534" strokeWidth="2" />
          <circle cx="6" cy="16" r="4" fill="#a7f3d0" />
          <circle cx="58" cy="16" r="4" fill="#a7f3d0" />
        </svg>
      );
    case "brokenwire":
      return (
        <svg width={s} height={s * 0.5} viewBox="0 0 64 32">
          <rect x="2" y="12" width="24" height="8" rx="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
          <rect x="38" y="12" width="24" height="8" rx="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
          <path d="M26 8 l6 8 l-6 8" stroke="#fca5a5" strokeWidth="2" fill="none" />
          <path d="M38 8 l-6 8 l6 8" stroke="#fca5a5" strokeWidth="2" fill="none" />
        </svg>
      );
    case "bulb":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={on ? "glow-bulb" : ""}
          style={on ? { opacity: 0.55 + 0.45 * b } : undefined}
        >
          <circle cx="32" cy="26" r="18" fill={on ? "#ffe680" : "#5b6480"} stroke={on ? "#f59e0b" : "#3b4260"} strokeWidth="2" />
          {on && <circle cx="26" cy="20" r="5" fill="#fffbe6" opacity="0.9" />}
          <path d="M25 22 l4 8 l6 -12 l4 8" stroke={on ? "#b45309" : "#2b3150"} strokeWidth="2" fill="none" />
          <rect x="24" y="42" width="16" height="10" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
          <line x1="26" y1="46" x2="38" y2="46" stroke="#475569" strokeWidth="1.5" />
          <line x1="26" y1="49" x2="38" y2="49" stroke="#475569" strokeWidth="1.5" />
        </svg>
      );
    case "led":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={{ transform: flip, ...(on ? { opacity: 0.6 + 0.4 * b } : {}) }} className={on ? "glow-led" : ""}>
          {/* dome */}
          <path d="M20 34 a12 12 0 0 1 24 0 v4 h-24 z" fill={on ? "#7CFF6B" : "#5b6480"} stroke={on ? "#22c55e" : "#3b4260"} strokeWidth="2" />
          <rect x="20" y="36" width="24" height="4" fill={on ? "#22c55e" : "#3b4260"} />
          {/* legs: long (+) on the left, short (-) on the right */}
          <line x1="26" y1="40" x2="26" y2="58" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="38" y1="40" x2="38" y2="52" stroke="#cbd5e1" strokeWidth="2.5" />
          <text x="21" y="30" fontSize="12" fontWeight="800" fill={on ? "#14532d" : "#94a3b8"}>+</text>
        </svg>
      );
    case "fuse":
      return (
        <svg width={s} height={s * 0.6} viewBox="0 0 64 40">
          <rect x="8" y="10" width="48" height="20" rx="6" fill="none" stroke={blown ? "#ef4444" : "#94a3b8"} strokeWidth="2.5" />
          <circle cx="8" cy="20" r="4" fill="#cbd5e1" />
          <circle cx="56" cy="20" r="4" fill="#cbd5e1" />
          {blown ? (
            <>
              <path d="M18 20 l10 -6 l-4 6 l10 6" stroke="#ef4444" strokeWidth="2.5" fill="none" />
              <text x="40" y="24" fontSize="12">💥</text>
            </>
          ) : (
            <line x1="16" y1="20" x2="48" y2="20" stroke="#f59e0b" strokeWidth="2.5" />
          )}
        </svg>
      );
    case "resistor":
      return (
        <svg width={s} height={s * 0.5} viewBox="0 0 64 32">
          <line x1="2" y1="16" x2="14" y2="16" stroke="#cbd5e1" strokeWidth="3" />
          <path d="M14 16 l4 -8 l8 16 l8 -16 l8 16 l4 -8" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <line x1="50" y1="16" x2="62" y2="16" stroke="#cbd5e1" strokeWidth="3" />
        </svg>
      );
    case "switch":
      return (
        <svg width={s} height={s * 0.6} viewBox="0 0 64 40">
          <circle cx="12" cy="26" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <circle cx="52" cy="26" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <line
            x1="12"
            y1="26"
            x2={closed ? 52 : 46}
            y2={closed ? 26 : 8}
            stroke={closed ? "#22c55e" : "#f59e0b"}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "coin":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="20" fill="#fcd34d" stroke="#b45309" strokeWidth="2.5" />
          <text x="24" y="40" fontSize="18" fontWeight="800" fill="#92400e">₹</text>
        </svg>
      );
    case "key":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <circle cx="20" cy="24" r="10" fill="none" stroke="#cbd5e1" strokeWidth="4" />
          <line x1="27" y1="31" x2="48" y2="52" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <line x1="42" y1="46" x2="48" y2="40" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "foil":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="12" y="16" width="40" height="32" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <path d="M16 20 l32 0 M16 28 l32 0 M16 36 l32 0 M16 44 l32 0" stroke="#cbd5e1" strokeWidth="1.5" />
        </svg>
      );
    case "eraser":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="14" y="22" width="36" height="20" rx="3" fill="#f9a8d4" stroke="#be185d" strokeWidth="2" />
          <rect x="14" y="22" width="12" height="20" rx="3" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
        </svg>
      );
    case "scale":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="8" y="26" width="48" height="12" rx="2" fill="#67e8f9" opacity="0.7" stroke="#0e7490" strokeWidth="2" />
          <path d="M14 26 v6 M22 26 v6 M30 26 v6 M38 26 v6 M46 26 v6" stroke="#0e7490" strokeWidth="1.5" />
        </svg>
      );
    case "rubberband":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <ellipse cx="32" cy="32" rx="20" ry="10" fill="none" stroke="#f97316" strokeWidth="5" />
        </svg>
      );
    default:
      return null;
  }
}
