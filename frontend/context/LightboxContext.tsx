import React, { ReactNode } from 'react';
import { useLightboxStore, LightboxImage } from '../lib/stores/useLightboxStore';

export type { LightboxImage };

export const LightboxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useLightbox = () => {
  return useLightboxStore();
};
