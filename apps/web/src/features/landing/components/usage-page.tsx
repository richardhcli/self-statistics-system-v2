/**
 * UsagePage — minimal walkthrough: usage procedure + feature pipeline.
 */
import React from "react";

const usage = [
  { step: "Input", detail: "Enter moment-to-moment small gains throughout your day." },
  { step: "Feedback", detail: "View instantaneous quantified progress for each entry—motivation to keep going." },
  { step: "Accumulate", detail: "Each progression is stored and compounded, preparing for analysis." },
  { step: "Self Statistics", detail: "View your holistic current state in the status window—time and effort, visualized." },
  { step: "Cross-Compare", detail: "See which path you are on, how far you have gone, and what it takes to reach the next level." },
];

const pipeline = [
  { name: "Journal entries", detail: "Voice-to-text or typed entries—fast, convenient capture." },
  { name: "CDAG", detail: "Characteristic → Skill → Action graph with weighted edges representing proportionate impact." },
  { name: "Experience", detail: "Actions + time → XP, feed-forwarded through the CDAG to update every relevant node." },
  { name: "Levels", detail: "XP aggregates into a legible level system so progress stays readable as the model grows." },
];

export const UsagePage: React.FC = () => (
  <div className="space-y-14 max-w-3xl">
    <section className="space-y-3">
      <h1 className="text-3xl font-black leading-tight">How it works</h1>
      <p className="text-slate-700 dark:text-slate-300">
        Centralized statistics system based on your input. 
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-lg font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Usage</h2>
      <ol className="space-y-3 list-none pl-0">
        {usage.map((item, i) => (
          <li key={item.step} className="flex gap-4 items-baseline">
            <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{item.step}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>

    <hr className="border-slate-200 dark:border-slate-800" />

    <section className="space-y-4">
      <h2 className="text-lg font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pipeline</h2>
      <div className="grid gap-px rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {pipeline.map((stage) => (
          <div
            key={stage.name}
            className="bg-white dark:bg-slate-900 p-4 flex gap-4 items-baseline"
          >
            <p className="shrink-0 w-28 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
              {stage.name}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-400">{stage.detail}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);