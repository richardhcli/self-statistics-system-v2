/**
 * DocsSidebar
 *
 * Navigation sidebar for the user documentation viewer.
 * Renders section headers and doc links generated from the docs/user/ folder tree.
 * Uses NavLink for automatic active-state styling.
 */
import React from "react";
import { NavLink } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { DocSection } from "../utils/build-doc-tree";

interface DocsSidebarProps {
  /** Ordered documentation sections to render */
  sections: DocSection[];
}

/**
 * Docs sidebar navigation.
 * Renders a section list generated from the docs/user/ folder tree.
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export const DocsSidebar: React.FC<DocsSidebarProps> = ({ sections }) => {
  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 border-r border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/60 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          <h2 className="text-lg font-bold">Documentation</h2>
        </div>
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.children.map((doc) => (
                  <li key={doc.slug}>
                    <NavLink
                      to={`/docs/${doc.slug}`}
                      className={({ isActive }) =>
                        [
                          "block px-3 py-2 text-sm rounded-lg transition-colors",
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                        ].join(" ")
                      }
                    >
                      {doc.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
