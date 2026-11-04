// Analysis pages are standalone HTML files in public/analysis/{owner}/{slug}/ (see docs/PUBLISHING_VISUALS.md).
// A Notion embed pointing at one is rendered same-origin so the page can report its height.

export const ANALYSIS_PATH_PREFIX = "/analysis/";
export const VISUAL_HEIGHT_MESSAGE = "vista-visual:height";

// Hosts whose analysis URLs are served by this app. The current host is always included,
// so a production URL pasted in Notion loads the local copy in dev and preview deploys.
const VISUALS_HOSTS = ["vista.qwizai.com"];

// Public page URL: /{owner}/analysis/{slug}/
const ANALYSIS_PAGE_PATTERN = /^\/([^/]+)\/analysis\/([^/]+)\/?$/;

/**
 * Returns the same-origin path of the analysis file for an embed URL, or null for any other embed.
 * Accepts both the raw file URL (/analysis/{owner}/{slug}/) and the public page URL
 * (/{owner}/analysis/{slug}/), which would otherwise load the whole site inside the frame.
 */
export const getHostedVisualPath = (mediaUrl: string): string | null => {
  try {
    const url = new URL(mediaUrl, window.location.origin);
    const isKnownHost = url.host === window.location.host || VISUALS_HOSTS.includes(url.hostname);
    if (!isKnownHost) return null;

    const pageMatch = url.pathname.match(ANALYSIS_PAGE_PATTERN);
    if (pageMatch) return `${ANALYSIS_PATH_PREFIX}${pageMatch[1].toLowerCase()}/${pageMatch[2]}/${url.hash}`;

    if (url.pathname.startsWith(ANALYSIS_PATH_PREFIX)) return `${url.pathname}${url.search}${url.hash}`;
    return null;
  } catch {
    return null;
  }
};
