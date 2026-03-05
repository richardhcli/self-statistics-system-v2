/**
 * LandingPage
 *
 * Public hero experience introducing the Self-Statistics System and directing
 * users to sign in or jump into the app if already authenticated.
 */
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Network, NotebookPen, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "../../../providers/auth-provider";

const features = [
  {
    title: "Capture everything",
    description: "Voice, quick notes, or structured journal entries keep your daily signals in one place.",
    icon: NotebookPen,
  },
  {
    title: "AI reflections",
    description: "Gemini-powered analysis surfaces themes, wins, and next actions from raw text.",
    icon: Sparkles,
  },
  {
    title: "Progression system",
    description: "RPG-inspired levels and milestones keep momentum while you build habits.",
    icon: TrendingUp,
  },
  {
    title: "Knowledge graph",
    description: "See how ideas connect through a living graph of concepts, stats, and outcomes.",
    icon: Network,
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const ctaHref = user ? "/app/journal" : "/auth/login";

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            A Status Screen, for Real Life.
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl">
            The Self-Statistics System maintains a personal statistical view of your own progress over time, sourcing reflection and motivation. 
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={ctaHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-200/50"
            >
              {user ? "Open the app" : "Start with login"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/usage"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 font-semibold hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              See how it works
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-white to-purple-100 dark:from-indigo-900/40 dark:via-slate-900 dark:to-fuchsia-900/30 blur-3xl rounded-3xl" aria-hidden />
          <div className="relative p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">Core loop</p>
                <p className="text-xl font-bold">Journal → Analysis → Statistics</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200 text-xs font-bold">Live</span>
            </div>
            <div className="grid gap-3">

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200/40">
                  1
                </div>
                <div>
                  <p className="font-semibold">Capture insights</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Voice, keyboard, or API calls.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200/40">
                  2
                </div>
                <div>
                  <p className="font-semibold">Character extractions</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">AI extracts actions, skills, characteristics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200/40">
                  3
                </div>
                <div>
                  <p className="font-semibold">Accumulate statistics</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update self-character graph model, earn XP, and progress your values</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-900/60">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Made for those that want a human-centric value tracker. Gamify your growth; Quantify your progress. 
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">What you get out of the box</h2>
          <Link to="/about" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
            Learn about the philosophy →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-200">
                    <Icon className="w-5 h-5" />
                  </span>
                  <p className="font-semibold text-lg">{feature.title}</p>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-900 text-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-indigo-200 font-semibold">Ready to begin?</p>
          <p className="text-2xl font-bold">Log your next entry and watch the graph evolve.</p>
          <p className="text-sm text-slate-200/90 max-w-2xl">
            Every entry updates your stats, levels, and knowledge graph. Start small, stay consistent, and let the system surface insights.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={ctaHref}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
          >
            {user ? "Continue in app" : "Sign in to start"}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-700 text-white font-semibold hover:border-indigo-300 hover:text-indigo-100 transition-colors"
          >
            Why this approach
          </Link>
        </div>
      </section>
    </div>
  );
};