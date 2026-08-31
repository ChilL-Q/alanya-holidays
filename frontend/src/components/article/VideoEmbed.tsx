import { useTranslation } from "react-i18next";
import "@/i18n";

export interface VideoEmbedProps {
  src: string;
  provider?: "youtube" | "vimeo" | "html5";
  title?: string;
  caption?: string;
  poster?: string;
  trackSrc?: string;
  trackLabel?: string;
  trackLang?: string;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([^"&?/ ]{11})/i;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)|player\.vimeo\.com\/video\/)(\d+)/i;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

function isValidHttpOrPathUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("./")
  );
}

export default function VideoEmbed({
  src,
  provider,
  title,
  caption,
  poster,
  trackSrc,
  trackLabel = "English",
  trackLang = "en",
  className = "",
}: VideoEmbedProps) {
  const { t } = useTranslation();
  if (!src || typeof src !== "string" || !src.trim() || !isValidHttpOrPathUrl(src.trim())) {
    return (
      <div
        className={`p-6 text-center text-sm text-foreground-500 dark:text-foreground-400 bg-background-100 dark:bg-background-800/60 rounded-2xl border border-dashed border-background-300 dark:border-background-700 my-6 ${className}`}
      >
        <p className="font-medium">{t("public.videoUnavailable")}</p>
        {caption && <p className="text-xs text-foreground-400 mt-1">{caption}</p>}
      </div>
    );
  }

  const cleanSrc = src.trim();
  const effectiveTitle = title || caption || "Embedded video player";

  // Determine provider if not explicitly given
  const isExplicitYoutube = provider === "youtube";
  const isExplicitVimeo = provider === "vimeo";
  const isExplicitHtml5 = provider === "html5";

  const youtubeId = extractYouTubeId(cleanSrc);
  const vimeoId = extractVimeoId(cleanSrc);

  if (isExplicitYoutube || (!provider && youtubeId)) {
    if (!youtubeId) {
      return (
        <div
          className={`p-6 text-center text-sm text-foreground-500 dark:text-foreground-400 bg-background-100 dark:bg-background-800/60 rounded-2xl border border-dashed border-background-300 dark:border-background-700 my-6 ${className}`}
        >
          <p className="font-medium">{t("public.videoUnavailable")}</p>
          {caption && <p className="text-xs text-foreground-400 mt-1">{caption}</p>}
        </div>
      );
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;

    return (
      <figure className={`my-6 ${className}`}>
        <div
          role="region"
          aria-label={effectiveTitle}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 shadow-md"
        >
          <iframe
            src={embedUrl}
            title={effectiveTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-foreground-500 dark:text-foreground-400">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (isExplicitVimeo || (!provider && vimeoId)) {
    if (!vimeoId) {
      return (
        <div
          className={`p-6 text-center text-sm text-foreground-500 dark:text-foreground-400 bg-background-100 dark:bg-background-800/60 rounded-2xl border border-dashed border-background-300 dark:border-background-700 my-6 ${className}`}
        >
          <p className="font-medium">{t("public.videoUnavailable")}</p>
          {caption && <p className="text-xs text-foreground-400 mt-1">{caption}</p>}
        </div>
      );
    }

    const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;

    return (
      <figure className={`my-6 ${className}`}>
        <div
          role="region"
          aria-label={effectiveTitle}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 shadow-md"
        >
          <iframe
            src={embedUrl}
            title={effectiveTitle}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-foreground-500 dark:text-foreground-400">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (
    isExplicitHtml5 ||
    (!provider && cleanSrc.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i))
  ) {
    return (
      <figure className={`my-6 ${className}`}>
        <div
          role="region"
          aria-label={effectiveTitle}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 shadow-md"
        >
          <video
            src={cleanSrc}
            poster={poster}
            controls
            playsInline
            className="w-full h-full object-cover"
          >
            {trackSrc && (
              <track
                src={trackSrc}
                kind="subtitles"
                srcLang={trackLang}
                label={trackLabel}
                default
              />
            )}
            {t("public.videoUnsupported")}
          </video>
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-foreground-500 dark:text-foreground-400">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Fallback for unrecognized video URLs
  return (
    <div
      className={`p-6 text-center text-sm text-foreground-500 dark:text-foreground-400 bg-background-100 dark:bg-background-800/60 rounded-2xl border border-dashed border-background-300 dark:border-background-700 my-6 ${className}`}
    >
      <p className="font-medium">{t("public.videoUnavailable")}</p>
      {caption && <p className="text-xs text-foreground-400 mt-1">{caption}</p>}
    </div>
  );
}
