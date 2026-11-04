import { useQuery } from "@tanstack/react-query";
import { getProfileByUrlParam } from "@/services/urlParamService";
import { AnalysisEntry, getAnalysisEntry } from "@/services/analysisService";

type OwnerProfile = NonNullable<Awaited<ReturnType<typeof getProfileByUrlParam>>>;

interface AnalysisPageData {
  profile: OwnerProfile | null;
  entry: AnalysisEntry | null;
}

/** Loads the site owner's profile and the manifest entry for one analysis page. */
export const useAnalysisPage = (urlParam: string | undefined, slug: string | undefined) =>
  useQuery<AnalysisPageData>({
    queryKey: ["analysis-page", urlParam, slug],
    enabled: Boolean(urlParam && slug),
    queryFn: async () => {
      const [profile, entry] = await Promise.all([
        getProfileByUrlParam(urlParam as string),
        getAnalysisEntry(urlParam as string, slug as string),
      ]);
      return { profile, entry };
    },
  });
