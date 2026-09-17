import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Accessible name (aria-label/title), and the visible text when `showLabel` is true. */
  label?: string;
  /** Show `label` as visible text next to the arrow. Defaults to false (icon only) --
   * the label is still exposed to assistive tech via aria-label either way. */
  showLabel?: boolean;
  /** Route to use if there's no previous page in history (e.g. a shared/direct link). */
  fallbackTo?: string;
  className?: string;
}

// Generic "go back" control meant to be reused across pages/headers. Prefers browser
// history (`navigate(-1)`) so it always returns to wherever the user actually came
// from, and only falls back to a fixed route when there's nothing to go back to.
export const BackButton = ({ label = "Back", showLabel = false, fallbackTo, className }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
    } else if (fallbackTo) {
      navigate(fallbackTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <ArrowLeft className={cn("h-4 w-4", showLabel && "mr-2")} />
      {showLabel && label}
    </Button>
  );
};

export default BackButton;
