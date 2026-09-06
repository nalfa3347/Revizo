import { IDataProvider } from '../contracts/IDataProvider';
import { Revision } from '../types';

/**
 * Encode et échappe une chaîne de caractères pour les polices standard PDF
 * avec encodage WinAnsi (Windows-1252 / ISO-8859-1).
 * Convertit tous les caractères accentués et symboles français en séquences octales valides.
 */
export function escWinAnsi(str: string): string {
  if (!str) return '';
  const winAnsiMap: Record<string, number> = {
    'é': 233, 'è': 232, 'ê': 234, 'ë': 235,
    'à': 224, 'â': 226, 'ä': 228,
    'î': 238, 'ï': 239,
    'ô': 244, 'ö': 246,
    'ù': 249, 'û': 251, 'ü': 252,
    'ç': 231,
    'É': 201, 'È': 200, 'Ê': 202, 'Ë': 203,
    'À': 192, 'Â': 194, 'Ç': 199,
    'œ': 156, 'Œ': 140,
    '—': 151, '–': 150,
    '’': 146, '‘': 145, '“': 147, '”': 148,
    '«': 171, '»': 187,
    '•': 149, '…': 133, '°': 176, '€': 128
  };

  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '\\') {
      out += '\\\\';
    } else if (ch === '(') {
      out += '\\(';
    } else if (ch === ')') {
      out += '\\)';
    } else if (winAnsiMap[ch] !== undefined) {
      out += '\\' + winAnsiMap[ch].toString(8).padStart(3, '0');
    } else {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        out += ch;
      } else if (code >= 160 && code <= 255) {
        out += '\\' + code.toString(8).padStart(3, '0');
      } else {
        // Remplacement propre des symboles typographiques hors WinAnsi
        if (ch === '★') out += '*';
        else if (ch === '▸') out += '>';
        else if (ch === 'ƒ') out += 'f';
        else if (ch === '✓' || ch === '✔') out += 'v';
        else if (ch === '✗' || ch === '✘') out += 'x';
        else out += ' ';
      }
    }
  }
  return out;
}

/**
 * Découpe une chaîne en lignes ne dépassant pas maxWidth selon la taille de police (Helvetica).
 */
function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const charWidth = fontSize * 0.51; // Approximation largeur moyenne Helvetica
  const maxChars = Math.max(10, Math.floor(maxWidth / charWidth));
  const result: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      result.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (test.length > maxChars && currentLine) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) result.push(currentLine);
  }
  return result;
}

type DrawItem =
  | { type: 'rect_fill'; r: number; g: number; b: number; x: number; y: number; w: number; h: number }
  | { type: 'line'; r: number; g: number; b: number; x1: number; y1: number; x2: number; y2: number; w: number }
  | { type: 'text'; font: 'F1' | 'F2' | 'F3'; size: number; r: number; g: number; b: number; x: number; y: number; text: string };

/**
 * Construit un document PDF 1.4 binaire complet, multipages, élégant et conforme
 * aux spécifications PDF ISO 32000-1 avec positionnement absolu via matrices Tm.
 */
