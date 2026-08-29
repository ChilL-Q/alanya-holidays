import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { adminService } from "@/api-services/admin.service";

const faqItems = [
  {
    q: "How do I start a new discussion?",
    a: "Click the 'Start a Discussion' button in the navigation bar or from any category page. Choose the relevant category and subcategory, write your post title and content, then hit publish. Your post will appear immediately in the community feed.",
  },
  {
    q: "Do I need an account to browse the forum?",
    a: "Nope! You can browse all discussions, events, and member profiles without an account. You'll only need to register when you want to post, comment, like, or join events.",
  },
  {
    q: "How do I create an account?",
    a: "Click 'Register' in the top navigation bar. Fill out your username, email, and a password. You can also optionally add your location and a short bio to help other members get to know you. Once registered, you can start participating immediately.",
  },
  {
    q: "What are the community guidelines?",
    a: "We keep it simple: be respectful, be helpful, be honest, and be inclusive. No hate speech, spam, harassment, or illegal content. Check our full Terms of Service for the complete guidelines. Our moderators are active but we rely on the community to keep things positive.",
  },
  {
    q: "How do I report a post or user?",
    a: "If you see content that violates our guidelines, use the contact form on this page to report it. Include the thread link, the username, and a brief description of the issue. Our moderation team reviews all reports within 24 hours.",
  },
  {
    q: "Can I edit or delete my posts?",
    a: "Yes! You can edit your own posts and replies at any time. Deletion is also available through your post options. Note that deleting a post that has replies may leave the conversation looking broken, so editing is often the better choice.",
  },
  {
    q: "How do events work on Alanya Holidays?",
    a: "Events are managed and published by administrators. Other members can browse events, RSVP, comment, and share them. You can also sync events to your personal calendar.",
  },
  {
    q: "Is the marketplace safe to use?",
    a: "The marketplace connects community members directly — we don't handle payments or mediate transactions. Always meet in public places, verify items before paying, and use common sense. Report suspicious listings and we'll remove them promptly.",
  },
  {
    q: "How do I get the 'Verified Local' badge?",
    a: "The Verified Local badge is given to members who have been consistently helpful and active in the community for at least 3 months. Our moderation team reviews profiles regularly and awards the badge to qualifying members. There's no application process — just keep contributing!",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "On the login page, click 'Forgot Password', enter your email address, and we'll send you a reset link. Check your spam folder if you don't see it within a few minutes. If you're still stuck, use the contact form below and we'll help manually.",
  },
];

