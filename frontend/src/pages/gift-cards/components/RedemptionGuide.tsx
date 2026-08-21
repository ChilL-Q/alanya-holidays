import { REDEMPTION_STEPS } from "../data/giftCardsData";

export default function RedemptionGuide() {
  return (
    <section className="w-full bg-gradient-to-b from-background-100 to-background-50 py-16 md:py-24 border-y border-background-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-700 mb-3">
            <i className="ri-guide-line text-sm"></i>
            Effortless Gifting
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground-900 mb-4">
            How Alanya Gift Cards Work
          </h2>
          <p className="text-foreground-600 text-base sm:text-lg leading-relaxed">
            From checkout to seaside dining — gifting memories in Alanya takes
            less than two minutes.
          </p>
        </div>

        {/* 3-Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {REDEMPTION_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative flex flex-col bg-background-50 p-6 sm:p-8 rounded-2xl border border-background-200/90 shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              {/* Step Badge & Icon */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-600 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-xs">
                  <i className={step.icon}></i>
                </div>
                <span className="text-4xl font-heading font-black text-background-200 group-hover:text-primary-200 transition-colors">
                  0{step.step}
                </span>
              </div>

              {/* Tag */}
              <div className="mb-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100">
                  {step.tag}
                </span>
              </div>

              {/* Content */}
              <h3 className="font-heading text-xl font-bold text-foreground-900 mb-2">
                {step.title}
              </h3>
              <p className="text-xs font-semibold text-primary-600 mb-2">
                {step.subtitle}
              </p>
              <p className="text-sm text-foreground-600 leading-relaxed">
                {step.description}
              </p>

              {/* Step indicator footer */}
              {idx < REDEMPTION_STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 text-primary-300">
                  <i className="ri-arrow-right-s-line text-2xl"></i>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-primary-100 shadow-xs max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
            <i className="ri-shield-check-line"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground-900">
              100% Peace of Mind Guarantee
            </h4>
            <p className="text-xs text-foreground-600 mt-0.5">
              Plans change? Free recipient transfers and 14-day zero-hassle refunds on all unredeemed certificates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
