'use client';

import { useState, useEffect } from 'react';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const [footerText, setFooterText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranding();
  }, []);

  async function fetchBranding() {
    try {
      const response = await fetch('/api/public/branding');
      if (response.ok) {
        const data = await response.json();
        setFooterText(data.settings.footerText || '');
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  }

  // Don't render if no footer text is set
  if (loading || !footerText) {
    return null;
  }

  // Function to render footer text with Edgepoint as a clickable link
  const renderFooterText = () => {
    // Replace "Edgepoint" with a clickable link
    const parts = footerText.split(/(Edgepoint)/gi);

    return parts.map((part, index) => {
      if (part.toLowerCase() === 'edgepoint') {
        return (
          <a
            key={index}
            href="https://edgepoint.co.nz/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <footer className={`bg-gray-100 border-t border-gray-200 py-4 text-center ${className}`}>
      <div className="container mx-auto px-4">
        <p className="text-sm text-gray-600">{renderFooterText()}</p>
      </div>
    </footer>
  );
}
