import { describe, it, expect } from 'vitest';
import { getPdfPageCount, MAX_REVISION_PAGES } from '../utils/documentUtils';

describe('Utilitaires de Contrôle Documentaire REVIZO (Volumétrie)', () => {
  it('définit la limite maximale garantie à 20 pages', () => {
    expect(MAX_REVISION_PAGES).toBe(20);
  });

  it('retourne 1 par défaut pour un fichier non PDF ou sans métadonnées de pagination', async () => {
    const file = new File(['Texte quelconque de cours sans pages'], 'cours_court.txt', {
      type: 'text/plain'
    });
    const count = await getPdfPageCount(file);
    expect(count).toBe(1);
  });

  it('détecte correctement le nombre de pages à partir des balises /Count du PDF', async () => {
    const fakePdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 15 /Kids [ 2 0 R ] >>\nendobj\n%%EOF`;
    const file = new File([fakePdfContent], 'cours_15_pages.pdf', {
      type: 'application/pdf'
    });
    const count = await getPdfPageCount(file);
    expect(count).toBe(15);
    expect(count <= MAX_REVISION_PAGES).toBe(true);
  });

  it('détecte un document dépassant la limite de 20 pages', async () => {
    const fakeLongPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 35 /Kids [] >>\nendobj\n%%EOF`;
    const file = new File([fakeLongPdf], 'cours_35_pages.pdf', {
      type: 'application/pdf'
    });
    const count = await getPdfPageCount(file);
    expect(count).toBe(35);
    expect(count > MAX_REVISION_PAGES).toBe(true);
  });
});
