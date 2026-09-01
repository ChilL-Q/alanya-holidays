import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import { forumService, type ForumStats, type ForumMember } from "@/api-services/forum.service";
import { useTranslation } from "react-i18next";
import "@/i18n";

const values = [
  {
    icon: "ri-heart-3-line",
    title: "services.about.value.community",
    description: "services.about.value.communityDesc",
  },
  {
    icon: "ri-compass-3-line",
    title: "services.about.value.local",
    description: "services.about.value.localDesc",
  },
  {
    icon: "ri-shake-hands-line",
    title: "services.about.value.inclusive",
    description: "services.about.value.inclusiveDesc",
  },
  {
    icon: "ri-lightbulb-flash-line",
    title: "services.about.value.curiosity",
    description: "services.about.value.curiosityDesc",
  },
];

const milestones = [
  {
    year: "2023",
    title: "services.about.milestone.idea",
    description: "services.about.milestone.ideaDesc",
  },
  {
    year: "2024",
    title: "services.about.milestone.launch",
    description: "services.about.milestone.launchDesc",
  },
  {
    year: "2025",
    title: "services.about.milestone.growth",
    description: "services.about.milestone.growthDesc",
  },
  {
    year: "2026",
    title: "services.about.milestone.thriving",
    description: "services.about.milestone.thrivingDesc",
  },
];

export default function AboutPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [communityLeaders, setCommunityLeaders] = useState<ForumMember[]>([]);

  useEffect(() => {
    let mounted = true;
    forumService.getForumStats().then((data) => {
      if (mounted && data) setStats(data);
    }).catch(() => {});

    forumService.getMembers().then((membersList) => {
      if (mounted && membersList) {
        const leaders = membersList
          .filter((m) => m.role === "Community Leader" || m.role === "Top Contributor" || m.role === "Cultural Ambassador")
          .slice(0, 4);
        setCommunityLeaders(leaders.length > 0 ? leaders : membersList.slice(0, 4));
      }
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const totalMembers = stats?.totalMembers ?? stats?.activeMembers ?? 18420;
  const totalThreads = stats?.totalDiscussions ?? stats?.totalPosts ?? 3820;
  const totalReplies = stats?.questionsAnswered ?? 9420;
  const onlineNow = stats?.localExperts ?? 142;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative w-full h-[280px] md:h-[380px] overflow-hidden">
          <PageHeroImage
            page="about"
            alt="Alanya Holidays — About Us"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/55 via-foreground-950/30 to-foreground-950/75"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/"
                className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
              >
                {t("services.home")}
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">{t("services.about.breadcrumb")}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">
                  {t("services.about.title")}
                </h1>
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  {t("services.about.hero")}
                </p>
              </div>

              <div className="flex items-center gap-5 md:gap-8 shrink-0">
                <div className="text-center">
                  <p className="text-white text-xl md:text-2xl font-semibold">
                    {totalMembers.toLocaleString()}
                  </p>
                  <p className="text-white/50 text-xs">{t("services.about.members")}</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white text-xl md:text-2xl font-semibold">
                    {(totalThreads / 1000).toFixed(1)}k
                  </p>
                  <p className="text-white/50 text-xs">{t("services.about.discussions")}</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white text-xl md:text-2xl font-semibold">
                    {onlineNow.toLocaleString()}
                  </p>
                  <p className="text-white/50 text-xs">{t("services.about.onlineNow")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-8">
              <i className="ri-community-line text-primary-500 text-sm"></i>
              <span className="text-sm font-medium text-foreground-700">{t("services.about.ourStory")}</span>
            </div>

            <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl text-foreground-900 leading-tight mb-6">
              {t("services.about.storyTitle")}
            </h2>

            <p className="text-foreground-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6">
              {t("services.about.storyOne")}
            </p>

            <p className="text-foreground-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {t("services.about.storyTwo")}
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-background-100">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: totalMembers.toLocaleString(), label: "services.about.members", icon: "ri-user-3-line" },
              { value: totalThreads.toLocaleString(), label: "services.about.threads", icon: "ri-discuss-line" },
              { value: totalReplies.toLocaleString(), label: "services.about.replies", icon: "ri-chat-3-line" },
              { value: onlineNow.toLocaleString(), label: "services.about.onlineNow", icon: "ri-flashlight-line" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-white">
                <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-accent-100 mb-4">
                  <i className={`${stat.icon} text-accent-600 text-xl`}></i>
                </div>
                <p className="font-heading text-3xl md:text-4xl text-foreground-900 font-bold mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-foreground-500">{t(stat.label)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-star-line text-accent-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">{t("services.about.whatWeStandFor")}</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
                {t("services.about.coreValues")}
              </h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                {t("services.about.valuesIntro")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-background-200/70 hover:border-primary-200/60 transition-all"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-100 mb-4">
                    <i className={`${v.icon} text-primary-600 text-lg`}></i>
                  </div>
                  <h3 className="font-heading text-lg text-foreground-900 mb-2">{t(v.title)}</h3>
                  <p className="text-sm text-foreground-500 leading-relaxed">{t(v.description)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Leaders */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-100">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-group-line text-secondary-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">{t("services.about.heart")}</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
                {t("services.about.leaders")}
              </h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                {t("services.about.leadersIntro")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {communityLeaders.map((leader) => (
                <div
                  key={leader.id}
                  className="bg-white rounded-2xl p-6 text-center border border-background-200/70 hover:border-primary-200/60 transition-all"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-background-200 mb-4">
                    <img
                      src={leader.avatar}
                      alt={leader.fullName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-0.5">
                    {leader.fullName}
                  </h3>
                  <p className="text-xs text-primary-500 font-medium mb-2">@{leader.username}</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-medium mb-3">
                    {leader.role}
                  </span>
                  <p className="text-xs text-foreground-500 leading-relaxed line-clamp-3">
                    {leader.bio}
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-background-100">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground-900">{leader.posts.toLocaleString()}</p>
                      <p className="text-xs text-foreground-400">{t("services.about.posts")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-timeline-view text-primary-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">{t("services.about.journey")}</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
                {t("services.about.started")}
              </h2>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-background-200 md:-translate-x-px"></div>

              <div className="space-y-10">
                {milestones.map((milestone, idx) => (
                  <div
                    key={milestone.year}
                    className={`relative flex flex-col md:flex-row gap-6 md:gap-10 ${
                      idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Dot */}
                    <div className="absolute left-4 md:left-1/2 top-1 w-3 h-3 rounded-full bg-primary-500 -translate-x-1/2 z-10 ring-4 ring-background-50"></div>

                    {/* Content */}
                    <div className={`pl-12 md:pl-0 md:w-1/2 ${idx % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"}`}>
                      <span className="inline-block px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-bold mb-3">
                        {milestone.year}
                      </span>
                      <h3 className="font-heading text-lg text-foreground-900 mb-2">{t(milestone.title)}</h3>
                      <p className="text-sm text-foreground-500 leading-relaxed">{t(milestone.description)}</p>
                    </div>

                    {/* Spacer for the other side */}
                    <div className="hidden md:block md:w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
              {t("services.about.ctaTitle")}
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8">
              {t("services.about.cta", { count: totalMembers.toLocaleString() })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-full text-sm font-semibold hover:bg-white/95 transition-colors whitespace-nowrap"
              >
                {t("services.about.createProfile")}
                <i className="ri-arrow-right-line"></i>
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-full text-sm font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                {t("services.about.exploreCategories")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
