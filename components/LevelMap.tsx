"use client";

import { LEVELS } from "@/lib/levels";

interface Props {
  learned: Record<number, boolean>;
  stars: Record<number, number>;
  onPick: (id: number) => void;
  onBack: () => void;
}

export default function LevelMap({ learned, stars, onPick, onBack }: Props) {
  const allDone = Object.keys(learned).length === LEVELS.length &&
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
        Pick any room to jump straight to a level. Fixed rooms glow warm yellow!
      </p>

      {/* house facade */}
      <div
        className={[
          "relative rounded-3xl border-4 p-5 transition-all duration-700",
          allDone
            ? "border-spark bg-amber-500/20 shadow-[0_0_60px_rgba(255,210,63,0.5)]"
            : "border-white/10 bg-white/5",
        ].join(" ")}
      >
        {/* roof */}
        <div className="mx-auto mb-3 h-0 w-0 border-x-[160px] border-b-[56px] border-x-transparent border-b-amber-800/70" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LEVELS.map((lv) => {
            const done = learned[lv.id];
            return (
              <button
                key={lv.id}
                onClick={() => onPick(lv.id)}
                className={[
                  "group flex min-h-[110px] flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition active:scale-95",
                  done
                    ? "border-amber-300 bg-gradient-to-b from-amber-200/90 to-yellow-100/80 text-amber-950 shadow-[0_0_24px_rgba(255,210,63,0.6)]"
                    : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-spark/60",
                ].join(" ")}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-2xl">{lv.emoji}</span>
                  <span className="text-xs font-bold opacity-70">
                    Lv {lv.id}
                  </span>
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
        {/* door */}
        <div className="mx-auto mt-3 h-10 w-16 rounded-t-xl bg-amber-900/70" />
      </div>
    </div>
  );
}
