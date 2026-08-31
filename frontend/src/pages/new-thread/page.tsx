import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import NewThreadHero from "./components/NewThreadHero";
import ThreadForm from "./components/ThreadForm";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function NewThreadPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/register", {
        replace: true,
        state: { from: location },
      });
    }
  }, [loading, location, navigate, user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <NewThreadHero />

      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
        <ThreadForm />

        {/* Guidelines sidebar */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-background-50 rounded-2xl border border-background-200/70 p-5 md:p-6">
            <h3 className="font-heading text-sm md:text-base text-foreground-900 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-accent-100 rounded-lg">
                <i className="ri-lightbulb-line text-accent-600 text-sm"></i>
              </div>
              {t("public.discussionTips")}
            </h3>
            <ul className="space-y-3">
              {[
                {
                  icon: "ri-search-line",
                  text: "Search first — someone might have already asked your question.",
                },
                {
                  icon: "ri-focus-2-line",
                  text: "Pick the right category and, if available, the most relevant topic so the right people see your post.",
                },
                {
                  icon: "ri-file-text-line",
                  text: "Write a descriptive title — avoid vague ones like \"Help!\" or \"Question\".",
                },
                {
                  icon: "ri-chat-smile-2-line",
                  text: "Be kind and respectful. Our community thrives on positivity.",
                },
              ].map((tip) => (
                <li
                  key={tip.text}
                  className="flex items-start gap-3 text-sm text-foreground-600"
                >
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className={`${tip.icon} text-foreground-400 text-sm`}></i>
                  </div>
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <section className="w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl p-8 md:p-10 text-center">
          <h3 className="font-heading text-xl md:text-2xl text-background-50 mb-3">
              {t("public.notReadyToPost")}
          </h3>
          <p className="text-background-50/80 text-sm md:text-base mb-6">
            {t("public.browseDiscussionsDescription")}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-background-50 text-accent-600 text-sm font-medium hover:bg-background-50/90 transition-colors whitespace-nowrap"
          >
            {t("public.browseAllCategories")}
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </section>
    </div>
  );
}
