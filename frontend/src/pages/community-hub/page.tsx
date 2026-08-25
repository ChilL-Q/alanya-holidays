import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { forumService, type ForumStats } from "@/api-services/forum.service";

const quickLinks = [
  { icon: "ri-discuss-line", title: "Categories", description: "Browse all discussion categories", link: "/categories", color: "primary" },
  { icon: "ri-calendar-event-line", title: "Events", description: "Upcoming meetups and activities", link: "/events", color: "accent" },
];

export default function CommunityHubPage() {
  const [stats, setStats] = useState<ForumStats | null>(null);

  useEffect(() => {
    let mounted = true;
    forumService.getForumStats().then((data) => {
      if (mounted && data) setStats(data);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const totalMembers = stats?.totalMembers ?? stats?.activeMembers ?? 18400;

  return (
    <>
      <Navbar />
      <main>
        <section className="relative w-full h-[280px] md:h-[380px] overflow-hidden">
          <img
            src="/images/placeholder-business.svg"
            alt="Alanya Holidays Community Hub"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/55 via-foreground-950/30 to-foreground-950/75"></div>

          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-3 tracking-tight">
                Community Hub
              </h1>
              <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto">
                Join {totalMembers.toLocaleString()}+ travelers, expats, and locals in Alanya.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Access Cards */}
        <section className="py-14 md:py-20 px-4 md:px-8 lg:px-12 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-community-line text-primary-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">Welcome Home</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">Everything Starts Here</h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                Your launchpad into the Alanya Holidays community. Jump into discussions, find events, or just explore.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.link}
                  className="bg-white rounded-2xl p-6 md:p-7 border border-background-200/70 hover:border-primary-200/60 transition-all group"
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 ${
                    link.color === "primary" ? "bg-primary-100 group-hover:bg-primary-200" :
                    link.color === "accent" ? "bg-accent-100 group-hover:bg-accent-200" :
                    "bg-secondary-100 group-hover:bg-secondary-200"
                  } transition-colors`}>
                    <i className={`${link.icon} ${
                      link.color === "primary" ? "text-primary-600" :
                      link.color === "accent" ? "text-accent-600" :
                      "text-secondary-600"
                    } text-xl`}></i>
                  </div>
                  <h3 className="font-heading text-lg text-foreground-900 mb-1.5">{link.title}</h3>
                  <p className="text-sm text-foreground-500">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-background-100">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-4">Ready to join the conversation?</h2>
            <p className="text-foreground-500 text-sm md:text-base mb-8">
              Create your free account and become part of the Alanya Holidays community in less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                Join Community
                <i className="ri-arrow-right-line"></i>
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 border border-foreground-200 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
              >
                Explore First
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}