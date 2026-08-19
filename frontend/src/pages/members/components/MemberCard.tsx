import { Link } from "react-router-dom";

interface MemberCardProps {
  member: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    location: string;
    joinDate: string;
    posts: number;
    reputation: number;
    isOnline: boolean;
    avatar: string;
    bio: string;
    badges: string[];
  };
}

export default function MemberCard({ member }: MemberCardProps) {
  return (
    <article className="group bg-background-50 rounded-xl border border-background-200/70 p-5 hover:border-primary-200/60 transition-all duration-200">
      {/* Top section */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar with online indicator */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden bg-background-200">
            <img
              src={member.avatar}
              alt={member.fullName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {member.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent-500 rounded-full border-2 border-background-50"></div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-heading text-base md:text-lg text-foreground-900 group-hover:text-primary-500 transition-colors">
              {member.fullName}
            </h3>
            {member.role === "Community Leader" && (
              <i className="ri-vip-crown-line text-primary-500"></i>
            )}
          </div>
          <p className="text-foreground-500 text-sm">@{member.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-background-100 text-foreground-600">
              {member.role}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-foreground-500 text-sm leading-relaxed mb-4 line-clamp-2">
        {member.bio}
      </p>

      {/* Badges */}
      {member.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {member.badges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100/80 text-accent-700 text-xs rounded-full font-medium"
            >
              <i className="ri-verified-badge-line text-xs"></i>
              {badge}
            </span>
          ))}
          {member.badges.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 bg-background-100 text-foreground-400 text-xs rounded-full">
              +{member.badges.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-background-200/50">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground-900">
              {member.posts.toLocaleString()}
            </p>
            <p className="text-xs text-foreground-400">Posts</p>
          </div>
          <div className="w-px h-6 bg-background-200/70"></div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${member.reputation >= 10000 ? "text-primary-500" : member.reputation >= 5000 ? "text-accent-500" : "text-secondary-500"}`}>
              {member.reputation >= 1000
                ? `${(member.reputation / 1000).toFixed(1)}k`
                : member.reputation}
            </p>
            <p className="text-xs text-foreground-400">Rep</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <i className="ri-map-pin-line text-foreground-400 text-xs"></i>
          <span className="text-xs text-foreground-500">{member.location}</span>
        </div>
      </div>

      {/* Action */}
      <Link
        to={`/member/${member.id}`}
        className="block w-full mt-3 px-4 py-2 bg-background-100 text-foreground-700 rounded-lg text-sm font-medium text-center hover:bg-primary-100 hover:text-primary-700 transition-colors cursor-pointer"
      >
        View Profile
      </Link>
    </article>
  );
}