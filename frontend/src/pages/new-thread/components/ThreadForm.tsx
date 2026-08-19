import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { forumService, type Category } from "@/api-services/forum.service";
import { categories as defaultCategories } from "@/mocks/categories";

export default function ThreadForm() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [categoriesList, setCategoriesList] = useState<Category[]>(defaultCategories);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdThread, setCreatedThread] = useState<{ id: string; slug: string; title: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load dynamic categories
  useEffect(() => {
    let isMounted = true;
    forumService
      .getCategories()
      .then((cats) => {
        if (isMounted && cats && cats.length > 0) {
          setCategoriesList(cats);
        }
      })
      .catch((err) => {
        console.warn("Failed to load categories in ThreadForm:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Validate the initial category from URL is a real category
  useEffect(() => {
    if (initialCategory && !categoriesList.find((c) => c.id === initialCategory)) {
      setCategoryId("");
    }
  }, [initialCategory, categoriesList]);

  const selectedCategory = useMemo(
    () => categoriesList.find((c) => c.id === categoryId) ?? null,
    [categoryId, categoriesList]
  );

  const subcategories = selectedCategory?.subcategories ?? [];

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategory("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categoryId;
      delete next.subcategory;
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!categoryId.trim()) errs.categoryId = "Please select a category";
    if (!title.trim()) errs.title = "Title is required";
    else if (title.trim().length < 10) errs.title = "Title must be at least 10 characters";
    if (!content.trim()) errs.content = "Content is required";
    else if (content.trim().length < 20) errs.content = "Content must be at least 20 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await forumService.createThread({
        title,
        body: content,
        category_id: categoryId,
        subcategory: subcategory || undefined,
      });
      setCreatedThread(res);
      setSubmitted(true);
    } catch (err) {
      console.warn("Failed to create thread:", err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-background-50 rounded-2xl border border-background-200/70 p-8 md:p-12 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 rounded-full">
          <i className="ri-check-line text-3xl text-primary-500"></i>
        </div>
        <h3 className="font-heading text-xl md:text-2xl text-foreground-900 mb-3">
          Discussion Created!
        </h3>
        <p className="text-sm md:text-base text-foreground-600 mb-8 max-w-md mx-auto">
          Your thread has been posted to the{" "}
          <span className="font-medium text-foreground-900">
            {selectedCategory?.name}
          </span>
          {subcategory ? (
            <span>
              {" "}
              →{" "}
              <span className="font-medium text-foreground-900">{subcategory}</span>
            </span>
          ) : (
            ""
          )}{" "}
          category. Others can now see it and join the conversation.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {createdThread && (
            <a
              href={`/thread/${createdThread.slug || createdThread.id}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              View Your Thread
              <i className="ri-arrow-right-line"></i>
            </a>
          )}
          <a
            href={`/category/${categoryId}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
          >
            View in {selectedCategory?.name}
          </a>
          <button
            onClick={() => {
              setSubmitted(false);
              setCreatedThread(null);
              setCategoryId("");
              setSubcategory("");
              setTitle("");
              setContent("");
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      data-readdy-form
      onSubmit={handleSubmit}
      className="bg-background-50 rounded-2xl border border-background-200/70 p-6 md:p-8 max-w-2xl mx-auto space-y-6"
    >
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground-800 mb-1.5">
          Category <span className="text-primary-500">*</span>
        </label>
        <div className="relative">
          <select
            name="category"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`w-full appearance-none bg-background-50 border ${
              errors.categoryId ? "border-primary-500" : "border-background-200"
            } rounded-lg px-4 py-3 pr-10 text-sm text-foreground-900 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer`}
          >
            <option value="">Select a category...</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 pointer-events-none"></i>
        </div>
        {errors.categoryId && (
          <p className="text-xs text-primary-500 mt-1">{errors.categoryId}</p>
        )}
      </div>

      {/* Subcategory */}
      <div>
        <label className="block text-sm font-medium text-foreground-800 mb-1.5">
          Subcategory <span className="text-foreground-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            name="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={subcategories.length === 0}
            className={`w-full appearance-none bg-background-50 border border-background-200 rounded-lg px-4 py-3 pr-10 text-sm text-foreground-900 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer ${
              subcategories.length === 0 ? "text-foreground-400 cursor-not-allowed" : ""
            }`}
          >
            <option value="">
              {subcategories.length === 0
                ? "Select a category first"
                : "All subcategories"}
            </option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 pointer-events-none"></i>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground-800 mb-1.5">
          Title <span className="text-primary-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
          }}
          placeholder="e.g. What's the best neighborhood for families in Alanya?"
          maxLength={150}
          className={`w-full bg-background-50 border ${
            errors.title ? "border-primary-500" : "border-background-200"
          } rounded-lg px-4 py-3 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors`}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title ? (
            <p className="text-xs text-primary-500">{errors.title}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-foreground-400">{title.length}/150</span>
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-foreground-800 mb-1.5">
          Content <span className="text-primary-500">*</span>
        </label>
        <textarea
          name="content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors((prev) => { const n = { ...prev }; delete n.content; return n; });
          }}
          placeholder="Share your thoughts, question, or experience in detail..."
          rows={8}
          maxLength={500}
          className={`w-full bg-background-50 border ${
            errors.content ? "border-primary-500" : "border-background-200"
          } rounded-lg px-4 py-3 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors resize-y`}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.content ? (
            <p className="text-xs text-primary-500">{errors.content}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-foreground-400">{content.length}/500</span>
        </div>
      </div>

      {/* Formatting tips */}
      <div className="flex items-center gap-2 text-xs text-foreground-500 bg-background-100/70 rounded-lg px-4 py-2.5">
        <i className="ri-information-line"></i>
        <span>
          Write a clear title and detailed description. Well-written posts get more replies!
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <i className="ri-loader-4-line animate-spin"></i>
            Posting Discussion...
          </>
        ) : (
          <>
            <i className="ri-send-plane-line"></i>
            Post Discussion
          </>
        )}
      </button>
    </form>
  );
}