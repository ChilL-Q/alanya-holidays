import { useState } from "react";
import { useLocation } from "react-router-dom";
import SubmitContentModal from "./SubmitContentModal";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { useFloatingWidgetVisibility } from "./useFloatingWidgetVisibility";

export default function CreatorUgcFloatingWidget() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pathname } = useLocation();
  const useCompactTrigger = pathname.startsWith("/events");
  const isVisible = useFloatingWidgetVisibility();

  return (
    <>
      {isVisible && (
      <div
        data-floating-widget="community"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[calc(1rem+env(safe-area-inset-left))] z-40 max-w-[calc(100vw-2rem)] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:left-[calc(1.5rem+env(safe-area-inset-left))] sm:max-w-[calc(100vw-3rem)]"
      >
        {!isExpanded ? (
          /* Collapsed Trigger Pill */
          <button
            onClick={() => setIsExpanded(true)}
            className={`group border border-background-200 dark:border-background-700 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 ease-out backdrop-blur-md cursor-pointer max-sm:w-12 max-sm:h-12 max-sm:p-0 max-sm:justify-center max-sm:rounded-full ${useCompactTrigger ? "flex items-center justify-center w-12 h-12 rounded-full bg-white/95 dark:bg-background-900/95 text-foreground-900 dark:text-background-50" : "flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 dark:bg-background-900/95 text-foreground-900 dark:text-background-50"}`}
            aria-label={t("public.openCommunityWidget")}
            title={t("public.shareCommunity")}
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-sm transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-6">
              <i className="ri-chat-new-line text-sm"></i>
            </span>
            {!useCompactTrigger && (
              <>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold font-heading text-foreground-900 dark:text-background-50">
                    {t("public.shareCommunity")}
                  </span>
                  <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">
                    {t("public.postTipStoryQuestion")}
                  </span>
                </div>
                <i className="hidden sm:block ri-arrow-up-s-line text-foreground-400 group-hover:-translate-y-0.5 transition-transform duration-300 ease-out text-sm"></i>
              </>
            )}
          </button>
        ) : (
          /* Expanded Floating Banner Card */
          <div className="relative w-80 sm:w-96 rounded-2xl bg-white dark:bg-background-900 border border-background-200 dark:border-background-800 shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            {/* Header / Banner accent */}
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-primary-500/15 border-b border-background-100 dark:border-background-800 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
                  <i className="ri-chat-new-line text-base"></i>
                </span>
                <div>
                  <h3 className="text-sm font-bold font-heading text-foreground-900 dark:text-background-50">
                    {t("public.shareCommunity")}
                  </h3>
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {t("public.postToForum")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-foreground-400 hover:text-foreground-700 dark:hover:text-background-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label={t("public.collapseBanner")}
              >
                <i className="ri-close-line text-base"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-foreground-600 dark:text-background-300 leading-relaxed">
                {t("public.communityPrompt")}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-foreground-700 dark:text-background-200 pt-1">
                <div className="flex items-center gap-1.5">
                  <i className="ri-check-line text-emerald-500 font-bold"></i>
                  <span>{t("public.anyForumCategory")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-check-line text-emerald-500 font-bold"></i>
                  <span>{t("public.optionalMedia")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-check-line text-emerald-500 font-bold"></i>
                  <span>{t("public.signInToPublish")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-check-line text-emerald-500 font-bold"></i>
                  <span>{t("public.liveForEveryone")}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-primary-600 text-white font-semibold text-xs shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  aria-label={t("public.openShareModal")}
                >
                  <i className="ri-edit-2-line text-sm"></i>
                  {t("public.writePost")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Submission Modal */}
      <SubmitContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
