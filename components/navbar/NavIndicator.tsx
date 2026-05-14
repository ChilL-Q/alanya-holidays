import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface NavIndicatorProps {
    mode?: 'rental' | 'services';
}

export const NavIndicator: React.FC<NavIndicatorProps> = ({ mode }) => {
    const location = useLocation();
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });

    useEffect(() => {
        const timer = setTimeout(() => {
            const activeLink = document.querySelector(`[data-nav-link="${location.pathname}"]`) as HTMLElement;
            if (activeLink) {
                setStyle({
                    left: activeLink.offsetLeft,
                    width: activeLink.offsetWidth,
                    opacity: 1,
                });
            } else {
                setStyle({ opacity: 0 });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [location.pathname, mode]);

    return (
        <div
            className="absolute bottom-0 h-0.5 bg-primary dark:bg-accent rounded-full transition-all duration-300 ease-out z-10"
            style={style}
        />
    );
};
