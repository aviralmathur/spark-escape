"use client";

import { LEVELS } from "@/lib/levels";
import ProfessorVolt from "./ProfessorVolt";

interface Props {
  learned: Record<number, boolean>;
  stars: Record<number, number>;
  onClose: () => void;
  playerName: string;
}

export default function ScienceNotebook({
  learned,
  stars,
  onClose,
  playerName,
}: Props) {
  const learnedCount = Object.values(learned).filter(Boolean).length;
  const allDone = learnedCount === LEVELS.length;
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="no-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-nightlight p-6 shadow-2xl ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-spark">
            📒 Science Notebook
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-white/10 px-4 font-bold hover:bg-white/20"
          >
            Close ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-300">
          Concepts learnt: <b className="text-white">{learnedCount}/{LEVELS.length}</b> ·
          Stars: <b className="text-spark">{totalStars} ★</b>
        </p>

        <div className="grid gap-3">
          {LEVELS.map((lv) => {
            const got = learned[lv.id];
            return (
              <div
                key={lv.id}
                className={[
                  "rounded-2xl border p-4",
                  got
                    ? "border-green-400/40 bg-green-400/10"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{lv.emoji}</span>
                  <span className="font-bold">
                    Level {lv.id}: {lv.title}
                  </span>
                  {got && (
                    <span className="ml-auto text-sm font-bold text-green-300">
                      {"★".repeat(stars[lv.id] ?? 0)} ✔ Learnt
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-200">
                  {got ? (
                    <>
                      <b className="text-green-300">✔ Concept learnt: </b>
                      {lv.card}
                    </>
                  ) : (
                    <span className="italic text-slate-400">
                      Not learnt yet — play Level {lv.id} to unlock this card.
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="mt-6 rounded-3xl border-4 border-spark bg-gradient-to-b from-amber-100 to-yellow-50 p-6 text-center text-slate-900">
            <div className="mx-auto mb-1 flex justify-center">
              <ProfessorVolt size={72} mood="happy" />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Giochi di Scienza 2026
            </div>
            <h3 className="mt-1 text-2xl font-black text-amber-900">
              Certificate of Circuit Mastery
            </h3>
            <p className="mt-2 text-sm">This certifies that</p>
            <p className="text-2xl font-black text-amber-800">{playerName}</p>
            <p className="mt-2 text-sm">
              has mastered cells, bulbs, LEDs, switches, conductors, insulators,
              circuit diagrams, voltage &amp; brightness, fuses, short circuits and
              parallel circuits — and brought the lights back! ⚡
            </p>
            <p className="mt-3 text-lg font-bold text-amber-700">
              ★★★★★ Class 7 · Electricity &amp; Circuits
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
