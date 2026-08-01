import React, { ReactNode } from 'react';
import { useCardStyleStore, CardStyle } from '../lib/stores/useCardStyleStore';

export type { CardStyle };

export const CardStyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useCardStyle = () => {
  const cardStyle = useCardStyleStore((state) => state.cardStyle);
  const setCardStyle = useCardStyleStore((state) => state.setCardStyle);
  return { cardStyle, setCardStyle };
};
