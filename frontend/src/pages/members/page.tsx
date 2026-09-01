import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import MemberHero from "./components/MemberHero";
import MemberCard from "./components/MemberCard";
import MemberFilters from "./components/MemberFilters";
import { forumService, type ForumMember } from "@/api-services/forum.service";
import ErrorState from "@/components/base/ErrorState";
import EmptyState from "@/components/base/EmptyState";

const topCountries = [
  { name: "Germany", count: 4120 },
  { name: "United Kingdom", count: 3280 },
  { name: "Netherlands", count: 2150 },
  { name: "Sweden", count: 1840 },
  { name: "Norway", count: 1620 },
  { name: "Türkiye", count: 3890 },
];

export default function MembersPage() {
  const [membersList, setMembersList] = useState<ForumMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("posts");

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await forumService.getMembers();
      setMembersList(data);
    } catch {
      setFetchError("Failed to load community members. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    let result = [...membersList];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.bio.toLowerCase().includes(q)
      );
    }
    // Role filter
    if (roleFilter) {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Sort
    switch (sortBy) {
      case "posts":
        result.sort((a, b) => b.posts - a.posts);
        break;
      case "newest":
        result.sort((a, b) => b.joinDate.localeCompare(a.joinDate));
        break;
      default:
        break;
    }
    return result;
  }, [membersList, searchTerm, roleFilter, sortBy]);

  // Top 3 for leaderboard
  const topMembers = useMemo(() => {
    return [...membersList].sort((a, b) => b.posts - a.posts).slice(0, 3);
  }, [membersList]);

  return (
    <>
      <Navbar />
      <main>
        <MemberHero />

        {/* Leaderboard */}
        <section className="w-full px-4 md:px-8 lg:px-12 -mt-8 relative z-10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMembers.map((member, idx) => (
              <div
                key={member.id}
                className="bg-background-50 rounded-xl border border-background-200/70 p-5 flex items-center gap-4 hover:border-primary-200/60 transition-all"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-background-200">
                    <img
                      src={member.avatar}
                      alt={member.fullName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div
                    className={`absolute -top-1 -left-1 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-background-50 ${
                      idx === 0
                        ? "bg-primary-500"
                        : idx === 1
                          ? "bg-accent-500"
                          : "bg-secondary-500"
                    }`}
                  >
                    {idx + 1}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground-900 truncate">
                    {member.fullName}
                  </p>
                  <p className="text-xs text-foreground-500">@{member.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-foreground-400">
                      {member.posts.toLocaleString()} posts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main content - Filters + Grid */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24">
          <div className="mb-6">
            <MemberFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              roleFilter={roleFilter}
              onRoleChange={setRoleFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Results count */}
          <p className="text-sm text-foreground-500 mb-6">
            <span className="font-semibold text-foreground-900">
              {filteredMembers.length}
            </span>{" "}
            {filteredMembers.length === 1 ? "member" : "members"} found
            {(roleFilter || searchTerm) && (
              <span className="text-foreground-400">
                {" "}
                with active filters
              </span>
            )}
          </p>

          {/* Members grid */}
          {fetchError ? (
            <ErrorState
              title="Unable to load community members"
              message={fetchError}
              onRetry={loadMembers}
            />
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-background-50 rounded-xl border border-background-200/70 p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-background-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-background-200 rounded w-3/4" />
                      <div className="h-3 bg-background-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-background-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filteredMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<i className="ri-user-search-line text-2xl" />}
              title="No members found"
              description="Try adjusting your search or filters to find who you are looking for."
              action={{
                label: "Reset Filters",
                onClick: () => {
                  setSearchTerm("");
                  setRoleFilter(null);
                },
                icon: <i className="ri-refresh-line" />,
              }}
            />
          )}

          {/* Country breakdown */}
          <div className="mt-16 pt-10 border-t border-background-200/70">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-global-line text-accent-500 text-lg"></i>
              <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
                Global Community
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-6">
              Our members come from everywhere
            </h2>
            <div className="flex flex-wrap gap-3">
              {topCountries.map((country) => (
                <div
                  key={country.name}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-background-50 rounded-xl border border-background-200/70"
                >
                  <span className="text-sm font-medium text-foreground-900">
                    {country.name}
                  </span>
                  <span className="text-xs text-foreground-400">
                    {country.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
              Ready to join the community?
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto mb-6">
              Connect with fellow travelers, expats, and locals. Share your Alanya story and
              become part of something special.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-full text-sm font-semibold hover:bg-white/95 transition-colors"
            >
              Create Your Profile
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}