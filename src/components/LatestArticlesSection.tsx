import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LatestArticlesPreview } from "@/components/LatestArticlesPreview";
import { useLatestContentItems } from "@/hooks/use-latest-content-items";

interface LatestArticlesSectionProps {
  /** Scope to one creator's content + link "Explore" to their vista page; omit for
   * the global latest across all users, linking to the global /vista page. */
  urlParam?: string;
}

// An independent section (not nested inside PurposeInput) that fades/slides into
// view as the user scrolls down to it, showing the 3 latest articles plus an
// "Explore" button through to the full content list. Hides itself entirely if
// there's nothing to show, rather than leaving an empty gap on the page.
export const LatestArticlesSection = ({ urlParam }: LatestArticlesSectionProps) => {
  const navigate = useNavigate();
  const { items, isLoading } = useLatestContentItems(urlParam, 3);
  const contentPath = urlParam ? `/${urlParam}/vista` : "/vista";

  if (isLoading || items.length === 0) return null;

  return (
    <motion.section
      // Opaque background: on the personal page this sits over a `fixed inset-0`
      // Hero, so without one, the Hero's title stays visible showing through here
      // once you've scrolled past it. beige-50 (not beige-100) specifically, to
      // match PurposeInput's own bottom WaveTransition (fill-beige-50) -- otherwise
      // the wave's color and this section's background don't line up, leaving a
      // visible seam right where the wave ends.
      className="bg-beige-50 py-20 md:py-[120px] px-4 md:px-8 lg:px-16 pointer-events-auto"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto w-full">
        <LatestArticlesPreview items={items} urlParam={urlParam} />

        <div className="flex justify-center mt-10">
          {/* Same styling as PurposeInput's Submit button. */}
          <Button
            size="lg"
            onClick={() => navigate(contentPath)}
            className="gap-2 bg-beige-800 hover:bg-beige-700 text-white"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.section>
  );
};

export default LatestArticlesSection;
