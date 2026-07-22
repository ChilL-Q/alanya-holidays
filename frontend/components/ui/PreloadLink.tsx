import React, { useRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { prefetchRoute } from '../../utils/routePreloader';

export interface PreloadLinkProps extends LinkProps {
  /** Delay in ms before triggering prefetch on hover (default: 50ms) */
  prefetchTimeoutMs?: number;
}

export const PreloadLink: React.FC<PreloadLinkProps> = ({
  to,
  prefetchTimeoutMs = 50,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onPointerDown,
  children,
  ...props
}) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerEnter = (e: React.PointerEvent<HTMLAnchorElement>) => {
    onPointerEnter?.(e);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (typeof to === 'string') {
        prefetchRoute(to);
      } else if (typeof to === 'object' && to.pathname) {
        prefetchRoute(to.pathname);
      }
    }, prefetchTimeoutMs);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    onPointerLeave?.(e);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    onFocus?.(e);
    const targetPath = typeof to === 'string' ? to : to.pathname;
    if (targetPath) prefetchRoute(targetPath);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    onPointerDown?.(e);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const targetPath = typeof to === 'string' ? to : to.pathname;
    if (targetPath) prefetchRoute(targetPath);
  };

  return (
    <Link
      to={to}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </Link>
  );
};
