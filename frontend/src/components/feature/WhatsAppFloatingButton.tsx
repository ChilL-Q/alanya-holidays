import { useState } from "react";

const WHATSAPP_NUMBER = "14389294208";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi Alanya Holidays! I have a question about your experiences.");

export default function WhatsAppFloatingButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      <div
        className={`px-4 py-2 rounded-xl bg-white border border-background-200 shadow-sm text-sm text-foreground-700 whitespace-nowrap transition-all duration-200 ${
          showTooltip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <i className="ri-whatsapp-line text-green-500 text-base"></i>
          Chat with us on WhatsApp
        </span>
      </div>

      {/* Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Chat on WhatsApp"
      >
        <i className="ri-whatsapp-line text-2xl"></i>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30"></span>
      </a>
    </div>
  );
}