const forumGuides = [
  {
    icon: "ri-edit-line",
    title: "Writing Great Posts",
    desc: "Use clear titles that summarize your question or topic. Add specific details — the more context you give, the better answers you'll get. Break long text into paragraphs for readability.",
  },
  {
    icon: "ri-search-line",
    title: "Search Before Posting",
    desc: "Chances are someone has already asked your question. Use the search bar or browse relevant categories before creating a new thread. This keeps discussions organized and reduces duplicates.",
  },
  {
    icon: "ri-image-line",
    title: "Adding Photos",
    desc: "You can attach images to your posts to illustrate your point. Photos of restaurants, beaches, rental properties, or events make your posts much more engaging and helpful to others.",
  },
  {
    icon: "ri-notification-3-line",
    title: "Staying Updated",
    desc: "When you post or comment on a thread, you'll automatically receive notifications when someone replies. You can also bookmark threads to follow conversations without posting in them.",
  },
  {
    icon: "ri-user-star-line",
    title: "Building Reputation",
    desc: "Your reputation score increases when other members like your posts. Higher reputation unlocks badges and signals to the community that you're a trusted contributor.",
  },
  {
    icon: "ri-chat-smile-2-line",
    title: "Being a Good Community Member",
    desc: "Welcome newcomers, answer questions kindly, and share your honest experiences. The best members are those who give back — even a simple 'thanks for sharing' goes a long way.",
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await adminService.submitEnquiry({
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        subject: String(formData.get("subject") || "").trim() || "Support Request",
        message: String(formData.get("message") || "").trim(),
        enquiry_type: "support",
      });
      setFormStatus("success");
      form.reset();
      setTimeout(() => setFormStatus("idle"), 4000);
    } catch {
      setFormStatus("error");
      setTimeout(() => setFormStatus("idle"), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-background-100 border-b border-background-200/70">
        <div className="w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-10 md:pb-14">
          <nav className="flex items-center gap-1.5 text-xs md:text-sm text-foreground-400 mb-4 flex-wrap">
            <Link to="/" className="hover:text-primary-500 transition-colors flex items-center gap-1">
              <i className="ri-home-4-line"></i>
              Home
            </Link>
            <i className="ri-arrow-right-s-line text-foreground-300"></i>
            <span className="text-foreground-600">Help & Support</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground-900 mb-3">
            Help & Support
          </h1>
          <p className="text-sm md:text-base text-foreground-500 max-w-2xl">
            Everything you need to get the most out of Alanya Holidays — from getting started to becoming a top contributor.
          </p>
        </div>
      </section>

      <main className="flex-1 w-full">
        {/* Quick links */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { icon: "ri-user-add-line", label: "Create Account", href: "/register" },
              { icon: "ri-edit-line", label: "Start Discussion", href: "/new-thread" },
              { icon: "ri-calendar-event-line", label: "Browse Events", href: "/events" },
              { icon: "ri-stack-line", label: "All Categories", href: "/categories" },
              { icon: "ri-information-line", label: "About Us", href: "/about" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex flex-col items-center gap-2 p-4 md:p-5 bg-background-50 rounded-xl border border-background-200/70 hover:border-primary-200/60 hover:bg-primary-50/50 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-background-100 group-hover:bg-primary-100 transition-colors">
                  <i className={`${link.icon} text-foreground-600 group-hover:text-primary-500 transition-colors text-lg`}></i>
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground-700 text-center whitespace-nowrap">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14 bg-background-100">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-question-answer-line text-primary-500 text-lg"></i>
              <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
                Got Questions?
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
                  >
                    <span className="font-heading text-sm md:text-base text-foreground-800 pr-4">
                      {item.q}
                    </span>
                    <div className={`w-6 h-6 flex items-center justify-center shrink-0 rounded-full bg-background-100 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                      <i className="ri-add-line text-foreground-500 text-sm"></i>
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? "max-h-96 pb-4" : "max-h-0"
                    }`}
                  >
                    <p className="px-5 text-sm text-foreground-500 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Forum How-To Guides */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-book-open-line text-accent-500 text-lg"></i>
              <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
                New Here?
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-8">
              Forum How-To Guides
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {forumGuides.map((guide, i) => (
                <div key={i} className="bg-background-50 rounded-xl border border-background-200/70 p-5 hover:border-primary-200/60 transition-all">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent-100 mb-4">
                    <i className={`${guide.icon} text-accent-500`}></i>
                  </div>
                  <h3 className="font-heading text-base text-foreground-800 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-foreground-500 leading-relaxed">
                    {guide.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14 bg-background-100">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-mail-send-line text-primary-500 text-lg"></i>
              <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
                Still Need Help?
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
              Contact Our Team
            </h2>
            <p className="text-sm text-foreground-500 mb-8">
              Couldn&apos;t find what you were looking for? Send us a message and we&apos;ll get back to you within 24 hours.
            </p>

            <form
              onSubmit={handleFormSubmit}

              className="bg-background-50 rounded-xl border border-background-200/70 p-6 md:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-foreground-600 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Enter your name"
                    className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-2.5 text-sm text-foreground-800 placeholder:text-foreground-300 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-foreground-600 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-2.5 text-sm text-foreground-800 placeholder:text-foreground-300 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-medium text-foreground-600 mb-1.5">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-2.5 text-sm text-foreground-800 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a topic</option>
                  <option value="account">Account Help</option>
                  <option value="technical">Technical Issue</option>
                  <option value="report">Report Content</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="event">Event Question</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-foreground-600 mb-1.5">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  maxLength={500}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-3 text-sm text-foreground-800 placeholder:text-foreground-300 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 resize-none transition-all"
                />
                <p className="text-[10px] text-foreground-300 mt-1">Maximum 500 characters</p>
              </div>

              {/* Status messages */}
              {formStatus === "success" && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <i className="ri-check-line"></i>
                  Message sent successfully! We&apos;ll get back to you within 24 hours.
                </div>
              )}
              {formStatus === "error" && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <i className="ri-error-warning-line"></i>
                  Something went wrong. Please try again or email us directly at hello@alanyaforum.com.
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === "submitting"}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                {formStatus === "submitting" ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <i className="ri-send-plane-line"></i>
                  </>
                )}
              </button>
            </form>

            {/* Alternative contact */}
            <div className="mt-8 p-5 bg-background-50 rounded-xl border border-background-200/70 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100">
                  <i className="ri-mail-line text-primary-500"></i>
                </div>
                <div>
                  <p className="text-xs text-foreground-400">Email us directly</p>
                  <p className="text-sm font-medium text-foreground-700">hello@alanyaforum.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent-100">
                  <i className="ri-discord-line text-accent-500"></i>
                </div>
                <div>
                  <p className="text-xs text-foreground-400">Join the conversation</p>
                  <p className="text-sm font-medium text-foreground-700">Discord Community</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
