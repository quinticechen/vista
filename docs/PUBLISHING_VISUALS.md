# Publishing Analysis Pages

How to publish a standalone HTML piece (interactive diagram, chart, one-page data report) as a page on a user's personal Vista site.

## When to use this method

Use it for content that is a self-contained HTML page with its own styling and script. The result is a page at:

```
https://vista.qwizai.com/{username}/analysis/{slug}/
```

The page shows that user's personal header and footer, uses their site settings (name, languages, subscribe), and shows the analysis in between as one continuous scroll.

Don't use it for:
- Articles: write them in Notion as normal posts. An analysis page can also be embedded inside a post (see "Embedding in a Notion post").
- Static images: upload them to Notion as image blocks.
- Content that needs Supabase data or user login: build it as a React page in `src/`.

## How it works

| Piece | Location | Role |
|---|---|---|
| HTML file | `public/analysis/{username}/{slug}/index.html` | The analysis itself. Served raw at `/analysis/{username}/{slug}/`. Visitors never see this URL. |
| Manifest | `public/analysis/manifest.json` | Lists every published analysis: owner, slug, title, description, date. It is also the registry. |
| Page | `src/pages/UrlParamAnalysis.tsx` (route `/:urlParam/analysis/:slug`) | Loads the owner's profile and the manifest entry. Renders `PersonalHeader`, the analysis frame, and `PersonalFooter`. Sets the page title, description and canonical URL. |
| Frame | `src/components/notion/components/HostedVisualEmbed.tsx` | Full-width iframe that grows to the analysis height, so there is no inner scrollbar. |
| Helper script | `public/analysis/embed.js` | Loaded by every analysis. Inside a frame, it hides elements marked `data-embed-hide` and reports the page height to Vista (`postMessage`, type `vista-visual:height`, same origin only). Opened directly, it does nothing. |

If the slug is not in the manifest, or the username has no profile, the visitor is redirected (to `/{username}/vista` or `/`) with an error toast, the same as for a missing post.

## Steps to publish a new analysis

1. **Pick a slug.** Use lowercase words joined by hyphens, e.g. `sme-lending`. The slug becomes part of the public URL, so don't rename it after publishing.
2. **Copy the file** to `public/analysis/{username}/{slug}/index.html`. Use the lowercase username. Keep the original source file where it is.
3. **Make it self-contained.** Inline CSS and JS, or keep any assets inside the same folder and reference them with relative paths. Avoid third-party scripts and trackers (Vista is privacy-first).
4. **Add the helper script** just before `</body>`:
   ```html
   <script src="/analysis/embed.js"></script>
   ```
5. **Mark duplicate chrome** with `data-embed-hide`. A sticky in-page nav usually goes, because Vista's header already sits above it. Keep the analysis's own title and intro, because the page has no other title.
6. **Add an entry** to `public/analysis/manifest.json`:
   ```json
   {
     "owner": "quintice",
     "slug": "sme-lending",
     "title": "UK SME Lending — the market on one page",
     "description": "One or two sentences. Used for search results and share previews.",
     "publishedAt": "2026-11-04"
   }
   ```
   `title` becomes the browser tab and share title, formatted as `{title} - {username} | Vista Content Platform`.
7. **Avoid full-viewport layouts** inside the analysis (`100vh` sections, its own inner scroll areas). The frame takes the content height, so `100vh` creates a feedback loop.
8. **Verify locally** (see below), then deploy.

## Local verification

```bash
bun run build && bun run preview
```

- Open `http://localhost:4173/{username}/analysis/{slug}/`. You should see the personal header, the analysis with no inner scrollbar, and the personal footer, with no `data-embed-hide` elements showing.
- Open `http://localhost:4173/{username}/analysis/wrong-slug/`. It should redirect to `/{username}/vista`.

## Embedding in a Notion post

To show an analysis inside an article, add an `/embed` block with the page URL, `https://vista.qwizai.com/{username}/analysis/{slug}/`. `getHostedVisualPath` turns it into the raw file path, so the post frames only the analysis, not a second copy of the site. The raw `/analysis/...` URL works too. In dev and preview, a `vista.qwizai.com` URL loads the local copy.

Inside a post the analysis shows its own title, so consider adding `data-embed-hide` to that title if the post already has one.

## Configuration this depends on

- `vercel.json`
  - The SPA rewrite excludes the `/analysis/` prefix, so the raw files are not routed to `index.html`. The pages at `/{username}/analysis/...` still go to the SPA.
  - `/analysis/(.*)` sends `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`, overriding the site-wide `DENY`. Without this, browsers block the frame. It also sends `X-Robots-Tag: noindex`, so search engines index the Vista page, not the raw file.
- `src/components/notion/utils/hosted-visual.ts`: `VISUALS_HOSTS` lists the production host. Add any new custom domain that serves this app.
- `src/App.tsx`: `analysis` is in the reserved-route list, so no user should take `analysis` as their URL name.

## Not covered yet

- Analysis pages are not in the sitemap (`generate-sitemap` reads posts from Supabase only).
- Visits are not counted (`increment_visitor_count` works on Supabase content items only).
- There is no list of analysis pages on the personal site. Link to them from a post or the home page for now.

## Registry

`public/analysis/manifest.json` is the registry. Every published analysis must have an entry there, or its page will not load.
