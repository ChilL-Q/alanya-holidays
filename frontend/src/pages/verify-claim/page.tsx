import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { directoryService } from "@/api-services/directory.service";
import { ApiError } from "@/lib/api-client";

type VerificationState = "confirm" | "submitting" | "success" | "invalid" | "expired" | "error";

function captureAndScrubToken(): string | null {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const token = fragment.get("token");

  if (url.hash) {
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  return token;
}

export default function VerifyClaimPage() {
  const [token] = useState(captureAndScrubToken);
  const [state, setState] = useState<VerificationState>(token ? "confirm" : "invalid");

  useEffect(() => {
    const existingMeta = document.querySelector<HTMLMetaElement>('meta[name="referrer"]');
    const previousContent = existingMeta?.content;
    const meta = existingMeta ?? document.createElement("meta");

    meta.name = "referrer";
    meta.content = "no-referrer";
    if (!existingMeta) {
      meta.dataset.verifyClaim = "true";
      document.head.appendChild(meta);
    }

    return () => {
      if (existingMeta && previousContent !== undefined) {
        existingMeta.content = previousContent;
      } else {
        meta.remove();
      }
    };
  }, []);

  const confirmClaim = async () => {
    if (!token || state !== "confirm") return;

    setState("submitting");
    try {
      const result = await directoryService.verifyClaim(token);
      setState(result.success === true ? "success" : "invalid");
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const detail = `${error.message} ${JSON.stringify(error.data)}`.toLowerCase();
        if (error.status === 410 || detail.includes("expired")) {
          setState("expired");
          return;
        }
        if (error.status === 400 || error.status === 404) {
          setState("invalid");
          return;
        }
      }
      setState("error");
    }
  };

  const content = {
    confirm: {
      icon: "ri-mail-check-line",
      title: "Confirm your email",
      message: "Confirm that you requested this listing claim. We will then verify the secure link.",
    },
    submitting: {
      icon: "ri-loader-4-line animate-spin",
      title: "Verifying your claim",
      message: "Please wait while we securely verify your email address.",
    },
    success: {
      icon: "ri-checkbox-circle-line",
      title: "Email verified",
      message: "Your claim is now ready for review. Our team will contact you after reviewing it.",
    },
    invalid: {
      icon: "ri-error-warning-line",
      title: "Invalid verification link",
      message: "This verification link is invalid or has already been used. Please submit a new claim if needed.",
    },
    expired: {
      icon: "ri-time-line",
      title: "Verification link expired",
      message: "This verification link has expired. Please submit a new listing claim to receive another link.",
    },
    error: {
      icon: "ri-wifi-off-line",
      title: "Verification unavailable",
      message: "We could not verify your claim right now. Please try again.",
    },
  }[state];

  return (
    <main className="min-h-screen bg-background-50 px-4 py-20 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border border-background-200/70 bg-white p-7 md:p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-100">
          <i className={`${content.icon} text-2xl text-accent-600`} aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-3">{content.title}</h1>
        <p className="text-sm md:text-base leading-relaxed text-foreground-500 mb-7">{content.message}</p>

        {state === "confirm" && (
          <button
            type="button"
            onClick={confirmClaim}
            className="w-full h-11 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Confirm email
          </button>
        )}
        {state === "submitting" && (
          <button type="button" disabled className="w-full h-11 rounded-full bg-primary-500 text-background-50 text-sm font-medium opacity-60">
            Verifying…
          </button>
        )}
        {state === "error" && (
          <button
            type="button"
            onClick={() => setState("confirm")}
            className="w-full h-11 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Try again
          </button>
        )}
        {(state === "success" || state === "invalid" || state === "expired") && (
          <Link to="/explore" className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors">
            Explore businesses
          </Link>
        )}
      </section>
    </main>
  );
}
