/**
 * UsagePage
 *
 * Public walkthrough of the core loops with visual placeholders for visitors.
 */
import React from "react";
import { ArrowRightCircle, ClipboardPenLine, LineChart, Sparkles } from "lucide-react";

const steps = [
  {
    title: "Capture",
    detail: "Log a quick reflection, voice note, or structured entry. Categorize with tags and goals when you have time, or just write and go.",
    accent: "Journal",
  },
  {
    title: "Analyze",
    detail: "Gemini runs a breakdown that extracts themes, blockers, and suggested next steps. Highlights feed directly into the progression system.",
    accent: "AI",
  },
  {
    title: "Progress",
    detail: "Stats update automatically—XP, streaks, and graph connections. You see what changed and why in a single dashboard.",
    accent: "Stats",
  },
];

export const UsagePage: React.FC = () => {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100 rounded-full">
          How it works
        </p>
        <h1 className="text-3xl sm:text-4xl font-black leading-tight">The loop you repeat</h1>
        <p className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl">
          Every session runs the same predictable loop: capture, analyze, progress. The UI keeps each stage visible so you know what the system is doing with your input.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="p-5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">{step.accent}</span>
              <span className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-200/40">
                {index + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-400">{step.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <div className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardPenLine className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-xl font-bold">Journaling flow</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li>Quick capture for lightweight entries when you are on the move.</li>
            <li>Rich editor for structured sessions with goals, tags, and context.</li>
            <li>Offline-friendly: entries persist locally until sync finishes.</li>
          </ul>
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-900/60 text-sm text-slate-600 dark:text-slate-400">
            Placeholder for screenshot: journal composer + AI panel.
          </div>
        </div>

        <div className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-xl font-bold">AI analysis</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li>Gemini highlights themes, risks, and suggested next actions.</li>
            <li>Insights map directly into the progression system for XP updates.</li>
            <li>Context stays local-first; sensitive data avoids unnecessary uploads.</li>
          </ul>
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-900/60 text-sm text-slate-600 dark:text-slate-400">
            Placeholder for screenshot: AI insights cards.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-start">
        <div className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
          <div className="flex items-center gap-3">
            <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-xl font-bold">Progression system</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li>XP and streaks reward consistency, not perfection.</li>
            <li>Graph view shows how concepts connect over time.</li>
            <li>Statistics dashboard keeps the trend lines honest.</li>
          </ul>
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-900/60 text-sm text-slate-600 dark:text-slate-400">
            Placeholder for screenshot: stats dashboard + graph.</div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-indigo-200 uppercase text-xs font-semibold tracking-[0.3em]">
            <ArrowRightCircle className="w-4 h-4" />
            Next step
          </div>
          <h3 className="text-2xl font-bold">Jump in with your next entry</h3>
          <p className="text-sm text-slate-200">
            The fastest way to feel the system is to log something real. Capture one reflection, skim the AI breakdown, and check how your graph shifts.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
            Start at the landing page, sign in, and head straight to Journal → Analysis → Stats. The loop will guide you.
          </div>
        </div>
      </section>
    </div>
  );
};