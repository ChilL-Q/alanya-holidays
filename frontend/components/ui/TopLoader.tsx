import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopLoader component renders a smooth top progress bar during route transitions.
 */
export const TopLoader: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger progress bar animation on location change
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setLoading(false), 200);
    }, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, location.search]);

  if (!loading && progress === 100) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div
        className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(20,184,166,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
          transition: 'width 200ms ease-out, opacity 200ms ease-in-out 100ms',
        }}
      />
    </div>
  );
};
