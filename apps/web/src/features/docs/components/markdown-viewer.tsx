/**
 * MarkdownViewer
 *
 * Renders a single markdown document from the docs tree.
 * Reads the React Router splat param to find the active document,
 * falling back to a default slug when the path matches nothing.
 */
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocNode } from "../utils/build-doc-tree";

interface MarkdownViewerProps {
  /** Flat slug → DocNode lookup map */
  flatMap: Map<string, DocNode>;
  /** Slug to show when the current path has no match */
  defaultSlug: string;
}

/**
 * Renders a single markdown document from the docs tree.
 * Falls back to the default slug when the path matches nothing.
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  flatMap,
  defaultSlug,
}) => {
  // React Router v7 splat: "/docs/getting-started/overview" → "*" = "getting-started/overview"
  const params = useParams();
  const slug = params["*"] || defaultSlug;
  const doc = flatMap.get(slug);

  if (!doc) {
    return <Navigate to={`/docs/${defaultSlug}`} replace />;
  }

  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {doc.content}
      </ReactMarkdown>
    </article>
  );
};
