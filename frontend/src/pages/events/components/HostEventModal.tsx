import { useEffect, useMemo, useState } from "react";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { forumService, type Category } from "@/api-services/forum.service";
import { logger } from "@/lib/logger";

interface HostEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (newEvent: ForumEvent) => void;
}

export default function HostEventModal({ isOpen, onClose, onEventCreated }: HostEventModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setCategoriesError(null);
      try {
        const categories = await forumService.getCategories();
        if (cancelled) return;

        const normalized = categories
          .map((category) => ({
            ...category,
            slug: category.slug || category.id,
          }))
          .filter((category) => category.id)
          .sort((a, b) => a.name.localeCompare(b.name));

        setAvailableCategories(normalized);
      } catch (err) {
        logger.warn("Failed to load forum categories for events:", err);
        if (!cancelled) {
          setCategoriesError("Could not load categories right now. Please try again.");
          setAvailableCategories([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const selectedCategoryLabel = useMemo(() => {
    return availableCategories.find((item) => item.id === category)?.name || category;
  }, [availableCategories, category]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setDescription("");
    setSubmitted(false);
    setSubmitError(null);
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Event title is required";
    else if (title.trim().length < 5) errs.title = "Title must be at least 5 characters";
    if (!category) errs.category = "Please select a category";
    if (!eventDate) errs.eventDate = "Date is required";
    if (!eventTime) errs.eventTime = "Time is required";
    if (!location.trim()) errs.location = "Location is required";
    if (!description.trim()) errs.description = "Description is required";
    else if (description.trim().length < 20) errs.description = "Description must be at least 20 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newEvent = await eventsService.createEvent({
        title,
        categoryId: category,
        eventDate,
        eventTime,
        location,
        description,
      });
      onEventCreated?.(newEvent);
      setSubmitted(true);
    } catch (err) {
      logger.warn("Failed to create event:", err);
      setSubmitError("Could not publish this event right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitted) {
      resetForm();
    }
    onClose();
  };

  const handleCreateAnother = () => {
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
      <div
        className="absolute inset-0 bg-foreground-950/50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      <div className="relative w-full max-w-lg bg-background-50 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background-50 rounded-t-2xl border-b border-background-200/70 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg text-foreground-900">
              {submitted ? "Event Published!" : "Host an Event"}
            </h2>
            {!submitted && (
              <p className="text-xs text-foreground-500 mt-0.5">
                Create a community event and publish it to the events page
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 text-foreground-500 hover:text-foreground-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 rounded-full">
                <i className="ri-check-line text-3xl text-primary-500"></i>
              </div>
              <h3 className="font-heading text-lg text-foreground-900 mb-2">
                Event is live
              </h3>
              <p className="text-sm text-foreground-600 mb-1">
                <span className="font-semibold text-foreground-900">{title}</span>
              </p>
              <p className="text-sm text-foreground-600 mb-6">
                {selectedCategoryLabel && (
                  <span className="inline-flex items-center gap-1 text-foreground-500">
                    <i className="ri-price-tag-3-line"></i>
                    {selectedCategoryLabel}
                  </span>
                )}
                {eventDate && (
                  <span className="inline-flex items-center gap-1 text-foreground-500 ml-3">
                    <i className="ri-calendar-line"></i>
                    {new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground-400 mb-8">
                The event was created successfully and has been added to the page.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-calendar-check-line"></i>
                  Back to Events
                </button>
                <button
                  onClick={handleCreateAnother}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line"></i>
                  Publish Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700" role="alert">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1">
                  Event Title <span className="text-primary-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                  }}
                  placeholder="e.g. Sunset Yoga at Cleopatra Beach"
                  maxLength={100}
                  className={`w-full bg-background-50 border ${
                    errors.title ? "border-primary-500" : "border-background-200"
                  } rounded-lg px-4 py-2.5 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.title ? (
                    <p className="text-xs text-primary-500">{errors.title}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-foreground-400">{title.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1">
                  Category <span className="text-primary-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (errors.category) setErrors((prev) => { const n = { ...prev }; delete n.category; return n; });
                    }}
                    disabled={isLoadingCategories || availableCategories.length === 0}
                    className={`w-full appearance-none bg-background-50 border ${
                      errors.category ? "border-primary-500" : "border-background-200"
                    } rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground-900 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <option value="">
                      {isLoadingCategories ? "Loading categories..." : availableCategories.length > 0 ? "Select a category..." : "No categories available"}
                    </option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 pointer-events-none"></i>
                </div>
                {errors.category ? (
                  <p className="text-xs text-primary-500 mt-1">{errors.category}</p>
                ) : categoriesError ? (
                  <p className="text-xs text-primary-500 mt-1">{categoriesError}</p>
                ) : (
                  <p className="text-xs text-foreground-400 mt-1">Categories are loaded from the forum backend and submitted using their real identifiers.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1">
                    Date <span className="text-primary-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      if (errors.eventDate) setErrors((prev) => { const n = { ...prev }; delete n.eventDate; return n; });
                    }}
                    className={`w-full bg-background-50 border ${
                      errors.eventDate ? "border-primary-500" : "border-background-200"
                    } rounded-lg px-4 py-2.5 text-sm text-foreground-900 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer`}
                  />
                  {errors.eventDate && (
                    <p className="text-xs text-primary-500 mt-1">{errors.eventDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1">
                    Time <span className="text-primary-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="eventTime"
                    value={eventTime}
                    onChange={(e) => {
                      setEventTime(e.target.value);
                      if (errors.eventTime) setErrors((prev) => { const n = { ...prev }; delete n.eventTime; return n; });
                    }}
                    className={`w-full bg-background-50 border ${
                      errors.eventTime ? "border-primary-500" : "border-background-200"
                    } rounded-lg px-4 py-2.5 text-sm text-foreground-900 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer`}
                  />
                  {errors.eventTime && (
                    <p className="text-xs text-primary-500 mt-1">{errors.eventTime}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1">
                  Location <span className="text-primary-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => { const n = { ...prev }; delete n.location; return n; });
                  }}
                  placeholder="e.g. Cleopatra Beach, Alanya"
                  maxLength={150}
                  className={`w-full bg-background-50 border ${
                    errors.location ? "border-primary-500" : "border-background-200"
                  } rounded-lg px-4 py-2.5 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors`}
                />
                {errors.location && (
                  <p className="text-xs text-primary-500 mt-1">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1">
                  Description <span className="text-primary-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                  }}
                  placeholder="Describe the event — what to bring, what to expect, who is it for..."
                  rows={4}
                  maxLength={500}
                  className={`w-full bg-background-50 border ${
                    errors.description ? "border-primary-500" : "border-background-200"
                  } rounded-lg px-4 py-2.5 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors resize-y`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description ? (
                    <p className="text-xs text-primary-500">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-foreground-400">{description.length}/500</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-foreground-500 bg-background-100/70 rounded-lg px-4 py-2.5">
                <i className="ri-information-line"></i>
                <span>
                  This admin flow publishes the event immediately using supported backend fields and real forum category identifiers.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingCategories || availableCategories.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Publishing...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    Publish Event
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
