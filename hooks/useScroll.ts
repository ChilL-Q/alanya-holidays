import React from 'react';

export function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(() => window.scrollY > threshold);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return scrolled;
}
