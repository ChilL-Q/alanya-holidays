import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";

export default function PrivacyPage() {
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
            <span className="text-foreground-600">Privacy Policy</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base text-foreground-500 max-w-2xl">
            Last updated: June 12, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Intro */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Introduction</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              Alanya Holidays (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our community forum services. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              By accessing or using Alanya Holidays, you agree to the terms outlined in this Privacy Policy. If you do not agree with these terms, please discontinue use of our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Information We Collect</h2>

            <div className="space-y-6">
              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-100">
                    <i className="ri-user-line text-primary-500"></i>
                  </div>
                  Personal Information
                </h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  When you register an account, we collect your username, email address, and optionally your location, bio, and profile picture. We also collect any information you voluntarily provide in your forum posts, comments, and messages.
                </p>
              </div>

              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary-100">
                    <i className="ri-computer-line text-secondary-500"></i>
                  </div>
                  Usage Data
                </h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  We automatically collect certain information when you visit our forum, including your IP address, browser type, device information, pages viewed, time spent on pages, and referring URLs. This helps us understand how our community uses the platform and improve the experience.
                </p>
              </div>

              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100">
                    <i className="ri-instance-line text-accent-500"></i>
                  </div>
                  Cookies and Tracking
                </h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  We use essential cookies to keep you logged in and remember your preferences. We may also use analytics cookies to understand how the forum is used. You can control cookie settings through your browser preferences. Disabling cookies may affect certain features of the forum.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">How We Use Your Information</h2>
            <ul className="space-y-3">
              {[
                "To provide, maintain, and improve our community forum services",
                "To personalize your experience and show you relevant content and discussions",
                "To communicate with you about your account, forum updates, and community announcements",
                "To moderate content and enforce our community guidelines to keep the forum safe",
                "To analyze usage patterns and improve the functionality and design of the platform",
                "To respond to your inquiries, support requests, and feedback",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-foreground-600">
                  <i className="ri-check-line text-primary-500 mt-0.5 shrink-0"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Data Sharing and Disclosure</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              We do not sell your personal information. We may share your data only in the following circumstances:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-foreground-600">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background-100 shrink-0 mt-0.5">
                  <i className="ri-group-line text-foreground-500 text-xs"></i>
                </div>
                <div>
                  <strong className="text-foreground-800">Public Content:</strong> Your forum posts, comments, and profile information are visible to other community members and website visitors.
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground-600">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background-100 shrink-0 mt-0.5">
                  <i className="ri-shield-check-line text-foreground-500 text-xs"></i>
                </div>
                <div>
                  <strong className="text-foreground-800">Service Providers:</strong> We may share data with trusted third-party providers who help us operate the forum (hosting, analytics, email delivery).
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground-600">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background-100 shrink-0 mt-0.5">
                  <i className="ri-scales-line text-foreground-500 text-xs"></i>
                </div>
                <div>
                  <strong className="text-foreground-800">Legal Compliance:</strong> We may disclose information if required by law, court order, or to protect the rights and safety of our community.
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Your Rights</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="space-y-3">
              {[
                "Access the personal data we hold about you",
                "Request correction of inaccurate or incomplete data",
                "Request deletion of your account and associated data",
                "Object to or restrict certain processing activities",
                "Download your data in a portable format",
                "Withdraw consent where processing is based on consent",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-foreground-600">
                  <i className="ri-arrow-right-s-line text-accent-500 mt-0.5 shrink-0"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Data Security</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Children&apos;s Privacy</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              Alanya Holidays is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will promptly remove such information.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Contact Us</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
            </p>
            <div className="bg-background-50 rounded-xl border border-background-200/70 p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-mail-line text-primary-500"></i>
                <span>privacy@alanyaforum.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-map-pin-line text-primary-500"></i>
                <span>Alanya, Antalya, Türkiye</span>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Changes to This Policy</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the forum or sending you an email. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision. Continued use of the forum after changes constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}