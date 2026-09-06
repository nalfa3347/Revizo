import { IDataProvider } from '../contracts/IDataProvider';
import { Revision } from '../types';

/**
 * Utilitaire interne : génère un vrai fichier PDF 1.4 binaire
 * sans aucune dépendance externe.
 * 
 * Principe : construction manuelle des objets PDF (Catalog, Pages, Page, Font, Content Stream),
 * encodage du texte dans un flux de contenu, et écriture de la table xref.
 */
function buildRevisionPDF(revision: Revision): Uint8Array {
  const lines: string[] = [];
  const pageWidth = 595; // A4 en points (72 dpi)
  const pageHeight = 842;
  const marginLeft = 50;
  const marginRight = 50;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const lineHeight = 16;
  const titleLineHeight = 22;

  // Échappement des caractères spéciaux PDF
  const esc = (text: string): string =>
    text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // Découpage de texte en lignes selon une largeur maximale (approximation: 6pt par char en Helvetica 11pt)
  const wrapText = (text: string, fontSize: number): string[] => {
    const charWidth = fontSize * 0.52;
    const maxChars = Math.floor(usableWidth / charWidth);
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
  };

  // Collecte de tout le contenu textuel structuré
  // Titre principal
  lines.push(`__TITLE__REVIZO — Fiche de Révision`);
  lines.push(`__SUBTITLE__${revision.title}`);
  lines.push(`__NORMAL__Cours : ${revision.courseTitle}`);
  lines.push(`__NORMAL__Date d'exportation : ${new Date().toLocaleDateString('fr-FR')}`);
  lines.push('__SPACER__');

  // Résumé
  lines.push('__HEADING__Résumé Essentiel');
  const summaryLines = wrapText(revision.summary, 11);
  for (const l of summaryLines) lines.push(`__NORMAL__${l}`);
  lines.push('__SPACER__');

  // Points clés
  if (revision.keyConcepts.length > 0) {
    lines.push('__HEADING__Points Clés à Retenir');
    for (const c of revision.keyConcepts) {
      const wrapped = wrapText(`• ${c}`, 11);
      for (const l of wrapped) lines.push(`__NORMAL__${l}`);
    }
    lines.push('__SPACER__');
  }

  // Règles et formules
  if (revision.rulesFormulas.length > 0) {
    lines.push('__HEADING__Règles et Formules');
    for (const r of revision.rulesFormulas) {
      const wrapped = wrapText(`▸ ${r}`, 11);
      for (const l of wrapped) lines.push(`__NORMAL__${l}`);
    }
    lines.push('__SPACER__');
  }

  // Sections détaillées
  for (const sec of revision.sections) {
    lines.push(`__HEADING__${sec.title}`);
    const contentLines = wrapText(sec.content, 11);
    for (const l of contentLines) lines.push(`__NORMAL__${l}`);

    if (sec.keyTakeaways.length > 0) {
      lines.push('__SMALL_HEADING__À retenir :');
      for (const k of sec.keyTakeaways) {
        const wrapped = wrapText(`  – ${k}`, 10);
        for (const l of wrapped) lines.push(`__NORMAL__${l}`);
      }
    }

    if (sec.examples && sec.examples.length > 0) {
      lines.push('__SMALL_HEADING__Exemples :');
      for (const ex of sec.examples) {
        const wrapped = wrapText(`  ★ ${ex}`, 10);
        for (const l of wrapped) lines.push(`__NORMAL__${l}`);
      }
    }

    if (sec.formulas && sec.formulas.length > 0) {
      lines.push('__SMALL_HEADING__Formules :');
      for (const f of sec.formulas) {
        const wrapped = wrapText(`  ƒ ${f}`, 10);
        for (const l of wrapped) lines.push(`__NORMAL__${l}`);
      }
    }

    lines.push('__SPACER__');
  }

  // Pied de page
  lines.push('__FOOTER__Généré par REVIZO — L\'application de révision scolaire intelligente');

  // --- Construction des pages PDF ---
  // Répartir les lignes en pages
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentY = pageHeight - 60; // marge haute

  for (const line of lines) {
    let neededHeight = lineHeight;
    if (line.startsWith('__TITLE__')) neededHeight = titleLineHeight + 6;
    else if (line.startsWith('__SUBTITLE__')) neededHeight = titleLineHeight;
    else if (line.startsWith('__HEADING__')) neededHeight = lineHeight + 8;
    else if (line.startsWith('__SMALL_HEADING__')) neededHeight = lineHeight + 4;
    else if (line.startsWith('__SPACER__')) neededHeight = 12;
    else if (line.startsWith('__FOOTER__')) neededHeight = lineHeight + 20;

    if (currentY - neededHeight < 60) {
      // Nouvelle page
      pages.push(currentPage);
      currentPage = [];
      currentY = pageHeight - 60;
    }

    currentPage.push(line);
    currentY -= neededHeight;
  }
  if (currentPage.length > 0) pages.push(currentPage);

  // --- Encodage PDF ---
  const objects: string[] = [];
  const offsets: number[] = [];

  // Helper pour construire un objet PDF
  const addObject = (content: string): number => {
    const objNum = objects.length + 1;
    objects.push(`${objNum} 0 obj\n${content}\nendobj\n`);
    return objNum;
  };

  // Objet 1 : Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>');

  // Objet 2 : Pages (placeholder, sera réécrit)
  const pagesObjIdx = objects.length;
  addObject(''); // placeholder

  // Objet 3 : Font Helvetica
  const fontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

  // Objet 4 : Font Helvetica Bold
  const fontBoldObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  // Générer les objets pour chaque page
  const pageObjNumbers: number[] = [];
  for (let p = 0; p < pages.length; p++) {
    const pageLines = pages[p];

    // Construire le flux de texte
    let stream = 'BT\n';
    let y = pageHeight - 60;

    for (const line of pageLines) {
      if (line.startsWith('__TITLE__')) {
        const text = line.replace('__TITLE__', '');
        stream += `/F2 16 Tf\n${marginLeft} ${y} Td\n(${esc(text)}) Tj\n`;
        y -= titleLineHeight + 6;
      } else if (line.startsWith('__SUBTITLE__')) {
        const text = line.replace('__SUBTITLE__', '');
        stream += `/F2 13 Tf\n${marginLeft} ${y} Td\n(${esc(text)}) Tj\n`;
        y -= titleLineHeight;
      } else if (line.startsWith('__HEADING__')) {
        const text = line.replace('__HEADING__', '');
        y -= 4;
        stream += `/F2 12 Tf\n${marginLeft} ${y} Td\n(${esc(text)}) Tj\n`;
        y -= lineHeight + 4;
      } else if (line.startsWith('__SMALL_HEADING__')) {
        const text = line.replace('__SMALL_HEADING__', '');
        y -= 2;
        stream += `/F2 10 Tf\n${marginLeft} ${y} Td\n(${esc(text)}) Tj\n`;
        y -= lineHeight + 2;
      } else if (line.startsWith('__SPACER__')) {
        y -= 12;
      } else if (line.startsWith('__FOOTER__')) {
        const text = line.replace('__FOOTER__', '');
        y -= 10;
        stream += `/F1 8 Tf\n${marginLeft} ${y} Td\n(${esc(text)}) Tj\n`;
        y -= lineHeight + 10;
      } else if (line.startsWith('__NORMAL__')) {
        const text = line.replace('__NORMAL__', '');
        stream += `/F1 11 Tf\n${marginLeft} ${y} Td\n(${esc(text)}) Tj\n`;
        y -= lineHeight;
      }
    }

    // Numéro de page
    const pageNumText = `Page ${p + 1} / ${pages.length}`;
    stream += `/F1 8 Tf\n${pageWidth - marginRight - 60} 30 Td\n(${esc(pageNumText)}) Tj\n`;

    stream += 'ET\n';

    // Content stream object
    const streamObj = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);

    // Page object
    const pageObj = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Contents ${streamObj} 0 R ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R /F2 ${fontBoldObj} 0 R >> >> >>`
    );
    pageObjNumbers.push(pageObj);
  }

  // Réécrire l'objet Pages avec les enfants réels
  const kidsStr = pageObjNumbers.map(n => `${n} 0 R`).join(' ');
  objects[pagesObjIdx] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>\nendobj\n`;

  // Assemblage final du PDF
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';

  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }

  // Table xref
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 0; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  // Conversion en Uint8Array pour un vrai binaire
  const encoder = new TextEncoder();
  return encoder.encode(pdf);
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
        URL.revokeObjectURL(url);
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

