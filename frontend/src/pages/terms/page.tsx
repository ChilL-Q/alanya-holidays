import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";

export default function TermsPage() {
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
            <span className="text-foreground-600">Terms of Service</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground-900 mb-3">
            Terms of Service
          </h1>
          <p className="text-sm md:text-base text-foreground-500 max-w-2xl">
            Last updated: June 12, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Acceptance */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Acceptance of Terms</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              By accessing and using Alanya Holidays (&quot;the Forum&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Forum. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          {/* Community Guidelines */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Community Guidelines</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-5">
              Alanya Holidays is built on respect, helpfulness, and genuine community spirit. To keep it that way, all members agree to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: "ri-heart-line", title: "Be Respectful", desc: "Treat all members with kindness and respect. Disagreements are fine — personal attacks are not." },
                { icon: "ri-lightbulb-line", title: "Be Helpful", desc: "Share knowledge, experiences, and advice that genuinely helps the community." },
                { icon: "ri-shield-check-line", title: "Be Honest", desc: "Don't misrepresent yourself, spread misinformation, or engage in deceptive behavior." },
                { icon: "ri-global-line", title: "Be Inclusive", desc: "Alanya Holidays welcomes people from all backgrounds, nationalities, and perspectives." },
              ].map((item, i) => (
                <div key={i} className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <i className={`${item.icon} text-primary-500`}></i>
                  </div>
                  <h3 className="font-heading text-base text-foreground-800 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-foreground-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Prohibited Content */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Prohibited Content</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              The following content is strictly prohibited on Alanya Holidays and may result in immediate account suspension:
            </p>
            <ul className="space-y-3">
              {[
                "Hate speech, harassment, threats, or discrimination of any kind",
                "Spam, unsolicited advertising, or repetitive low-quality posts",
                "Illegal content or promotion of illegal activities",
                "Sharing others' personal information without consent",
                "Pornographic, violent, or graphic content",
                "Impersonating other members, moderators, or forum staff",
                "Malware, phishing links, or attempts to compromise security",
                "Copyright-infringing material posted without permission",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-foreground-600">
                  <i className="ri-close-circle-line text-red-500 mt-0.5 shrink-0"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">User Accounts</h2>
            <div className="space-y-4">
              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2">Account Responsibility</h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2">Account Termination</h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these terms, at our sole discretion. You may delete your account at any time through your account settings. Certain content you have posted may remain visible after account deletion for community continuity.
                </p>
              </div>
            </div>
          </section>

          {/* Content Ownership */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Content and Intellectual Property</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              You retain ownership of the content you post on Alanya Holidays. By posting, you grant us a non-exclusive, royalty-free license to display and distribute your content on the Forum. You are solely responsible for the content you post and warrant that you have the rights to share it.
            </p>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              The Alanya Holidays name, logo, design, and platform code are our intellectual property and may not be used without permission. User-generated content remains the property of the respective users.
            </p>
          </section>

          {/* Marketplace & Transactions */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Marketplace and Transactions</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              Alanya Holidays provides a marketplace section where members can list items, services, and accommodations. We are not a party to any transactions between members. We do not guarantee the quality, safety, or legality of items listed. All transactions are conducted at your own risk. We recommend meeting in public places for in-person exchanges and using secure payment methods.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Disclaimer of Warranties</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              Alanya Holidays is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties, express or implied, regarding the accuracy, reliability, or availability of the Forum. We do not guarantee that the Forum will be error-free, secure, or continuously available. Information shared by members reflects their personal views and experiences, not necessarily ours.
            </p>
          </section>

          {/* Limitation */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Limitation of Liability</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              To the fullest extent permitted by law, Alanya Holidays and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Forum, including but not limited to loss of data, reputation, or business opportunities.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Governing Law</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              These Terms of Service are governed by and construed in accordance with the laws of the Republic of Türkiye. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Antalya, Türkiye.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Contact</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              Questions about these Terms of Service? Reach out to us:
            </p>
            <div className="bg-background-50 rounded-xl border border-background-200/70 p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-mail-line text-primary-500"></i>
                <span>legal@alanyaforum.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-map-pin-line text-primary-500"></i>
                <span>Alanya, Antalya, Türkiye</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}