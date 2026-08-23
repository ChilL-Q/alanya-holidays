import React from "react";
import { COUNTRY_CODES } from "./types";

interface SendToPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  sendMethod: "whatsapp" | "sms";
  onSetSendMethod: (method: "whatsapp" | "sms") => void;
  sendCountryCode: string;
  onSetSendCountryCode: (code: string) => void;
  sendPhone: string;
  onSetSendPhone: (phone: string) => void;
  onSend: () => void;
}

export function SendToPhoneModal({
  isOpen,
  onClose,
  sendMethod,
  onSetSendMethod,
  sendCountryCode,
  onSetSendCountryCode,
  sendPhone,
  onSetSendPhone,
  onSend,
}: SendToPhoneModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg border border-background-200/70 p-6 md:p-8 animate-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-background-100 text-foreground-400 hover:bg-background-200 hover:text-foreground-600 transition-colors cursor-pointer"
        >
          <i className="ri-close-line"></i>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100">
            <i className="ri-smartphone-line text-accent-600 text-lg"></i>
          </div>
          <div>
            <h3 className="font-heading text-lg text-foreground-900">Send to My Phone</h3>
            <p className="text-xs text-foreground-500">
              Get the full tour route delivered to your phone
            </p>
          </div>
        </div>

        {/* Method Picker */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-foreground-700 mb-2">
            Send via
          </label>
          <div className="flex gap-2">
            {[
              { value: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp" },
              { value: "sms", icon: "ri-chat-1-line", label: "Text Message" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSetSendMethod(opt.value as "whatsapp" | "sms")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  sendMethod === opt.value
                    ? "bg-accent-500 text-background-50 border-accent-500"
                    : "bg-white text-foreground-600 border-background-300 hover:border-foreground-300"
                }`}
              >
                <i className={`${opt.icon} text-sm`}></i>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground-700 mb-2">
            Your phone number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-shrink-0">
              <select
                value={sendCountryCode}
                onChange={(e) => onSetSendCountryCode(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors cursor-pointer"
              >
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc.code} value={cc.code}>
                    {cc.flag} {cc.code}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 text-xs pointer-events-none"></i>
            </div>
            <input
              type="tel"
              value={sendPhone}
              onChange={(e) => onSetSendPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
              placeholder="Phone number"
              className="flex-1 px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors"
              autoFocus
            />
          </div>
          <p className="text-xs text-foreground-400 mt-2 flex items-center gap-1">
            <i className="ri-information-line text-[11px]"></i>
            We'll open {sendMethod === "whatsapp" ? "WhatsApp" : "your messaging app"} with the full tour route pre-filled
          </p>
        </div>

        {/* Preview of what's being sent */}
        <div className="mb-6 p-4 rounded-xl bg-background-100 border border-background-200/50">
          <p className="text-xs text-foreground-400 uppercase tracking-wider mb-2">You'll receive</p>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
              <i className="ri-checkbox-circle-fill text-accent-500 text-sm"></i>
            </span>
            <p className="text-sm text-foreground-700 leading-relaxed">
              All 7 cafe stops with addresses, must-try highlights, and walking directions — formatted for easy reading on your phone.
            </p>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
              <i className="ri-checkbox-circle-fill text-accent-500 text-sm"></i>
            </span>
            <p className="text-sm text-foreground-700 leading-relaxed">
              Works offline — once it's in your chat, you can reference it anywhere without data.
            </p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onSend}
          className="w-full py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
        >
          <i className={`${sendMethod === "whatsapp" ? "ri-whatsapp-line" : "ri-chat-1-line"}`}></i>
          {sendMethod === "whatsapp" ? "Open in WhatsApp" : "Open Text Message"}
        </button>
      </div>
    </div>
  );
}
