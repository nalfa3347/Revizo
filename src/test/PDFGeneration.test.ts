import { describe, it, expect } from 'vitest';
import { buildRevisionPDF, escWinAnsi, RevisionService } from '../services/RevisionService';
import { Revision } from '../types';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

describe('Génération de PDF Natif REVIZO (PDF 1.4 Binaire)', () => {
  const sampleRevision: Revision = {
    id: 'rev-math-01',
    courseId: 'crs-math-01',
    courseTitle: 'Mathématiques — Équations du Second Degré',
    title: 'Fiche Essentielle — Équations du Second Degré',
    summary: 'Cette fiche synthétise la résolution d\'une équation polynomiale de degré 2 grâce au discriminant Delta. Elle présente les trois cas possibles selon le signe de Delta.',
    keyConcepts: [
      'Forme canonique : a(x - alpha)^2 + beta',
      'Discriminant : Delta = b^2 - 4ac',
      'Racines réelles : x1 et x2 si Delta > 0, x0 si Delta = 0'
    ],
    rulesFormulas: [
      'Delta = b^2 - 4ac',
      'x = (-b ± sqrt(Delta)) / (2a)'
    ],
    sections: [
      {
        id: 'sec-01',
        order: 1,
        title: 'Définition et Identification des Coefficients',
        content: 'Une équation du second degré s\'écrit sous la forme ax^2 + bx + c = 0 où a, b, c sont des réels avec a non nul.',
        keyTakeaways: [
          'Toujours vérifier que a ≠ 0',
          'Bien repérer les signes de b et c'
        ],
        examples: [
          'Exemple : 2x^2 - 4x + 2 = 0 donne a=2, b=-4, c=2'
        ]
      },
      {
        id: 'sec-02',
        order: 2,
        title: 'Calcul du Discriminant et Interprétation',
        content: 'Le discriminant noté Delta permet de déterminer directement le nombre et la valeur des solutions réelles de l\'équation.',
        keyTakeaways: [
          'Si Delta < 0 : aucune racine réelle',
          'Si Delta = 0 : une racine double',
          'Si Delta > 0 : deux racines distinctes'
        ],
        formulas: [
          'x1 = (-b - sqrt(Delta)) / 2a',
          'x2 = (-b + sqrt(Delta)) / 2a'
        ]
      }
    ],
    totalSections: 2,
    isDownloaded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('génère un en-tête et une fin de fichier PDF 1.4 valides', () => {
    const pdfBytes = buildRevisionPDF(sampleRevision);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(pdfString).toContain('/Type /Catalog');
    expect(pdfString).toContain('/Type /Pages');
  });

  it('échappe correctement les accents français en séquences octales WinAnsi', () => {
    const escaped = escWinAnsi('REVIZO — Fiche de Révision (Élève & Maître, à l\'école)');
    // — doit être \227, é doit être \351, É doit être \311, è doit être \350, î doit être \356, à doit être \340
    expect(escaped).toContain('\\227'); // em-dash
    expect(escaped).toContain('\\351'); // é
    expect(escaped).toContain('\\311'); // É
    expect(escaped).toContain('\\350'); // è
    expect(escaped).toContain('\\356'); // î
    expect(escaped).toContain('\\340'); // à
    expect(escaped).not.toContain('â€”');
    expect(escaped).not.toContain('Ã©');
  });

  it('peut être analysé par pdfjs-dist et conserve tous ses blocs de texte sur la page', async () => {
    const pdfBytes = buildRevisionPDF(sampleRevision);
    const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
    expect(doc.numPages).toBeGreaterThanOrEqual(1);

    const page = await doc.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str: string; transform: number[] }>;

    expect(items.length).toBeGreaterThan(20);

    // Vérifier la présence des éléments clés
    const fullText = items.map(i => i.str).join(' ');
    expect(fullText).toContain('REVIZO');
    expect(fullText).toContain('FICHE DE RÉVISION SCOLAIRE');
    expect(fullText).toContain('Résumé Essentiel');
    expect(fullText).toContain('Points Clés à Retenir');
    expect(fullText).toContain('Définition et Identification des Coefficients');
    expect(fullText).toContain('Calcul du Discriminant et Interprétation');
    expect(fullText).toContain('Page 1 sur');

    // Vérifier que toutes les coordonnées de placement sont strictement visibles sur la feuille A4 (595 x 842)
    for (const item of items) {
      if (!item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      expect(x).toBeGreaterThanOrEqual(30);
      expect(x).toBeLessThanOrEqual(570);
      expect(y).toBeGreaterThanOrEqual(20);
      expect(y).toBeLessThanOrEqual(825);
    }
  });

  it('gère la pagination automatique sans chevauchement pour les cours longs', async () => {
    const longRevision: Revision = {
      ...sampleRevision,
      sections: [
        ...sampleRevision.sections,
        {
          id: 'sec-03',
          order: 3,
          title: 'Section Additionnelle 1 : Étude de Signe du Trinôme',
          content: 'Le signe du trinôme dépend du signe de a à l\'extérieur des racines et du signe opposé de a entre les racines.',
          keyTakeaways: ['Signe de a à l\'extérieur des racines']
        },
        {
          id: 'sec-04',
          order: 4,
          title: 'Section Additionnelle 2 : Somme et Produit des Racines',
          content: 'Les relations de Viète permettent de retrouver les racines sans calculer le discriminant : S = -b/a et P = c/a.',
          keyTakeaways: ['S = -b/a', 'P = c/a']
        },
        {
          id: 'sec-05',
          order: 5,
          title: 'Section Additionnelle 3 : Factorisation et Cas Particuliers',
          content: 'Si c = 0, on factorise immédiatement par x. Si b = 0, on résout directement par extraction de racine.',
          keyTakeaways: ['Factorisation directe quand possible']
        }
      ]
    };

    const pdfBytes = buildRevisionPDF(longRevision);
    const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;

    expect(doc.numPages).toBe(2);

    const page2 = await doc.getPage(2);
    const p2Text = await page2.getTextContent();
    const p2Items = p2Text.items as Array<{ str: string; transform: number[] }>;
    const p2Joined = p2Items.map(i => i.str).join(' ');

    expect(p2Joined).toContain('REVIZO');
    expect(p2Joined).toContain('(suite)');
    expect(p2Joined).toContain('Page 2 sur 2');
  });

  it('met à jour l\'état de téléchargement via downloadRevisionPDF', async () => {
    const mockProvider = new MockDataProvider();
    const service = new RevisionService(mockProvider);

    const success = await service.downloadRevisionPDF(sampleRevision);
    expect(success).toBe(true);
    const rev = await mockProvider.getRevisionByCourseId(sampleRevision.courseId);
    expect(rev?.isDownloaded).toBe(true);
  });
});
