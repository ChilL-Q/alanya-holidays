import { Link } from "react-router-dom";
import { members } from "@/mocks/members";

export default function PopularMembers() {
  return (
    <section id="members" className="py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
              Top Contributors
            </span>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl text-foreground-900 mb-4">
            Meet Our Community
          </h2>
          <p className="text-foreground-500 text-base md:text-lg max-w-xl mx-auto">
            The people who make this forum what it is. Experts, locals, and
            passionate travelers sharing their knowledge.
          </p>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`bg-white rounded-xl p-5 md:p-6 hover:shadow-lg transition-all duration-300 ${
                index >= 3 ? "opacity-80 hover:opacity-100" : ""
              }`}
            >
              {/* Role Badge */}
              <div className="flex items-center gap-1 mb-3">
                <i className="ri-star-fill text-primary-400 text-xs"></i>
                <i className="ri-star-fill text-primary-400 text-xs"></i>
                <i className="ri-star-fill text-primary-400 text-xs"></i>
                <i className="ri-star-fill text-primary-400 text-xs"></i>
                <i className="ri-star-fill text-primary-400 text-xs"></i>
              </div>

              {/* Bio */}
              <p className="text-foreground-700 text-sm leading-relaxed mb-4">
                &ldquo;{member.bio}&rdquo;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-background-100">
                <img
                  src={member.avatar}
                  alt={member.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground-900">
                    {member.username}
                  </p>
                  <p className="text-xs text-foreground-500">
                    {member.role} · {member.posts} posts
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-10">
          <Link
            to="/members"
            className="inline-flex items-center gap-2 px-6 py-3 border border-foreground-200 text-foreground-700 rounded-full text-sm font-medium hover:bg-white hover:shadow-md transition-all"
          >
            See All Members
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}