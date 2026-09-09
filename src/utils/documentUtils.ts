/**
 * Utilitaires pour le contrôle de volumétrie des documents de cours REVIZO
 */

export const MAX_REVISION_PAGES = 20;

/**
 * Extrait le nombre de pages d'un fichier PDF de manière ultra-rapide côté client
 */
export async function getPdfPageCount(file: File): Promise<number> {
  if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) {
    return 1;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder('latin1').decode(new Uint8Array(arrayBuffer));

    // Recherche /Count N dans le dictionnaire Pages
    const countMatches = [...text.matchAll(/\/Type\s*\/Pages[\s\S]{1,300}?\/Count\s+(\d+)/g)];
    if (countMatches.length > 0) {
      let maxCount = 0;
      for (const m of countMatches) {
        const c = parseInt(m[1], 10);
        if (c > maxCount) maxCount = c;
      }
      if (maxCount > 0) return maxCount;
    }

    // Décompte direct des objets Page individuels
    const pageMatches = [...text.matchAll(/\/Type\s*\/Page\b(?!\s*s)/g)];
    if (pageMatches.length > 0) return pageMatches.length;

    // Fallback dynamique pdfjs-dist si disponible dans l'environnement
    try {
      const pdfjs = await import('pdfjs-dist');
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const doc = await loadingTask.promise;
      return doc.numPages;
    } catch {}
  } catch (err) {
    console.warn('Impossible de déterminer le nombre exact de pages du PDF:', err);
  }

  return 1;
}
