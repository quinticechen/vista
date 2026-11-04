// Analysis pages are standalone HTML files in public/analysis/{owner}/{slug}/index.html,
// listed in public/analysis/manifest.json (see docs/PUBLISHING_VISUALS.md).

export const ANALYSIS_MANIFEST_PATH = "/analysis/manifest.json";

export interface AnalysisEntry {
  owner: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
}

interface AnalysisManifest {
  items: AnalysisEntry[];
}

/** Path of the raw HTML file that the analysis page loads in its frame. */
export const getAnalysisFilePath = (owner: string, slug: string): string =>
  `/analysis/${owner.toLowerCase()}/${slug}/`;

/** Public page URL path, shown with the owner's personal header. */
export const getAnalysisPagePath = (owner: string, slug: string): string =>
  `/${owner}/analysis/${slug}/`;

export async function getAnalysisEntry(owner: string, slug: string): Promise<AnalysisEntry | null> {
  const response = await fetch(ANALYSIS_MANIFEST_PATH, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load analysis manifest (${response.status})`);
  const manifest = (await response.json()) as AnalysisManifest;
  const ownerKey = owner.toLowerCase();
  return manifest.items.find((item) => item.owner.toLowerCase() === ownerKey && item.slug === slug) ?? null;
}
