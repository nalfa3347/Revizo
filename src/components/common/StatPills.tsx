import React from 'react';
import { Zap, Gem, Flame, Award } from 'lucide-react';
import { UserProgress } from '../../types';
import { Skeleton } from './Skeleton';

interface StatPillsProps {
  progress: UserProgress | null;
  isLoading?: boolean;
}

export const StatPills: React.FC<StatPillsProps> = ({ progress, isLoading = false }) => {
  if (isLoading || !progress) {
    return (
      <div className="stat-pills-row">
        <Skeleton width={80} height={28} borderRadius="var(--radius-full)" />
        <Skeleton width={80} height={28} borderRadius="var(--radius-full)" />
        <Skeleton width={70} height={28} borderRadius="var(--radius-full)" />
        <Skeleton width={90} height={28} borderRadius="var(--radius-full)" />
      </div>
    );
  }

  return (
    <div className="stat-pills-row">
      {/* 3 Énergies */}
      <div className="stat-pill stat-pill-energy" title="Énergies restantes (max 3)">
        <Zap size={14} fill="currentColor" />
        <span>{progress.energyBalance} / 3</span>
      </div>

      {/* Diamants */}
      <div className="stat-pill stat-pill-diamonds" title="Diamants récoltés">
        <Gem size={14} />
        <span>{progress.diamondsBalance}</span>
      </div>

      {/* Streak / Série */}
      <div className="stat-pill stat-pill-streak" title="Jours consécutifs d'apprentissage">
        <Flame size={14} fill="currentColor" />
        <span>{progress.currentStreak} j</span>
      </div>

      {/* XP Total & Niveau */}
      <div className="stat-pill stat-pill-xp" title="Niveau et Points d'expérience">
        <Award size={14} />
        <span>Niv. {progress.level} • {progress.totalXp} XP</span>
      </div>
    </div>
  );
};
