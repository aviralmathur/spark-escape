"use client";

interface Props {
  size?: number;
  mood?: "happy" | "think" | "oops";
}

/** Professor Volt — a friendly owl in glasses and a lab coat. Inline SVG. */
export default function ProfessorVolt({ size = 96, mood = "happy" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="animate-bob shrink-0"
      aria-label="Professor Volt the owl"
    >
      {/* lab coat shoulders */}
      <path d="M28 108 q32 -26 64 0 z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M60 92 l-6 16 m6 -16 l6 16" stroke="#cbd5e1" strokeWidth="2" fill="none" />
      {/* body */}
      <ellipse cx="60" cy="66" rx="34" ry="36" fill="#7c5cff" />
      <ellipse cx="60" cy="72" rx="22" ry="24" fill="#c4b5fd" />
      {/* ears / tufts */}
      <path d="M34 36 l6 -18 l10 14 z" fill="#7c5cff" />
      <path d="M86 36 l-6 -18 l-10 14 z" fill="#7c5cff" />
      {/* wings */}
      <ellipse cx="26" cy="70" rx="8" ry="18" fill="#6d4be0" transform="rotate(12 26 70)" />
      <ellipse cx="94" cy="70" rx="8" ry="18" fill="#6d4be0" transform="rotate(-12 94 70)" />
      {/* eyes (glasses) */}
      <circle cx="48" cy="52" r="15" fill="#fff" stroke="#0f172a" strokeWidth="3" />
      <circle cx="72" cy="52" r="15" fill="#fff" stroke="#0f172a" strokeWidth="3" />
      <line x1="63" y1="52" x2="57" y2="52" stroke="#0f172a" strokeWidth="3" />
      {mood === "oops" ? (
        <>
          <path d="M43 52 q5 5 10 0" stroke="#0f172a" strokeWidth="3" fill="none" />
          <path d="M67 52 q5 5 10 0" stroke="#0f172a" strokeWidth="3" fill="none" />
        </>
      ) : (
        <>
          <circle cx="48" cy={mood === "think" ? 50 : 53} r="5" fill="#0f172a" />
          <circle cx="72" cy={mood === "think" ? 50 : 53} r="5" fill="#0f172a" />
        </>
      )}
      {/* beak */}
      <path d="M60 60 l-6 8 h12 z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
      {/* little bow tie (professor!) */}
      <path d="M54 90 l6 -5 v10 z" fill="#ef4444" />
      <path d="M66 90 l-6 -5 v10 z" fill="#ef4444" />
      <circle cx="60" cy="90" r="2.5" fill="#b91c1c" />
      {/* spark on a tuft */}
      <text x="30" y="20" fontSize="14">⚡</text>
    </svg>
  );
}
