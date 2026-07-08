"use client";

import { LEVELS, Level } from "@/lib/levels";

interface Props {
  learned: Record<number, boolean>;
  stars: Record<number, number>;
  onPick: (id: number) => void;
  onBack: () => void;
}

const GROUPS: { key: Level["difficulty"]; label: string; hint: string }[] = [
  { key: "Basics", label: "🏠 Basics", hint: "Learn the building blocks" },
  { key: "Advanced", label: "🔬 Advanced", hint: "Real circuits: voltage, fuses, shorts" },
  { key: "Expert", label: "🧠 Expert", hint: "Parallel circuits & the control room" },
];

export default function LevelMap({ learned, stars, onPick, onBack }: Props) {
  const allDone =
    Object.keys(learned).length === LEVELS.length &&
    Object.values(learned).every(Boolean);

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-spark">🏠 The House</h2>
        <button
          onClick={onBack}
          className="min-h-[44px] rounded-xl bg-white/10 px-4 font-bold hover:bg-white/20"
        >
          ← Menu
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-300">
        Jump to any room. Rooms glow warm yellow once you&apos;ve fixed them!
      </p>

      <div
        className={[
          "rounded-3xl border-4 p-4 transition-all duration-700",
          allDone
            ? "border-spark bg-amber-500/20 shadow-[0_0_60px_rgba(255,210,63,0.5)]"
            : "border-white/10 bg-white/5",
        ].join(" ")}
      >
        {GROUPS.map((g) => {
          const levels = LEVELS.filter((l) => l.difficulty === g.key);
          if (levels.length === 0) return null;
          return (
            <div key={g.key} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-lg font-extrabold text-slate-100">{g.label}</h3>
                <span className="text-xs text-slate-400">{g.hint}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {levels.map((lv) => {
                  const done = learned[lv.id];
                  return (
                    <button
                      key={lv.id}
                      onClick={() => onPick(lv.id)}
                      className={[
                        "group flex min-h-[112px] flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition active:scale-95",
                        done
                          ? "border-amber-300 bg-gradient-to-b from-amber-200/90 to-yellow-100/80 text-amber-950 shadow-[0_0_24px_rgba(255,210,63,0.6)]"
                          : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-spark/60",
                      ].join(" ")}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-2xl">{lv.emoji}</span>
                        <span className="text-xs font-bold opacity-70">Lv {lv.id}</span>
                      </div>
                      <span className="text-sm font-extrabold leading-tight">
                        {lv.room}
                      </span>
                      <span className="text-[11px] font-medium opacity-80">
                        {lv.title}
                      </span>
                      <span className="mt-auto text-sm">
                        {done ? (
                          <span className="font-bold text-amber-700">
                            {"★".repeat(stars[lv.id] ?? 0)}
                            {"☆".repeat(3 - (stars[lv.id] ?? 0))} lit
                          </span>
                        ) : (
                          <span className="opacity-60">🌑 dark</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
