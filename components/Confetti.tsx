"use client";

const COLORS = ["#ffd23f", "#ff8a1e", "#22c55e", "#3b82f6", "#ec4899", "#a855f7"];

/** Simple CSS confetti burst. Renders once and fades out. */
export default function Confetti({ count = 80 }: { count?: number }) {
  const pieces = Array.from({ length: count });
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 1.8 + Math.random() * 1.6;
        const color = COLORS[i % COLORS.length];
        const rot = Math.random() * 360;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}vw`,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              transform: `rotate(${rot}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
