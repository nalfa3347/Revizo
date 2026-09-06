import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const NetworkBar: React.FC = () => {
  const { network } = useData();

  if (network.isOnline && !network.isSimulatedOffline) {
    return null; // En ligne normal : pas de bandeau intrusif
  }

  return (
    <div className="offline-banner">
      <WifiOff size={14} />
      <span>Mode hors connexion — Seules les révisions téléchargées sont consultables.</span>
      <button
        onClick={network.toggleSimulatedOffline}
        className="btn btn-outline btn-sm"
        style={{ padding: '2px 8px', fontSize: '10px', marginLeft: 'auto' }}
        title="Basculeur de simulation réseau (outil de test)"
      >
        {network.isSimulatedOffline ? <><Wifi size={10} /> Rétablir réseau</> : 'Simuler hors-ligne'}
      </button>
    </div>
  );
};
