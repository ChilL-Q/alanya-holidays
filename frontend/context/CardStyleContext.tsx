import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export type CardStyle = 'box' | 'rectangle';

const STORAGE_KEY = 'directory_card_style';

interface CardStyleContextValue {
    cardStyle: CardStyle;
    setCardStyle: (style: CardStyle) => void;
}

const CardStyleContext = createContext<CardStyleContextValue | undefined>(undefined);

export const CardStyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cardStyle, setCardStyleState] = useState<CardStyle>(() => {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        return saved === 'rectangle' ? 'rectangle' : 'box';
    });

    const setCardStyle = useCallback((style: CardStyle) => {
        setCardStyleState(style);
        try {
            localStorage.setItem(STORAGE_KEY, style);
        } catch {
            // ignore storage failures (private mode, etc.)
        }
    }, []);

    return (
        <CardStyleContext.Provider value={{ cardStyle, setCardStyle }}>
            {children}
        </CardStyleContext.Provider>
    );
};

// Falls back to the 'box' default when used outside a provider (e.g. isolated
// component tests) so consumers never need to be wrapped just to render.
export const useCardStyle = (): CardStyleContextValue => {
    return useContext(CardStyleContext) ?? { cardStyle: 'box', setCardStyle: () => {} };
};
