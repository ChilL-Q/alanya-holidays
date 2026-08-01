import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { AuthProvider } from '../../context/AuthContext';
import { CurrencyProvider } from '../../context/CurrencyContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { CartProvider } from '../../context/CartContext';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { ModalProvider } from '../../context/ModalContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders composes core application context providers in a flat, clean structure.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CurrencyProvider>
                <NotificationProvider>
                  <CartProvider>
                    <FavoritesProvider>
                      <ModalProvider>
                        {children}
                      </ModalProvider>
                    </FavoritesProvider>
                  </CartProvider>
                </NotificationProvider>
              </CurrencyProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};
