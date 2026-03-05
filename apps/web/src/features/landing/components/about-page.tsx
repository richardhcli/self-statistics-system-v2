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
    body: "Capture  Analyze  Decide  Act. Keep the feedback loop tight so next steps are obvious.",
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
          How can we motivate ourselves? How can we know exactly who we are?
        </p>
      </section>

      {/* Background */}
      <section className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
        <h2 className="text-xl font-bold">The idea</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {"The solution to both questions is a single-source-of-truth quantifiable \u2018status\u2019. Such a status would display a state of ourselves in quantifiable data (knowledge of who we are), and changes to it as we act would serve as direct immediate positive feedback (motivation)."}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {"In games and media, this is commonly seen as a \u201Cstatus screen\u201D \u2014 a screen that displays the player\u2019s level and statistics like \u2018hp / mp\u2019, \u2018int\u2019, \u2018str\u2019, etc. If such a screen existed \u2014 an extremely convenient way to see our own status and statistics, updated automatically \u2014 wouldn\u2019t that be amazing?"}
        </p>
      </section>

      {/* Implementation details */}
      <section className="space-y-4 p-6 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800/80 shadow-lg">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-200 font-semibold">Implementation</p>
        <h3 className="text-2xl font-bold">Under the hood</h3>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex items-start gap-2"><span className="mt-[2px] text-indigo-200">&bull;</span><span><strong>{"Experience & Levels"}</strong>{" \u2014 Experience measures time invested; Levels measure skill. Both are computed via LLM pipelines rather than hard-coded rules."}</span></li>
          <li className="flex items-start gap-2"><span className="mt-[2px] text-indigo-200">&bull;</span><span><strong>Journal entries</strong>{" \u2014 Voice-to-text or manual input feeds the inference pipeline."}</span></li>
          <li className="flex items-start gap-2"><span className="mt-[2px] text-indigo-200">&bull;</span><span>{"CDAG (Characteristic Directed Acyclic Graph) \u2014 A graph of human characteristics: Characteristics (intelligence, wisdom, fitness\u2026) \u2192 Skills (memorization, technique\u2026) \u2192 Actions (studying, exercising\u2026). Edge weights represent proportions."}</span></li>
          <li className="flex items-start gap-2"><span className="mt-[2px] text-indigo-200">&bull;</span><span>{"Experience pipeline: User entry \u2192 extract actions & time \u2192 convert to XP \u2192 forward-feed through CDAG recursively \u2192 generate total XP changes for all nodes \u2192 return and store results."}</span></li>
          <li className="flex items-start gap-2"><span className="mt-[2px] text-indigo-200">&bull;</span><span>Inspired by feedforward and backpropagation algorithms in neural networks.</span></li>
        </ul>
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
                <p className="text-slate-600 dark:text-slate-400">{`The same loop \u2014 capture, AI analysis, update stats \u2014 works for journaling, research, or habit tracking.`}</p>
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
          <h3 className="text-2xl font-bold">Stack overview</h3>
          <ul className="space-y-2 text-sm text-slate-200">
            {tech.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[2px] text-indigo-200">&bull;</span>
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