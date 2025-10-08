'use client';

import { useUI } from '@/contexts/UIContext';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useUI();

  const getContentStyles = () => {
    switch (settings.navPosition) {
      case 'left':
        return 'ml-64';
      case 'right':
        return 'mr-64';
      case 'top':
      default:
        return '';
    }
  };

  return (
    <div className={`${getContentStyles()} transition-all duration-300`}>
      {children}
    </div>
  );
}
