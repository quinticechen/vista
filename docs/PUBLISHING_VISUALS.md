# Publishing Interactive Visuals

How to publish a standalone HTML piece (diagram, chart, interactive report) on the Vista blog so it reads as part of a post.

## When to use this method

Use it for content that is a self-contained HTML page with its own styling and script, such as an interactive diagram or a one-page data report. Write the article text in Notion as normal, and use this method only for the interactive part.

Don't use it for:
- Static images: upload them to Notion as image blocks.
- Content that needs data from Supabase or user login: build it as a React page in `src/`.

## How it works

1. The HTML file lives in `public/analysis/<slug>/index.html` and ships with the normal Vercel deploy.
2. It is served at `https://vista.qwizai.com/analysis/<slug>/`, and works as a standalone page.
3. A Notion **embed** block with that URL is rendered by `HostedVisualEmbed`: a full-width iframe that grows to the visual's height, so the post scrolls as one page.
4. `public/analysis/embed.js`, loaded by the visual, does two things only when the page is inside an iframe:
   - Hides every element marked `data-embed-hide`.
   - Sends the page height to the post (`postMessage`, type `vista-visual:height`, same origin only).

Opened directly, the visual is unchanged.

## Steps to publish a new visual

1. **Pick a slug.** Use lowercase words joined by hyphens, e.g. `sme-lending`. The slug becomes the public URL, so don't rename it after publishing.
2. **Copy the file** to `public/analysis/<slug>/index.html`. Keep the original source file where it is.
3. **Make it self-contained.** Inline CSS and JS, or keep any assets inside `public/analysis/<slug>/` and reference them with relative paths. Avoid third-party scripts and trackers (Vista is privacy-first).
4. **Add the embed helper** just before `</body>`:
   ```html
   <script src="/analysis/embed.js"></script>
   ```
5. **Mark duplicate chrome** with `data-embed-hide`. Usually this is the visual's own sticky nav and its title/header, because the post already has a title. Keep anything the reader needs, like sources and footnotes.
6. **Check the layout at about 830px wide.** The post column is `max-w-4xl`, so the visual renders narrower than full screen. Make sure it has a responsive breakpoint for that width.
7. **Avoid full-viewport layouts** inside the visual (`100vh` sections, its own inner scroll areas). The iframe takes the content height, so `100vh` creates a feedback loop.
8. **Verify locally** (see below), then deploy.
9. **In Notion**, add an `/embed` block with `https://vista.qwizai.com/analysis/<slug>/` (include the trailing slash). Add a caption if you want one.
10. **Record it** in the registry below.

## Local verification

```bash
bun run build && bun run preview
```

- Open `http://localhost:4173/analysis/<slug>/`. It should look like the original file.
- Open a post that embeds it. The visual should sit in the post with no inner scrollbar, and the `data-embed-hide` parts should be hidden.

In dev and preview, a `vista.qwizai.com/analysis/...` URL from Notion loads the local copy, because `getHostedVisualPath` rewrites it to a same-origin path.

## Configuration this depends on

- `vercel.json`
  - The SPA rewrite excludes `analysis`, so these files are not routed to `index.html`.
  - `/analysis/(.*)` sends `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`, overriding the site-wide `DENY`. Without this, browsers block the iframe.
- `src/components/notion/utils/hosted-visual.ts`: `VISUALS_HOSTS` lists the production host. Add any new custom domain that serves this app.
- `src/components/notion/components/HostedVisualEmbed.tsx`: the auto-height iframe.

Any other embed URL still uses the default 16:9 `EmbedRenderer`.

## Registry

| Slug | URL | Source file | Published | Notes |
|---|---|---|---|---|
| sme-lending | /analysis/sme-lending/ | `HTMLS/sme-lending-v2.html` | 2026-11-04 | UK SME lending market map. Nav and header hidden when embedded. |
