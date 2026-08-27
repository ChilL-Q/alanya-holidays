import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

interface DarkModeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue>({
  isDark: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const toggle = useCallback(() => {}, []);

  const value = useMemo(() => ({ isDark, toggle }), [isDark, toggle]);

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}