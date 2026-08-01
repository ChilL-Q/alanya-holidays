import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CardStyle = 'box' | 'rectangle';

interface CardStyleState {
  cardStyle: CardStyle;
  setCardStyle: (style: CardStyle) => void;
}

export const useCardStyleStore = create<CardStyleState>()(
  persist(
    (set) => ({
      cardStyle: 'box',
      setCardStyle: (style: CardStyle) => set({ cardStyle: style }),
    }),
    {
      name: 'directory_card_style',
    }
  )
);
