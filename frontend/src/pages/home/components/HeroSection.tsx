import { Link } from "react-router-dom";
import { forumStats } from "@/mocks/stats";
import UpcomingEventsCarousel from "./UpcomingEventsCarousel";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://static.readdy.ai/image/0b82ee2c96b338eb8e9b3f793da1836a/03ad30276061ca38b7431e701800a900.jpeg"
          alt="Alanya coastline"
          className="w-full h-full object-cover"
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
                src="https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20young%20woman%20warm%20smile%20clean%20background%20travel%20blogger%20editorial%20photography&width=80&height=80&seq=hero-avatar-1&orientation=squarish"
                alt="Member"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <img
                src="https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20young%20man%20beard%20warm%20smile%20clean%20background%20travel%20enthusiast%20editorial%20photography&width=80&height=80&seq=hero-avatar-2&orientation=squarish"
                alt="Member"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <img
                src="https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20middle%20aged%20woman%20friendly%20smile%20clean%20background%20traveler%20editorial%20photography&width=80&height=80&seq=hero-avatar-3&orientation=squarish"
                alt="Member"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
            </div>
            <span className="text-white/90 text-sm font-medium">
              {forumStats.totalMembers.toLocaleString()} travelers discovering Alanya
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
              to="/planner?quickstart=suggested-1"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-foreground-900 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Quick Start
              <i className="ri-rocket-2-line"></i>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-full font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Plan Your Holiday
              <i className="ri-arrow-right-line"></i>
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-full font-semibold text-sm hover:bg-white/20 transition-colors"
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
                {forumStats.totalMembers.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Travelers</p>
            </div>
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {forumStats.totalThreads.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Experiences</p>
            </div>
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {forumStats.totalReplies.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Reviews</p>
            </div>
            <div>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {forumStats.onlineNow.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Exploring Now</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}