
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content is database-driven and changes constantly, so this sitemap is generated
// fresh on every request rather than baked into a static file. To avoid hammering
// the DB on every crawler hit (and to give the "periodic update" behavior we
// actually want), we rely on standard HTTP caching instead of a cron job: any
// cache sitting in front of this function (Vercel's proxy, browsers, the crawler
// itself) can serve a previous response for up to CACHE_MAX_AGE_SECONDS before
// it needs to ask us again.
const CACHE_MAX_AGE_SECONDS = 60 * 60; // 1 hour
const STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24; // ok to serve stale for up to a day while refreshing

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod: string | null | undefined, changefreq: string, priority: string): string {
  const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : '';
  return `  <url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const siteUrl = (Deno.env.get('SITE_URL') || 'https://vista.qwizai.com').replace(/\/$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Every personal page (/:urlParam, /:urlParam/vista) needs a url_param.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, url_param, created_at')
      .not('url_param', 'is', null);

    if (profilesError) throw profilesError;

    const urlParamByProfileId = new Map<string, string>();
    for (const profile of profiles ?? []) {
      if (profile.url_param) urlParamByProfileId.set(profile.id, profile.url_param);
    }

    // Every publicly visible article (/:urlParam/vista/:contentId) -- same "not
    // removed" filter the app itself uses to decide what's publicly listed.
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('id, user_id, updated_at, created_at')
      .neq('notion_page_status', 'removed');

    if (contentError) throw contentError;

    const entries: string[] = [
      urlEntry(`${siteUrl}/`, null, 'weekly', '1.0'),
      urlEntry(`${siteUrl}/vista`, null, 'daily', '0.9'),
      urlEntry(`${siteUrl}/about`, null, 'monthly', '0.5'),
    ];

    for (const profile of profiles ?? []) {
      if (!profile.url_param) continue;
      entries.push(urlEntry(`${siteUrl}/${profile.url_param}`, profile.created_at, 'weekly', '0.8'));
      entries.push(urlEntry(`${siteUrl}/${profile.url_param}/vista`, profile.created_at, 'daily', '0.8'));
    }

    for (const item of contentItems ?? []) {
      const urlParam = item.user_id ? urlParamByProfileId.get(item.user_id) : undefined;
      if (!urlParam) continue; // owner has no public url_param -- not a reachable page
      entries.push(
        urlEntry(`${siteUrl}/${urlParam}/vista/${item.id}`, item.updated_at || item.created_at, 'weekly', '0.7')
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE_SECONDS}, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' } }
    );
  }
});
