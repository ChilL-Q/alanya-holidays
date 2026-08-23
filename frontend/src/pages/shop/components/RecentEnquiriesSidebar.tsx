import { useState, useEffect } from "react";
import { productsService, type ConciergeEnquiryEntry as RecentEnquiry } from "@/api-services/products.service";

function parseCategory(subject?: string | null): string {
  if (!subject) return "General Enquiry";
  const match = subject.match(/Personal Shopper Request\s*[—–-]\s*(.+)/i);
  return match ? match[1].trim() : "General Enquiry";
}

function anonymizeName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "Anonymous Shopper";
  const first = parts[0];
  if (parts.length === 1) return first;
  // Take first name + last initial
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Clothing & Apparel": "ri-t-shirt-line",
  "Home Decor & Ceramics": "ri-home-smile-line",
  "Turkish Delight & Food": "ri-cake-line",
  "Textiles & Towels": "ri-checkbox-blank-line",
  "Leather Goods": "ri-handbag-line",
  "Jewelry & Accessories": "ri-vip-diamond-line",
  "Gift Items": "ri-gift-line",
  "Travel Experiences": "ri-plane-line",
};

export default function RecentEnquiriesSidebar() {
  const [enquiries, setEnquiries] = useState<RecentEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchEnquiries() {
      try {
        setLoading(true);
        const data = await productsService.getRecentEnquiries(8);
        if (!cancelled) {
          setEnquiries(data || []);
        }
      } catch {
        // silent fail — sidebar is not critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEnquiries();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <aside className="w-full lg:w-72 flex-shrink-0">
        <div className="sticky top-24">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-32 bg-background-200 rounded"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-background-200/70 space-y-2">
                <div className="h-3 w-24 bg-background-200 rounded"></div>
                <div className="h-3 w-16 bg-background-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (enquiries.length === 0) return null;

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
            <i className="ri-history-line text-accent-600 text-sm"></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground-900">Recently Submitted</h3>
            <p className="text-xs text-foreground-400">{enquiries.length} recent enquiries</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {enquiries.map((enquiry) => {
            const category = parseCategory(enquiry.subject);
            const icon = CATEGORY_ICONS[category] || "ri-shopping-bag-line";

            return (
              <div
                key={enquiry.id}
                className="bg-white rounded-xl p-3.5 border border-background-200/70 hover:border-accent-200/60 transition-colors cursor-default"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className={`${icon} text-accent-500 text-xs`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground-800 truncate">
                      {anonymizeName(enquiry.name)}
                    </p>
                    <p className="text-xs text-foreground-500 truncate mt-0.5">
                      {category}
                    </p>
                    <p className="text-[11px] text-foreground-300 mt-1">
                      {timeAgo(enquiry.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-background-100">
          <p className="text-[11px] text-foreground-400 leading-relaxed">
            <i className="ri-information-line text-foreground-300 mr-1"></i>
            These are real requests from community members. Want your own personal shopper?{" "}
            <span className="text-accent-500 font-medium cursor-pointer">
              Submit an enquiry above
            </span>
            .
          </p>
        </div>
      </div>
    </aside>
  );
}