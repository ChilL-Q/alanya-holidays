import { Link } from "react-router-dom";
import type { Category } from "@/mocks/categories";

interface CategoryHeaderProps {
  category: Category;
}

export default function CategoryHeader({ category }: CategoryHeaderProps) {
  return (
    <section className="relative w-full h-[300px] md:h-[380px] overflow-hidden">
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/80 via-foreground-950/30 to-foreground-950/10"></div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
        <div className="flex items-center gap-2 mb-4">
          <Link
            to="/"
            className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
          >
            Home
          </Link>
          <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
          <span className="text-white/90 text-sm">{category.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-xl">
                <i className={`${category.icon} text-white text-xl md:text-2xl`}></i>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl text-white">
                {category.name}
              </h1>
            </div>
            <p className="text-white/70 text-sm md:text-base max-w-2xl">
              {category.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-center">
              <p className="text-white text-lg md:text-xl font-semibold">
                {category.threadCount.toLocaleString()}
              </p>
              <p className="text-white/50 text-xs">Discussions</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="text-white text-lg md:text-xl font-semibold">
                {category.memberCount.toLocaleString()}
              </p>
              <p className="text-white/50 text-xs">Members</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="text-white text-lg md:text-xl font-semibold">
                {category.subcategories.length}
              </p>
              <p className="text-white/50 text-xs">Topics</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}