export function buildRevisionPDF(revision: Revision): Uint8Array {
  const pageWidth = 595; // A4 standard (72 dpi)
  const pageHeight = 842;
  const marginLeft = 40;
  const marginRight = 40;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const contentBottom = 55;

  const pages: DrawItem[][] = [];
  let currentPage: DrawItem[] = [];
  let currentY = pageHeight - 40;

  function newPage() {
    pages.push(currentPage);
    currentPage = [];
    currentY = pageHeight - 50; // Marge haute page 2+
  }

  function ensureSpace(neededHeight: number) {
    if (currentY - neededHeight < contentBottom) {
      newPage();
    }
  }

  // --- Page 1 : En-tête de marque REVIZO ---
  // Barre supérieure indigo
  currentPage.push({
    type: 'rect_fill',
    r: 0.31, g: 0.27, b: 0.90, // Indigo #4F46E5
    x: marginLeft, y: pageHeight - 35, w: usableWidth, h: 4
  });

  // Titre logo
  currentPage.push({
    type: 'text',
    font: 'F2', size: 14,
    r: 0.31, g: 0.27, b: 0.90,
    x: marginLeft, y: pageHeight - 55,
    text: 'REVIZO'
  });

  // Badge catégorie
  currentPage.push({
    type: 'text',
    font: 'F2', size: 8,
    r: 0.40, g: 0.45, b: 0.55,
    x: marginLeft + 68, y: pageHeight - 53,
    text: 'FICHE DE RÉVISION SCOLAIRE'
  });

  // Ligne de séparation
  currentPage.push({
    type: 'line',
    r: 0.85, g: 0.88, b: 0.92,
    x1: marginLeft, y1: pageHeight - 65, x2: pageWidth - marginRight, y2: pageHeight - 65,
    w: 0.75
  });

  // Titre du cours
  currentY = pageHeight - 85;
  const titleLines = wrapText(revision.title, 14, usableWidth);
  for (const tl of titleLines) {
    currentPage.push({
      type: 'text',
      font: 'F2', size: 14,
      r: 0.06, g: 0.09, b: 0.16,
      x: marginLeft, y: currentY,
      text: tl
    });
    currentY -= 18;
  }

  // Métadonnées : cours & date
  currentPage.push({
    type: 'text',
    font: 'F1', size: 9,
    r: 0.39, g: 0.45, b: 0.55,
    x: marginLeft, y: currentY,
    text: `Cours : ${revision.courseTitle}  |  Exporté le : ${new Date().toLocaleDateString('fr-FR')}`
  });
  currentY -= 20;

  function addHeading(title: string, color = { r: 0.24, g: 0.21, b: 0.75 }) {
    ensureSpace(30);
    // Petit accent visuel
    currentPage.push({
      type: 'rect_fill',
      r: color.r, g: color.g, b: color.b,
      x: marginLeft, y: currentY - 1, w: 12, h: 2
    });
    currentPage.push({
      type: 'text',
      font: 'F2', size: 11,
      r: color.r, g: color.g, b: color.b,
      x: marginLeft + 18, y: currentY,
      text: title
    });
    currentY -= 16;
  }

  // 1. Résumé Essentiel
  if (revision.summary) {
    addHeading('Résumé Essentiel');
    const summaryLines = wrapText(revision.summary, 9.5, usableWidth - 16);
    const boxHeight = summaryLines.length * 13 + 8;
    ensureSpace(boxHeight + 10);

    // Barre d'accent gauche
    currentPage.push({
      type: 'rect_fill',
      r: 0.31, g: 0.27, b: 0.90,
      x: marginLeft, y: currentY - boxHeight + 8, w: 3, h: boxHeight
    });
    // Fond carte doux
    currentPage.push({
      type: 'rect_fill',
      r: 0.96, g: 0.97, b: 1.00,
      x: marginLeft + 3, y: currentY - boxHeight + 8, w: usableWidth - 3, h: boxHeight
    });

    let textY = currentY - 4;
    for (const sl of summaryLines) {
      currentPage.push({
        type: 'text',
        font: 'F1', size: 9.5,
        r: 0.15, g: 0.20, b: 0.30,
        x: marginLeft + 12, y: textY,
        text: sl
      });
      textY -= 13;
    }
    currentY -= boxHeight + 14;
  }

  // 2. Points Clés à Retenir
  if (revision.keyConcepts && revision.keyConcepts.length > 0) {
    addHeading('Points Clés à Retenir');
    for (const concept of revision.keyConcepts) {
      const cLines = wrapText(concept, 9.5, usableWidth - 25);
      ensureSpace(cLines.length * 13 + 4);

      // Puce stylisée
      currentPage.push({
        type: 'text',
        font: 'F2', size: 11,
        r: 0.31, g: 0.27, b: 0.90,
        x: marginLeft + 6, y: currentY,
        text: '•'
      });

      for (let i = 0; i < cLines.length; i++) {
        currentPage.push({
          type: 'text',
          font: 'F1', size: 9.5,
          r: 0.15, g: 0.20, b: 0.30,
          x: marginLeft + 20, y: currentY,
          text: cLines[i]
        });
        currentY -= 13;
      }
      currentY -= 2;
    }
    currentY -= 10;
  }

  // 3. Règles et Formules
  if (revision.rulesFormulas && revision.rulesFormulas.length > 0) {
    addHeading('Règles et Formules Fondamentales', { r: 0.85, g: 0.40, b: 0.05 });
    for (const rule of revision.rulesFormulas) {
      const rLines = wrapText(rule, 9.5, usableWidth - 25);
      ensureSpace(rLines.length * 13 + 4);

      currentPage.push({
        type: 'text',
        font: 'F2', size: 10,
        r: 0.85, g: 0.40, b: 0.05,
        x: marginLeft + 6, y: currentY,
        text: '▸'
      });

      for (const rl of rLines) {
        currentPage.push({
          type: 'text',
          font: 'F2', size: 9.5,
          r: 0.15, g: 0.20, b: 0.30,
          x: marginLeft + 20, y: currentY,
          text: rl
        });
        currentY -= 13;
      }
      currentY -= 2;
    }
    currentY -= 10;
  }

  // 4. Sections détaillées du cours
  if (revision.sections && revision.sections.length > 0) {
    for (let sIdx = 0; sIdx < revision.sections.length; sIdx++) {
      const sec = revision.sections[sIdx];
      ensureSpace(35);

      // Titre numéroté de section
      currentPage.push({
        type: 'text',
        font: 'F2', size: 11,
        r: 0.06, g: 0.09, b: 0.16,
        x: marginLeft, y: currentY,
        text: `${sIdx + 1}. ${sec.title}`
      });
      currentY -= 15;

      // Contenu principal de la section
      if (sec.content) {
        const pLines = wrapText(sec.content, 9.5, usableWidth - 10);
        for (const pl of pLines) {
          ensureSpace(14);
          currentPage.push({
            type: 'text',
            font: 'F1', size: 9.5,
            r: 0.25, g: 0.30, b: 0.40,
            x: marginLeft + 8, y: currentY,
            text: pl
          });
          currentY -= 13;
        }
      }

      // À retenir
      if (sec.keyTakeaways && sec.keyTakeaways.length > 0) {
        ensureSpace(20);
        currentY -= 4;
        currentPage.push({
          type: 'text',
          font: 'F2', size: 9,
          r: 0.20, g: 0.25, b: 0.35,
          x: marginLeft + 12, y: currentY,
          text: 'À retenir :'
        });
        currentY -= 12;

        for (const kt of sec.keyTakeaways) {
          const ktLines = wrapText(`– ${kt}`, 9, usableWidth - 30);
          for (const kl of ktLines) {
            ensureSpace(13);
            currentPage.push({
              type: 'text',
              font: 'F1', size: 9,
              r: 0.30, g: 0.35, b: 0.45,
              x: marginLeft + 20, y: currentY,
              text: kl
            });
            currentY -= 12;
          }
        }
      }

      // Exemples
      if (sec.examples && sec.examples.length > 0) {
        ensureSpace(20);
        currentY -= 4;
        currentPage.push({
          type: 'text',
          font: 'F2', size: 9,
          r: 0.10, g: 0.50, b: 0.30,
          x: marginLeft + 12, y: currentY,
          text: 'Exemples :'
        });
        currentY -= 12;

        for (const ex of sec.examples) {
          const exLines = wrapText(`★ ${ex}`, 9, usableWidth - 30);
          for (const el of exLines) {
            ensureSpace(13);
            currentPage.push({
              type: 'text',
              font: 'F1', size: 9,
              r: 0.30, g: 0.35, b: 0.45,
              x: marginLeft + 20, y: currentY,
              text: el
            });
            currentY -= 12;
          }
        }
      }

      // Formules
      if (sec.formulas && sec.formulas.length > 0) {
        ensureSpace(20);
        currentY -= 4;
        currentPage.push({
          type: 'text',
          font: 'F2', size: 9,
          r: 0.85, g: 0.40, b: 0.05,
          x: marginLeft + 12, y: currentY,
          text: 'Formules :'
        });
        currentY -= 12;

        for (const f of sec.formulas) {
          const fLines = wrapText(`ƒ ${f}`, 9, usableWidth - 30);
          for (const fl of fLines) {
            ensureSpace(13);
            currentPage.push({
              type: 'text',
              font: 'F1', size: 9,
              r: 0.30, g: 0.35, b: 0.45,
              x: marginLeft + 20, y: currentY,
              text: fl
            });
            currentY -= 12;
          }
        }
      }

      currentY -= 12;
    }
  }

  // Ajouter la dernière page construite
  pages.push(currentPage);

  // --- Assemblage des objets PDF 1.4 ---
  const objects: string[] = [];
  const offsets: number[] = [];

  const addObject = (content: string): number => {
    const objNum = objects.length + 1;
    objects.push(`${objNum} 0 obj\n${content}\nendobj\n`);
    return objNum;
  };

  // 1. Catalogue
  addObject('<< /Type /Catalog /Pages 2 0 R >>');

  // 2. Emplacement réservé pour Pages
  const pagesObjIdx = objects.length;
  addObject('');

  // 3, 4, 5. Polices standard Helvetica (WinAnsiEncoding)
  const fontRegular = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const fontOblique = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

  const totalPages = pages.length;
  const pageObjNumbers: number[] = [];

  for (let p = 0; p < totalPages; p++) {
    const items = pages[p];
    let stream = '';

    // En-tête de continuation (pages 2+)
    if (p > 0) {
      stream += `0.31 0.27 0.90 rg\n${marginLeft} ${pageHeight - 32} ${usableWidth} 2 re\nf\n`;
      stream += `BT\n/F1 8 Tf\n0.39 0.45 0.55 rg\n1 0 0 1 ${marginLeft} ${pageHeight - 44} Tm\n`;
      stream += `(${escWinAnsi(`REVIZO — ${revision.title} (suite)`)}) Tj\nET\n`;
      stream += `0.85 0.88 0.92 RG\n0.5 w\n${marginLeft} ${pageHeight - 48} m ${pageWidth - marginRight} ${pageHeight - 48} l\nS\n`;
    }

    // Dessin vectoriel et textes de la page
    for (const item of items) {
      if (item.type === 'rect_fill') {
        stream += `${item.r.toFixed(2)} ${item.g.toFixed(2)} ${item.b.toFixed(2)} rg\n`;
        stream += `${item.x.toFixed(1)} ${item.y.toFixed(1)} ${item.w.toFixed(1)} ${item.h.toFixed(1)} re\nf\n`;
      } else if (item.type === 'line') {
        stream += `${item.r.toFixed(2)} ${item.g.toFixed(2)} ${item.b.toFixed(2)} RG\n`;
        stream += `${item.w.toFixed(2)} w\n`;
        stream += `${item.x1.toFixed(1)} ${item.y1.toFixed(1)} m ${item.x2.toFixed(1)} ${item.y2.toFixed(1)} l\nS\n`;
      } else if (item.type === 'text') {
        stream += `BT\n`;
        stream += `/${item.font} ${item.size} Tf\n`;
        stream += `${item.r.toFixed(2)} ${item.g.toFixed(2)} ${item.b.toFixed(2)} rg\n`;
        stream += `1 0 0 1 ${item.x.toFixed(1)} ${item.y.toFixed(1)} Tm\n`;
        stream += `(${escWinAnsi(item.text)}) Tj\n`;
        stream += `ET\n`;
      }
    }

    // Pied de page sur toutes les pages
    stream += `0.85 0.88 0.92 RG\n0.5 w\n${marginLeft} 38 m ${pageWidth - marginRight} 38 l\nS\n`;
    // Texte gauche
    stream += `BT\n/F1 8 Tf\n0.45 0.50 0.60 rg\n1 0 0 1 ${marginLeft} 26 Tm\n`;
    stream += `(${escWinAnsi("Généré par REVIZO — L'application de révision scolaire intelligente")}) Tj\nET\n`;
    // Pagination droite
    const pageText = `Page ${p + 1} sur ${totalPages}`;
    stream += `BT\n/F1 8 Tf\n0.45 0.50 0.60 rg\n1 0 0 1 ${pageWidth - marginRight - 65} 26 Tm\n`;
    stream += `(${escWinAnsi(pageText)}) Tj\nET\n`;

    // Flux de contenu de la page
    const streamObj = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);

    // Objet Page
    const pageObj = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Contents ${streamObj} 0 R ` +
      `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontOblique} 0 R >> >> >>`
    );
    pageObjNumbers.push(pageObj);
  }

  // Mise à jour de l'objet racine Pages
  const kidsStr = pageObjNumbers.map(n => `${n} 0 R`).join(' ');
  objects[pagesObjIdx] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj\n`;

  // Construction du fichier final
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 0; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  // Conversion en octets 8-bit stricts (compatible navigateur et node)
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export class RevisionService {
  constructor(private dataProvider: IDataProvider) {}

  async getRevisionForCourse(courseId: string): Promise<Revision | null> {
    return this.dataProvider.getRevisionByCourseId(courseId);
  }

  /**
   * Règle absolue N°3 & N°12 : Véritable téléchargement utilisateur sur l'appareil.
   * Génère un fichier PDF binaire valide (PDF 1.4) et déclenche le téléchargement natif
   * dans le système de fichiers de l'appareil (Desktop/Mobile).
   */
  async downloadRevisionPDF(revision: Revision): Promise<boolean> {
    try {
      const pdfBytes = buildRevisionPDF(revision);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Dans un environnement navigateur, déclencher le téléchargement du fichier
      if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        const link = document.createElement('a');
        const sanitizedTitle = revision.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.href = url;
        link.download = `REVIZO_${sanitizedTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Laisser le temps au gestionnaire de téléchargement de lire le blob
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }

      // Met à jour l'état de référence de téléchargement
      await this.dataProvider.markRevisionDownloaded(revision.id, true);
      return true;
    } catch (err) {
      console.error('Erreur lors du téléchargement utilisateur :', err);
      return false;
    }
  }
}
