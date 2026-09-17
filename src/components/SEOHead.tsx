
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
  hreflang?: Array<{ lang: string; url: string }>;
  noIndex?: boolean;
  /** Shown as og:site_name and the author meta tag. Defaults to the platform's own
   * name -- pages representing a specific creator's content (e.g. a personal Vista
   * site or one of their articles) should pass that creator's name instead, so
   * shares/attribution point at the actual creator rather than the platform. */
  siteName?: string;
}

const SEOHead = ({
  title = "Vista Content Platform - AI-Powered Content Discovery",
  description = "Discover and explore curated content through our AI-powered platform. Find relevant articles, insights, and resources tailored to your interests.",
  keywords = ["content", "AI", "discovery", "articles", "insights", "platform"],
  canonicalUrl,
  ogImage = "/placeholder.svg",
  ogType = "website",
  structuredData,
  hreflang = [],
  noIndex = false,
  siteName = "Vista Content Platform"
}: SEOHeadProps) => {
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // og:image/twitter:image must be an absolute URL -- most social crawlers (Facebook,
  // LINE, Twitter/X) silently drop the image if it's given as a relative path like
  // "/og-image.png". Cover/preview images already come back as full Supabase Storage
  // URLs, so this only actually rewrites the plain "/og-image.png"-style fallbacks.
  const absoluteOgImage = /^https?:\/\//.test(ogImage)
    ? ogImage
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Robots Meta */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow" />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      
      {/* Hreflang Tags */}
      {hreflang.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content={siteName} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="theme-color" content="#f5f5dc" />
    </Helmet>
  );
};

export default SEOHead;
