import { useState, useEffect } from 'react';

/**
 * REVIZO — Hook de Détection et Simulation Réseau
 * Permet à l'application de s'adapter gracieusement aux états hors connexion
 * et d'offrir un basculeur de test local pour la validation des scénarios hors-ligne.
 */
export function useNetworkStatus() {
  const [isRealOnline, setIsRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsRealOnline(true);
    const handleOffline = () => setIsRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isOnline = isRealOnline && !isSimulatedOffline;

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline(prev => !prev);
  };

  return {
    isOnline,
    isRealOnline,
    isSimulatedOffline,
    toggleSimulatedOffline
  };
}
