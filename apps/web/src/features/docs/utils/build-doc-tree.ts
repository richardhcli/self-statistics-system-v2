/**
 * Navigation tree generator for user documentation.
 *
 * Uses Vite `import.meta.glob` to discover every `.md` file under `docs/user/`
 * at build time and produces a typed section → document tree used by the docs
 * sidebar and markdown viewer.
 *
 * Folder names with numeric prefixes (e.g. `01-getting-started/`) control
 * sidebar ordering. Prefixes are stripped from display labels at build time.
 */

// ── Types ──────────────────────────────────────────────────────────

/** A single markdown document resolved at build time. */
export interface DocNode {
  /** Display label derived from filename, e.g. "Overview" */
  label: string;
  /** URL-safe slug used in routing, e.g. "getting-started/overview" */
  slug: string;
  /** Raw markdown string (loaded eagerly via ?raw) */
  content: string;
}

/** A folder grouping with a display label and ordered children. */
export interface DocSection {
  label: string;
  children: DocNode[];
}

// ── Glob import (Vite build-time) ──────────────────────────────────
//
// Eagerly imports every .md file under docs/user/ as raw text strings.
// @docs is a Vite alias pointing to <monorepo-root>/docs/.
//
const modules = import.meta.glob<string>(
  "@docs/user/**/*.md",
  { eager: true, query: "?raw", import: "default" },
);

// ── Helpers ────────────────────────────────────────────────────────

/** Strip numeric prefix and format: "01-getting-started" → "Getting Started" */
function prettifySegment(segment: string): string {
  return segment
    .replace(/^\d+-/, "")
    .replace(/\.md$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert relative glob path to a URL-safe slug: "01-getting-started/overview.md" → "getting-started/overview" */
function toSlug(relativePath: string): string {
  return relativePath
    .replace(/\d+-/g, "")
    .replace(/\.md$/, "")
    .replace(/\\/g, "/");
}

// ── Build ──────────────────────────────────────────────────────────

/**
 * Parse the glob results into an ordered section → doc tree.
 * Flat files (no subfolder) go into a "General" section.
 *
 * @returns Object containing ordered sections array and a flat slug → DocNode map
 */
export function buildDocTree(): {
  sections: DocSection[];
  flatMap: Map<string, DocNode>;
} {
  const sectionMap = new Map<string, DocNode[]>();
  const flatMap = new Map<string, DocNode>();

  for (const [rawPath, content] of Object.entries(modules)) {
    // rawPath example: "../../docs/user/01-getting-started/overview.md"
    const relative = rawPath.replace(/^.*docs\/user\//, "");
    const parts = relative.split("/");

    const isNested = parts.length > 1;
    const folderKey = isNested ? parts[0] : "__root__";
    const fileName = parts[parts.length - 1];

    const node: DocNode = {
      label: prettifySegment(fileName),
      slug: toSlug(isNested ? `${parts[0]}/${fileName}` : fileName),
      content: content as string,
    };

    flatMap.set(node.slug, node);

    if (!sectionMap.has(folderKey)) sectionMap.set(folderKey, []);
    sectionMap.get(folderKey)!.push(node);
  }

  // Sort sections by original key (numeric prefix preserves order)
  const sortedKeys = [...sectionMap.keys()].sort();
  const sections: DocSection[] = sortedKeys.map((key) => ({
    label: key === "__root__" ? "General" : prettifySegment(key),
    children: sectionMap.get(key)!,
  }));

  return { sections, flatMap };
}
