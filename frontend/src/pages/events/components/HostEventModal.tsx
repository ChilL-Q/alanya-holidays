import { useState } from "react";
import { eventsService, eventCategories, type ForumEvent } from "@/api-services/events.service";
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
  const [maxAttendees, setMaxAttendees] = useState("");
  const [hostName, setHostName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

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
    if (!hostName.trim()) errs.hostName = "Your name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const newEvent = await eventsService.createEvent({
        title,
        category,
        eventDate,
        eventTime,
        location,
        description,
        maxAttendees,
        hostName,
      });
      onEventCreated?.(newEvent);
      setSubmitted(true);
    } catch (err) {
      logger.warn("Failed to create event:", err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitted) {
      setTitle("");
      setCategory("");
      setEventDate("");
      setEventTime("");
      setLocation("");
      setDescription("");
      setMaxAttendees("");
      setHostName("");
      setErrors({});
    }
    onClose();
  };

  const handleReset = () => {
    setSubmitted(false);
    setTitle("");
    setCategory("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setDescription("");
    setMaxAttendees("");
    setHostName("");
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground-950/50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background-50 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background-50 rounded-t-2xl border-b border-background-200/70 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg text-foreground-900">
              {submitted ? "Event Submitted!" : "Host an Event"}
            </h2>
            {!submitted && (
              <p className="text-xs text-foreground-500 mt-0.5">
                Fill in the details and we will share it with the community
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 text-foreground-500 hover:text-foreground-800 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 rounded-full">
                <i className="ri-check-line text-3xl text-primary-500"></i>
              </div>
              <h3 className="font-heading text-lg text-foreground-900 mb-2">
                You are all set!
              </h3>
              <p className="text-sm text-foreground-600 mb-1">
                <span className="font-semibold text-foreground-900">{title}</span>
              </p>
              <p className="text-sm text-foreground-600 mb-6">
                {category && (
                  <span className="inline-flex items-center gap-1 text-foreground-500">
                    <i className="ri-price-tag-3-line"></i>
                    {category}
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
                Your event has been submitted for review. It will appear on the events page shortly after approval.
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
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line"></i>
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Event Title */}
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

              {/* Category */}
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
                    className={`w-full appearance-none bg-background-50 border ${
                      errors.category ? "border-primary-500" : "border-background-200"
                    } rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground-900 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer`}
                  >
                    <option value="">Select a category...</option>
                    {eventCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 pointer-events-none"></i>
                </div>
                {errors.category && (
                  <p className="text-xs text-primary-500 mt-1">{errors.category}</p>
                )}
              </div>

              {/* Date & Time */}
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
                    min="2026-06-04"
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

              {/* Location */}
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

              {/* Description */}
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

              {/* Max Attendees */}
              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1">
                  Max Attendees <span className="text-foreground-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  placeholder="e.g. 30"
                  min="1"
                  className="w-full bg-background-50 border border-background-200 rounded-lg px-4 py-2.5 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Host Name */}
              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1">
                  Your Name <span className="text-primary-500">*</span>
                </label>
                <input
                  type="text"
                  name="hostName"
                  value={hostName}
                  onChange={(e) => {
                    setHostName(e.target.value);
                    if (errors.hostName) setErrors((prev) => { const n = { ...prev }; delete n.hostName; return n; });
                  }}
                  placeholder="Enter your name"
                  maxLength={80}
                  className={`w-full bg-background-50 border ${
                    errors.hostName ? "border-primary-500" : "border-background-200"
                  } rounded-lg px-4 py-2.5 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 transition-colors`}
                />
                {errors.hostName && (
                  <p className="text-xs text-primary-500 mt-1">{errors.hostName}</p>
                )}
              </div>

              {/* Info tip */}
              <div className="flex items-center gap-2 text-xs text-foreground-500 bg-background-100/70 rounded-lg px-4 py-2.5">
                <i className="ri-information-line"></i>
                <span>
                  Events are reviewed before being listed. You will receive a confirmation once approved.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    Submit Event
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