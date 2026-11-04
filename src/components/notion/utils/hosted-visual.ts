// Hosted visuals are standalone HTML pages in public/analysis/ (see docs/PUBLISHING_VISUALS.md).
// A Notion embed pointing at one is rendered same-origin so the page can report its height.

export const ANALYSIS_PATH_PREFIX = "/analysis/";
export const VISUAL_HEIGHT_MESSAGE = "vista-visual:height";

// Hosts whose /analysis/ URLs are served by this app. The current host is always included,
// so a production URL pasted in Notion loads the local copy in dev and preview deploys.
const VISUALS_HOSTS = ["vista.qwizai.com"];

/** Returns a same-origin path for a hosted visual URL, or null for any other embed. */
export const getHostedVisualPath = (mediaUrl: string): string | null => {
  try {
    const url = new URL(mediaUrl, window.location.origin);
    const isKnownHost = url.host === window.location.host || VISUALS_HOSTS.includes(url.hostname);
    if (!isKnownHost || !url.pathname.startsWith(ANALYSIS_PATH_PREFIX)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};
