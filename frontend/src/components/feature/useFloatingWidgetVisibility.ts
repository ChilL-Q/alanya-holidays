import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const SUPPRESSED_ROUTE_PREFIXES = ["/login", "/register", "/checkout", "/admin"];
const BLOCKING_SELECTOR = [
  "footer",
  "form",
  '[role="dialog"][aria-modal="true"]',
  '[data-floating-ui-obstruction="true"]',
  '[data-floating-cta="true"]',
  '[class*="fixed"][class*="bottom-"]',
  '[class*="sticky"][class*="bottom-"]',
].join(",");

function isSuppressedRoute(pathname: string): boolean {
  return SUPPRESSED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isOpenDialog(element: Element): boolean {
  return (
    element.matches('[role="dialog"][aria-modal="true"]') &&
    element.getAttribute("aria-hidden") !== "true"
  );
}

export function useFloatingWidgetVisibility(): boolean {
  const { pathname } = useLocation();
  const routeSuppressed = useMemo(() => isSuppressedRoute(pathname), [pathname]);
  const [pageObstructed, setPageObstructed] = useState(false);

  useEffect(() => {
    if (routeSuppressed || typeof document === "undefined") return;

    const intersecting = new Set<Element>();
    const observed = new Set<Element>();
    const canObserveIntersections = typeof IntersectionObserver !== "undefined";

    const update = () => {
      const hasOpenDialog = Array.from(
        document.querySelectorAll('[role="dialog"][aria-modal="true"]'),
      ).some(isOpenDialog);
      const hasExplicitObstruction = Boolean(
        document.querySelector('[data-floating-ui-obstruction="true"]'),
      );
      setPageObstructed(hasOpenDialog || hasExplicitObstruction || intersecting.size > 0);
    };

    const intersectionObserver = canObserveIntersections
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) intersecting.add(entry.target);
            else intersecting.delete(entry.target);
          });
          update();
        })
      : null;

    const observeBlockers = () => {
      document.querySelectorAll(BLOCKING_SELECTOR).forEach((element) => {
        if (element.closest("[data-floating-widget]") || observed.has(element)) return;
        observed.add(element);
        intersectionObserver?.observe(element);
      });
      update();
    };

    const mutationObserver = new MutationObserver(observeBlockers);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "class", "data-floating-ui-obstruction"],
    });
    observeBlockers();

    return () => {
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [routeSuppressed]);

  return !routeSuppressed && !pageObstructed;
}
