import React from "react";
import { Link } from "react-router-dom";

interface ProductBreadcrumbProps {
  productName: string;
}

export function ProductBreadcrumb({ productName }: ProductBreadcrumbProps) {
  return (
    <section className="w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-6 bg-background-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="text-foreground-400 hover:text-foreground-600 transition-colors underline underline-offset-2"
          >
            Home
          </Link>
          <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
          <Link
            to="/shop"
            className="text-foreground-400 hover:text-foreground-600 transition-colors underline underline-offset-2"
          >
            Shop
          </Link>
          <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
          <span className="text-foreground-700 truncate max-w-[200px]">{productName}</span>
        </div>
      </div>
    </section>
  );
}
