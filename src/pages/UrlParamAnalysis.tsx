import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PersonalHeader from "@/components/PersonalHeader";
import PersonalFooter from "@/components/PersonalFooter";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/components/ui/sonner";
import { HostedVisualEmbed } from "@/components/notion/components/HostedVisualEmbed";
import { useAnalysisPage } from "@/hooks/useAnalysisPage";
import { getAnalysisFilePath, getAnalysisPagePath } from "@/services/analysisService";
import { truncateDescription } from "@/lib/utils";

// /:urlParam/analysis/:slug -- a standalone analysis page shown inside the owner's personal site.
const UrlParamAnalysis = () => {
  const { urlParam, slug } = useParams<{ urlParam: string; slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAnalysisPage(urlParam, slug);

  useEffect(() => {
    if (!urlParam || !slug) {
      navigate("/");
      return;
    }
    if (isError) {
      toast.error("Error loading analysis");
      navigate(`/${urlParam}/vista`);
      return;
    }
    if (!data) return;
    if (!data.profile) {
      toast.error(`The page for /${urlParam} does not exist.`);
      navigate("/");
      return;
    }
    if (!data.entry) {
      toast.error("Analysis not found");
      navigate(`/${urlParam}/vista`);
    }
  }, [urlParam, slug, data, isError, navigate]);

  const profile = data?.profile;
  const entry = data?.entry;
  const footer = (
    <PersonalFooter
      userLanguage={profile?.default_language}
      supportedLanguages={profile?.supported_ai_languages}
    />
  );

  if (isLoading || !urlParam || !slug || !profile || !entry) {
    return (
      <div className="min-h-screen bg-white">
        <SEOHead title="Loading Analysis - Vista Content Platform" noIndex={true} />
        <PersonalHeader />
        <main className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </main>
        {footer}
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}${getAnalysisPagePath(urlParam, slug)}`;
  const description = truncateDescription(entry.description);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={`${entry.title} - ${urlParam} | Vista Content Platform`}
        description={description}
        canonicalUrl={canonicalUrl}
        ogType="article"
        siteName={urlParam}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: entry.title,
          description,
          url: canonicalUrl,
          datePublished: entry.publishedAt,
          author: { "@type": "Person", name: urlParam },
          publisher: { "@type": "Organization", name: "Vista Content Platform" },
        }}
      />
      <PersonalHeader backLabel="Back to All Content" backFallbackTo={`/${urlParam}/vista`} />

      <main>
        <HostedVisualEmbed src={getAnalysisFilePath(entry.owner, entry.slug)} title={entry.title} className="m-0" />
      </main>

      {footer}
    </div>
  );
};

export default UrlParamAnalysis;
