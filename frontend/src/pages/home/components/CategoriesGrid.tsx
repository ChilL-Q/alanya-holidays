import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { forumService, type Category } from "@/api-services/forum.service";
import { logger } from "@/lib/logger";

export default function CategoriesGrid() {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    forumService
      .getCategories()
      .then((data) => {
        if (isMounted && data) {
          setCategoriesList(data);
        }
      })
      .catch((err) => {
        logger.warn("Failed to load forum categories:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <section id="categories" className="py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-grid-line text-accent-500 text-lg"></i>
            <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
              Explore
            </span>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl text-foreground-900 mb-4">
            Browse Categories
          </h2>
          <p className="text-foreground-500 text-base md:text-lg max-w-xl">
            From travel planning to local culture, find the right space for your
            questions and stories.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {categoriesList.map((category, index) => {
            // Alternate card styles based on index
            const styleType = index % 3;

            if (styleType === 0) {
              // Dark card with icon
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group relative bg-foreground-900 rounded-xl p-5 h-48 flex flex-col justify-between hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="w-10 h-10 flex items-center justify-center bg-foreground-700 rounded-full mb-4">
                      <i className={`${category.icon} text-white text-lg`}></i>
                    </div>
                    <h3 className="font-heading text-lg text-white mb-2 leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-white/50 text-xs">
                      {category.threadCount.toLocaleString()} discussions
                    </p>
                  </div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10">
                    <i className={`${category.icon} text-white text-6xl`}></i>
                  </div>
                </Link>
              );
            }

            if (styleType === 1) {
              // Image background card
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group relative rounded-xl h-48 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  {/* Category Tag */}
                  <span className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                    <i className={`${category.icon}`}></i>
                    {category.subcategories.length} topics
                  </span>
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading text-lg text-white mb-1 leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-xs">
                      {category.threadCount.toLocaleString()} discussions
                    </p>
                  </div>
                </Link>
              );
            }

            // Light card with image at bottom
            return (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 h-48 flex flex-col"
              >
                <div className="p-4 flex-1">
                  <h3 className="font-heading text-lg text-foreground-900 mb-2 leading-tight group-hover:text-primary-500 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-foreground-500 text-xs">
                    {category.subcategories.length} topics
                  </p>
                </div>
                <div className="h-20 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}