/**
 * DocsLayout
 *
 * Top-level layout for the user documentation viewer feature.
 * Composes the sidebar navigation and markdown content area.
 * Designed to render inside PublicLayout's Outlet.
 *
 * The doc tree is built once at module load from eagerly-imported markdown
 * files — no runtime fetching required.
 */
import React from "react";
import { buildDocTree } from "../utils/build-doc-tree";
import { DocsSidebar } from "./docs-sidebar";
import { MarkdownViewer } from "./markdown-viewer";

/** Build tree once at module load (all data is already eagerly imported). */
const { sections, flatMap } = buildDocTree();
const defaultSlug = sections[0]?.children[0]?.slug ?? "";

/**
 * Docs feature layout — sidebar on left, markdown content on right.
 *
 * @returns JSX.Element
 */
export const DocsLayout: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] -mx-4 sm:-mx-6 -mt-16">
      <DocsSidebar sections={sections} />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <MarkdownViewer flatMap={flatMap} defaultSlug={defaultSlug} />
      </main>
    </div>
  );
};
