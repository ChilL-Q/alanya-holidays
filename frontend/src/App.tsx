import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import BackToTop from "./components/base/BackToTop";
import { DarkModeProvider } from "./components/base/DarkModeContext";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./hooks/useFavorites";
import { CompareProvider } from "./hooks/useCompare";
import { CartProvider } from "./hooks/useCart";
import WhatsAppFloatingButton from "./components/feature/WhatsAppFloatingButton";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <DarkModeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CompareProvider>
              <CartProvider>
                <BrowserRouter basename={__BASE_PATH__}>
                  <AppRoutes />
                  <BackToTop />
                  <WhatsAppFloatingButton />
                </BrowserRouter>
              </CartProvider>
            </CompareProvider>
          </FavoritesProvider>
        </AuthProvider>
      </DarkModeProvider>
    </I18nextProvider>
  );
}

export default App;