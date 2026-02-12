// src/components/OfflineIndicator.tsx
import { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000); // Nach 3 Sek. ausblenden
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator && isOnline) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] px-4 py-2 rounded-lg shadow-lg text-white font-semibold transition-all ${
        isOnline ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {isOnline ? (
        <div className='flex items-center gap-2'>
          <span className='text-xl'>✓</span>
          <span>Wieder online</span>
        </div>
      ) : (
        <div className='flex items-center gap-2'>
          <span className='text-xl'>✈️</span>
          <span>Offline-Modus</span>
        </div>
      )}
    </div>
  );
};
