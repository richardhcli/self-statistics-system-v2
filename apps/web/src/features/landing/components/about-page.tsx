/**
 * AboutPage
 *
 * Explains the philosophy and technology behind the Self-Statistics System for
 * visitors before they sign in.
 */
import React from "react";
import { CheckCircle2, Shield, Workflow } from "lucide-react";



const foundation = [
  {
    term: "Nodes",
    detail: "A representation of some concept. Has connections to other nodes.",
  },
  {
    term: "Experience (exp)",
    detail: "A measure of time invested in a concept.",
  },
  {
    term: "Levels (lv)",
    detail: "A measure of skill attained for a concept.",
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <p className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] bg-slate-900 text-white rounded-full">
          About the system
        </p>
        <h1 className="text-3xl sm:text-4xl font-black leading-tight">Why Self-Statistics exists</h1>
        <p className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl">
          One of the pillars of success is <span className="font-bold text-indigo-600 dark:text-indigo-300">motivation</span>: <span className="text-slate-400 dark:text-slate-500 italic">&ldquo;the general desire or willingness of someone to do something&rdquo;</span>.{" "}
        </p>
        <p>
            How does one <span className="font-bold text-indigo-600 dark:text-indigo-300">optimize</span> it?
        </p>
      </section>

      {/* Philosophy */}
      <section className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
        <h2 className="text-xl font-bold">The philosophy</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          All motivation is found by seeing some change and seeing that it is good change. This creates two goals:
        </p>
        <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <span className="font-semibold">Seeing change</span> &mdash; change can only be seen in the difference of states. You need information on your current state and your new state.
          </li>
          <li>
            <span className="font-semibold">Seeing change as good</span> &mdash; a single change must be exaggerated into a life direction. Take the sum of many similar changes in series and see if the macroscopic overall change is agreeable.
          </li>
        </ul>
      </section>

      {/* The idea */}
      <section className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
        <h2 className="text-xl font-bold">The idea</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          The solution is a single-source-of-truth quantifiable &ldquo;status&rdquo;. It displays a state of ourselves in quantifiable data (knowledge of who we are), and changes to it as we act serve as direct immediate positive feedback (motivation).
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          In games this is the &ldquo;status screen&rdquo; &mdash; the player&rsquo;s level and statistics like HP/MP, INT, STR. If such a screen existed for real life, updated automatically, with no stakes except when we will it &mdash; wouldn&rsquo;t that be amazing?
        </p>
      </section>

      {/* Foundation */}
      <section className="space-y-4 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm">
        <h2 className="text-xl font-bold">The foundation</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          A real-life status screen requires three essential primitives. By tracking experience and levels per node, a complex emergent system of self-statistics tracking can be created.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {foundation.map((f) => (
            <div
              key={f.term}
              className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/60"
            >
              <h3 className="text-sm font-bold mb-1">{f.term}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};