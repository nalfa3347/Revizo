/**
 * REVIZO — GESTIONNAIRE D'ERREURS UTILISATEUR
 * Règle absolue N°16 : Zéro message technique pour l'élève.
 * Traduit toute exception en message pédagogique, clair et rassurant.
 */

export interface FriendlyError {
  title: string;
  message: string;
  actionText?: string;
  isOfflineRelated?: boolean;
}

export function formatFriendlyError(error: unknown, isOffline: boolean = false): FriendlyError {
  // Cas 1 : Déconnexion réseau
  if (isOffline) {
    return {
      title: 'Mode hors connexion',
      message: 'Une connexion Internet est nécessaire pour effectuer cette action.',
      actionText: 'Réessayer une fois connecté',
      isOfflineRelated: true
    };
  }

  const rawMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Cas 2 : Erreur réseau technique
  if (
    rawMessage.includes('network') ||
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('enotfound') ||
    rawMessage.includes('timeout')
  ) {
    return {
      title: 'Connexion interrompue',
      message: 'Vérifie ta connexion Internet pour continuer tes révisions.',
      actionText: 'Vérifier la connexion',
      isOfflineRelated: true
    };
  }

  // Cas 3 : Contenu non trouvé (404 / introuvable)
  if (rawMessage.includes('not found') || rawMessage.includes('introuvable') || rawMessage.includes('404')) {
    return {
      title: 'Contenu indisponible',
      message: 'Ce cours ou cette fiche n’a pas pu être chargé. Reviens à la bibliothèque pour choisir un cours.',
      actionText: 'Retour aux cours'
    };
  }

  // Cas 4 : Énergie insuffisante
  if (rawMessage.includes('énergie') || rawMessage.includes('energy')) {
    return {
      title: 'Énergie épuisée',
      message: 'Tu n’as plus d’énergie pour ce quiz. Utilise tes diamants pour recharger tes 3 énergies !',
      actionText: 'Recharger avec des diamants'
    };
  }

  // Cas 5 : Surcharge / Rate Limit (429)
  if (rawMessage.includes('429') || rawMessage.includes('rate limit') || rawMessage.includes('quota')) {
    return {
      title: 'Un petit instant...',
      message: 'L’analyse prend un court moment. Tes révisions seront prêtes dans quelques secondes.',
      actionText: 'Patienter'
    };
  }

  // Cas 6 : Erreur par défaut rassurante
  return {
    title: 'Oups, un petit contretemps',
    message: 'Une difficulté temporaire est survenue. Tout est sous contrôle, réessaie dans un instant.',
    actionText: 'Réessayer'
  };
}
