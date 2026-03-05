/**
 * AboutPage
 *
 * Explains the philosophy and technology behind the Self-Statistics System for
 * visitors before they sign in.
 */
import React from "react";
import { CheckCircle2, Shield, Workflow } from "lucide-react";

const pillars = [
  {
    title: "Quantified reflection",
    body: "Blend qualitative journaling with quantitative stats so feelings, context, and metrics stay connected.",
  },
  {
    title: "Narrative over vanity",
    body: "Stats exist to tell the story of progress, not to chase leaderboard vanity metrics.",
  },
  {
    title: "Intentional loops",
    body: "Capture → Analyze → Decide → Act. Keep the feedback loop tight so next steps are obvious.",
  },
];

const tech = [
  "Firebase for auth, Firestore, and analytics",
  "Zustand + IndexedDB for local-first caching",
  "Gemini models for structured AI breakdowns",
  "Vite + React + Tailwind for a fast, clean UI",
  "Composable feature modules to isolate domains",
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] bg-slate-900 text-white rounded-full">
          About the system
        </p>
        <h1 className="text-3xl sm:text-4xl font-black leading-tight">Why Self-Statistics exists</h1>
        <p className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl">
          We built this to help builders and researchers understand their own momentum. The app connects daily journaling with AI reflections, a progression system, and a knowledge graph so you can see where to focus next.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-300 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              {pillar.title}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-400">{pillar.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <div className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
          <h2 className="text-xl font-bold">How it stays aligned with users</h2>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-3">
              <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Transparent data ownership</p>
                <p className="text-slate-600 dark:text-slate-400">Clear pathways to export, delete, or audit data. Guest sessions stay local unless you link.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Workflow className="w-5 h-5 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Simple, repeatable flows</p>
                <p className="text-slate-600 dark:text-slate-400">The same loop—capture, AI analysis, update stats—works for journaling, research, or habit tracking.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Composable building blocks</p>
                <p className="text-slate-600 dark:text-slate-400">Features live in isolated modules so the product can expand without bloating the core experience.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800/80 shadow-lg space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-200 font-semibold">Tech transparency</p>
          <h3 className="text-2xl font-bold">Under the hood</h3>
          <ul className="space-y-2 text-sm text-slate-200">
            {tech.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[2px] text-indigo-200">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-300">
            No secret black boxes: AI prompts, sync strategies, and store structures are documented for contributors.
          </p>
        </div>
      </section>
    </div>
  );
};