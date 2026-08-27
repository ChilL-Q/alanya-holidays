import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { forumService, type ForumStats } from "@/api-services/forum.service";
import UpcomingEventsCarousel from "./UpcomingEventsCarousel";

export default function HeroSection() {
  const [stats, setStats] = useState<ForumStats | null>(null);

  useEffect(() => {
    let mounted = true;
    forumService.getForumStats().then((data) => {
      if (mounted) setStats(data);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const totalMembers = (stats?.totalMembers || stats?.activeMembers) || 12450;
  const totalThreads = (stats?.totalDiscussions || stats?.totalPosts) || 3820;
  const questionsAnswered = stats?.questionsAnswered || 9400;
  const localExperts = stats?.localExperts || 142;
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.webp"
          alt="Alanya coastline"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/hero-bg.jpg";
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 py-20 pt-32 pb-28">
        <div className="max-w-4xl">
          {/* Social Proof */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex -space-x-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Traveler Sarah"
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Traveler Alex"
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Traveler Elena"
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
            </div>
            <span className="text-white/90 text-sm font-medium">
              {totalMembers.toLocaleString()} travelers discovering Alanya
            </span>
          </div>

          {/* Title */}
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-6">
            <span className="font-bold">ALANYA</span>
            <br />
            <span className="font-light italic">HOLIDAYS</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/80 text-lg md:text-xl max-w-xl leading-relaxed mb-10">
            Plan your perfect Mediterranean escape. Discover hidden coves,
            rooftop restaurants, and local secrets — all shared by travelers who
            know Alanya best.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-foreground-900 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Explore Alanya
              <i className="ri-compass-3-line"></i>
            </Link>
          </div>

          {/* This Week's Events Carousel */}
          <UpcomingEventsCarousel />
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-8 left-4 right-4 md:left-8 md:right-8 lg:left-12 lg:right-12">
          <div className="flex flex-wrap gap-6 md:gap-10">
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {totalMembers.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Travelers</p>
            </div>
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {totalThreads.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Experiences</p>
            </div>
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {questionsAnswered.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Reviews</p>
            </div>
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {localExperts.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Local Experts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}