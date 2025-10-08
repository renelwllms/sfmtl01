'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type NavPosition = 'top' | 'left' | 'right';
type NavStyle = 'gradient' | 'solid' | 'glass' | 'minimal';

interface UISettings {
  navPosition: NavPosition;
  navStyle: NavStyle;
}

interface UIContextType {
  settings: UISettings;
  updateSettings: (newSettings: Partial<UISettings>) => void;
}

const defaultSettings: UISettings = {
  navPosition: 'top',
  navStyle: 'gradient'
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('uiSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse UI settings:', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UISettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('uiSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UIContext.Provider value={{ settings, updateSettings }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}
