import { SubscriptionPlan, PlanDetails } from '../types';

/**
 * SOURCE UNIQUE DE VÉRITÉ DES FORFAITS REVIZO (App & Landing Page)
 * Règle stricte : Les quotas sont exprimés PAR JOUR.
 * Aucune ligne d'énergie max n'est affichée dans les forfaits payants.
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Essai Gratuit',
    priceFcfa: 0,
    dailyRevisionLimit: 1,
    maxEnergy: 3,
    period: 'gratuit à vie',
    desc: 'Idéal pour tester l\'efficacité et la clarté pédagogique de REVIZO sur votre premier cours.',
    btnText: 'Commencer gratuitement',
    features: [
      '1 cours d\'essai gratuit à vie',
      'Fiche synthétique structurée & claire',
      'Quiz interactif d\'auto-évaluation',
      'Accès sur mobile et ordinateur',
      'Téléchargement PDF de la fiche'
    ]
  },
  essentiel: {
    id: 'essentiel',
    name: 'Essentiel',
    priceFcfa: 1000,
    dailyRevisionLimit: 4,
    maxEnergy: 10,
    initialDiamonds: 10,
    period: 'FCFA / mois',
    desc: 'Pour les élèves réguliers qui veulent progresser chaque jour dans leurs matières.',
    btnText: 'Choisir Essentiel',
    features: [
      '4 révisions intelligentes par jour',
      '10 diamants 💎 offerts à l\'inscription',
      'Génération complète de fiches & quiz',
      'Mode révision ciblée sur les erreurs',
      'Paiement facile par Mobile Money'
    ]
  },
  intensif: {
    id: 'intensif',
    name: 'Intensif',
    priceFcfa: 3000,
    dailyRevisionLimit: 10,
    maxEnergy: 20,
    initialDiamonds: 30,
    isPopular: true,
    badge: 'Le plus populaire',
    period: 'FCFA / mois',
    desc: 'La formule recommandée pour préparer activement devoirs, brevets et examens.',
    btnText: 'Choisir Intensif',
    features: [
      '10 révisions intelligentes par jour',
      '30 diamants 💎 offerts à l\'inscription',
      'Quiz et exercices renforcés',
      'Suivi des notions fragiles & progression',
      'Support prioritaire',
      'Paiement facile par Mobile Money'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceFcfa: 5000,
    dailyRevisionLimit: 18,
    maxEnergy: 30,
    initialDiamonds: 60,
    badge: 'Expérience complète',
    period: 'FCFA / mois',
    desc: 'L\'expérience REVIZO intégrale pour les élèves visant l\'excellence académique.',
    btnText: 'Choisir Premium',
    features: [
      '18 révisions intelligentes par jour',
      '60 diamants 💎 offerts à l\'inscription',
      'Traitement IA prioritaire ultra-rapide',
      'Analyses documentaires approfondies',
      'Toutes les matières sans compromis',
      'Paiement facile par Mobile Money'
    ]
  }
};

export const ORDERED_PLANS: PlanDetails[] = [
  SUBSCRIPTION_PLANS.free,
  SUBSCRIPTION_PLANS.essentiel,
  SUBSCRIPTION_PLANS.intensif,
  SUBSCRIPTION_PLANS.premium
];
