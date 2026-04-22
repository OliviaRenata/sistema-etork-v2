// src/context/ThemeContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Padrão global da aplicação: iniciar sempre em modo escuro
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    console.log('Theme changed to:', theme);
    localStorage.setItem('theme', theme);
    // Aplicar classes CSS no body para estilos globais
    if (theme === 'dark') {
      document.body.style.background = '#0a0a0a';
      document.body.style.color = '#e0e0e0';
    } else {
      document.body.style.background = '#f0f0f0';
      document.body.style.color = '#1a1a1a';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}