import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { forumService, badgeDescriptions, type ForumMember, type CategoryThread } from "@/api-services/forum.service";
import ErrorState from "@/components/base/ErrorState";

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const [member, setMember] = useState<ForumMember | null>(null);
  const [memberThreads, setMemberThreads] = useState<CategoryThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadMemberData = useCallback(async () => {
    if (!memberId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const [fetchedMember, threadsResult] = await Promise.all([
        forumService.getMemberById(memberId),
        forumService.getThreads({ limit: 10 }),
      ]);
      setMember(fetchedMember);
      setMemberThreads(threadsResult.threads.slice(0, 4));
    } catch {
      setFetchError("Unable to load member profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-background-50 rounded-2xl border border-background-200/70 p-8 text-center animate-pulse space-y-4">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-background-200" />
            <div className="h-6 bg-background-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-background-100 rounded w-3/4 mx-auto" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (fetchError) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center p-8">
          <ErrorState
            title="Failed to load profile"
            message={fetchError}
            onRetry={loadMemberData}
          />
        </main>
        <Footer />
      </>
    );
  }

  if (!member) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-background-100 mb-5">
              <i className="ri-user-unfollow-line text-foreground-400 text-3xl"></i>
            </div>
            <h1 className="font-heading text-2xl text-foreground-900 mb-3">Member not found</h1>
            <p className="text-foreground-500 text-sm mb-6">
              This profile doesn&apos;t exist or may have been removed.
            </p>
            <Link
              to="/members"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Members
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const repTier =
    member.reputation >= 10000 ? "primary" : member.reputation >= 5000 ? "accent" : "secondary";

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative w-full overflow-hidden bg-background-50 border-b border-background-200/70">
          {/* Cover gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/8 via-accent-500/5 to-secondary-500/8"></div>

          <div className="relative w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-10 md:pb-16">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8">
              <Link to="/" className="text-foreground-500 hover:text-foreground-700 text-sm transition-colors">
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-foreground-400 text-sm"></i>
              <Link to="/members" className="text-foreground-500 hover:text-foreground-700 text-sm transition-colors">
                Members
              </Link>
              <i className="ri-arrow-right-s-line text-foreground-400 text-sm"></i>
              <span className="text-foreground-900 text-sm font-medium">@{member.username}</span>
            </div>

            {/* Profile header */}
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-background-200 ring-4 ring-background-50">
                  <img
                    src={member.avatar}
                    alt={member.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {member.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent-500 rounded-full border-3 border-background-50"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="font-heading text-2xl md:text-4xl text-foreground-900">
                    {member.fullName}
                  </h1>
                  {member.isOnline && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
                      Online
                    </span>
                  )}
                </div>
                <p className="text-foreground-500 text-sm md:text-base mb-3">
                  @{member.username}
                </p>

                <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground-600">
                    <i className="ri-shield-user-line text-foreground-400"></i>
                    {member.role}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground-600">
                    <i className="ri-map-pin-line text-foreground-400"></i>
                    {member.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground-600">
                    <i className="ri-calendar-line text-foreground-400"></i>
                    Joined {member.joinDate}
                  </span>
                </div>

                <p className="text-foreground-600 text-sm leading-relaxed max-w-2xl">
                  {member.bio}
                </p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 md:mt-10">
              <div className="bg-background-100 rounded-xl p-4 text-center">
                <p className="text-2xl md:text-3xl font-semibold text-foreground-900">
                  {member.posts.toLocaleString()}
                </p>
                <p className="text-xs text-foreground-500 mt-1">Posts</p>
              </div>
              <div className="bg-background-100 rounded-xl p-4 text-center">
                <p className={`text-2xl md:text-3xl font-semibold text-${repTier}-500`}>
                  {member.reputation >= 1000
                    ? `${(member.reputation / 1000).toFixed(1)}k`
                    : member.reputation}
                </p>
                <p className="text-xs text-foreground-500 mt-1">Reputation</p>
              </div>
              <div className="bg-background-100 rounded-xl p-4 text-center">
                <p className="text-2xl md:text-3xl font-semibold text-foreground-900">
                  {member.badges.length}
                </p>
                <p className="text-xs text-foreground-500 mt-1">Badges</p>
              </div>
              <div className="bg-background-100 rounded-xl p-4 text-center">
                <p className="text-2xl md:text-3xl font-semibold text-foreground-900">
                  {memberThreads.length}
                </p>
                <p className="text-xs text-foreground-500 mt-1">Discussions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent-100">
              <i className="ri-verified-badge-line text-accent-600 text-lg"></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl text-foreground-900">Badges</h2>
              <p className="text-xs text-foreground-500">Recognition earned through community contributions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {member.badges.map((badge) => {
              const info = badgeDescriptions[badge];
              if (!info) return null;
              return (
                <div
                  key={badge}
                  className="flex items-start gap-4 bg-background-50 rounded-xl border border-background-200/70 p-5 hover:border-accent-200/60 transition-all"
                >
                  <div className={`w-11 h-11 flex items-center justify-center rounded-xl shrink-0 ${info.color.split(" ")[0]} ${info.color.split(" ")[0].replace("text-", "bg-").replace("700", "100")}`}>
                    <i className={`${info.icon} ${info.color.split(" ")[1]} text-lg`}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground-900 mb-1">{badge}</p>
                    <p className="text-xs text-foreground-500 leading-relaxed">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100">
              <i className="ri-chat-3-line text-primary-600 text-lg"></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl text-foreground-900">Recent Discussions</h2>
              <p className="text-xs text-foreground-500">
                {memberThreads.length > 0
                  ? `${memberThreads.length} discussion${memberThreads.length !== 1 ? "s" : ""} started`
                  : "No discussions yet"}
              </p>
            </div>
          </div>

          {memberThreads.length > 0 ? (
            <div className="space-y-3">
              {memberThreads.map((thread) => (
                <Link
                  key={thread.id}
                  to={`/thread/${thread.id}`}
                  className="block bg-background-50 rounded-xl border border-background-200/70 p-5 hover:border-primary-200/60 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.isPinned && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                            <i className="ri-pushpin-line text-xs"></i>
                            Pinned
                          </span>
                        )}
                        {thread.isHot && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-accent-100 text-accent-700">
                            <i className="ri-fire-line text-xs"></i>
                            Hot
                          </span>
                        )}
                        <span className="text-xs text-foreground-400">{thread.postedAt}</span>
                      </div>
                      <h3 className="font-heading text-base md:text-lg text-foreground-900 group-hover:text-primary-500 transition-colors mb-1.5">
                        {thread.title}
                      </h3>
                      <p className="text-sm text-foreground-500 line-clamp-1">{thread.excerpt}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="inline-flex items-center gap-1 text-xs text-foreground-400">
                          <i className="ri-chat-3-line"></i>
                          {thread.replies} replies
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-foreground-400">
                          <i className="ri-eye-line"></i>
                          {thread.views.toLocaleString()} views
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-foreground-400">
                          <i className="ri-heart-line"></i>
                          {thread.likes} likes
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-background-100 rounded-full text-xs text-foreground-500">
                        <i className="ri-folder-line"></i>
                        {thread.category}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background-50 rounded-xl border border-dashed border-background-200/70">
              <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-background-100 mb-4">
                <i className="ri-chat-off-line text-foreground-400 text-xl"></i>
              </div>
              <p className="text-foreground-500 text-sm">No discussions yet</p>
              <p className="text-foreground-400 text-xs mt-1">This member hasn&apos;t started any threads.</p>
            </div>
          )}

          {/* View all CTA */}
          {memberThreads.length > 0 && (
            <div className="text-center mt-8">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-background-100 text-foreground-600 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-up-line"></i>
                Back to top
              </button>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
              Want to connect with {member.fullName.split(" ")[0]}?
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto mb-6">
              Join the Alanya Holidays community and start a discussion. Share your questions, tips, and stories with fellow members.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-full text-sm font-semibold hover:bg-white/95 transition-colors"
            >
              Join the Community
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}