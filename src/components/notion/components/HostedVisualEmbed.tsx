import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { VISUAL_HEIGHT_MESSAGE } from "../utils/hosted-visual";

interface HostedVisualEmbedProps {
  src: string;
  caption?: string;
  /** Accessible iframe title; falls back to the caption. */
  title?: string;
  className?: string;
}

interface VisualHeightMessage {
  type: typeof VISUAL_HEIGHT_MESSAGE;
  height: number;
}

const INITIAL_HEIGHT = 600;

const isHeightMessage = (data: unknown): data is VisualHeightMessage =>
  typeof data === "object" &&
  data !== null &&
  (data as VisualHeightMessage).type === VISUAL_HEIGHT_MESSAGE &&
  typeof (data as VisualHeightMessage).height === "number" &&
  (data as VisualHeightMessage).height > 0;

// Full-width iframe that grows to the visual's content height, so the post scrolls as one page.
export const HostedVisualEmbed: React.FC<HostedVisualEmbedProps> = ({ src, caption, title, className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(INITIAL_HEIGHT);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (isHeightMessage(event.data)) setHeight(Math.ceil(event.data.height));
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <figure className={cn("my-6", className)}>
      <iframe
        ref={iframeRef}
        src={src}
        title={title || caption || "Interactive visual"}
        style={{ height }}
        className="block w-full border-0"
        loading="lazy"
        scrolling="no"
      />
      {caption && (
        <figcaption className="text-sm text-center text-muted-foreground mt-2">{caption}</figcaption>
      )}
    </figure>
  );
};
