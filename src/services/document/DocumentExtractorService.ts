import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ExtractedDocument {
  name: string;
  mimeType: string;
  size: number;
  text: string;
  titleCandidate: string;
  pagesCount: number;
  headings: string[];
  paragraphs: string[];
}

export class DocumentExtractorService {
  /**
   * Extraction du texte et de la structure du document (PDF ou Image)
   */
  async extract(file: File): Promise<ExtractedDocument> {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return this.extractFromPdf(file);
    } else if (file.type.startsWith('image/')) {
      return this.extractFromImage(file);
    } else {
      // Fallback texte brut
      const text = await file.text();
      return this.formatExtractedText(file.name, file.type, file.size, text, 1);
    }
  }

  /**
   * Extraction réelle depuis un document PDF via PDF.js
   */
  private async extractFromPdf(file: File): Promise<ExtractedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      let fullText = '';
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Assemblage propre des items de texte par ligne
        const pageLines: string[] = [];
        let currentLine = '';
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          const str = item.str || '';
          const y = item.transform ? item.transform[5] : null;

          if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim());
            }
            currentLine = str;
          } else {
            currentLine += (currentLine ? ' ' : '') + str;
          }
          lastY = y;
        }

        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }

        fullText += pageLines.join('\n') + '\n\n';
      }

      if (!fullText.trim()) {
        // En cas de PDF scan sans texte sélectionnable
        fullText = `Cours extrait du document : ${file.name}\nLe document contient ${numPages} page(s).`;
      }

      return this.formatExtractedText(file.name, file.type, file.size, fullText, numPages);
    } catch (err) {
      console.warn('Erreur lors du décodage PDF.js, utilisation du fallback texte :', err);
      // Fallback : extraction de flux textuels ASCII bruts
      const text = await this.fallbackExtractPdfText(file);
      return this.formatExtractedText(file.name, file.type, file.size, text, 1);
    }
  }

  /**
   * Extraction depuis une photo ou capture
   * (Pour cette phase locale, prépare le pipeline et extrait les métadonnées)
   */
  private async extractFromImage(file: File): Promise<ExtractedDocument> {
    // Pipeline OCR local / abstraction pour Gemini Vision
    const text = `Document photographié : ${file.name} (${Math.round(file.size / 1024)} Ko).\nCe cours issu de la prise de vue sera analysé par le modèle multimodal.`;
    return this.formatExtractedText(file.name, file.type, file.size, text, 1);
  }

  /**
   * Analyse et structuration des paragraphes et titres extraits
   */
  private formatExtractedText(
    name: string,
    mimeType: string,
    size: number,
    rawText: string,
    pagesCount: number
  ): ExtractedDocument {
    const rawLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const headings: string[] = [];
    const paragraphs: string[] = [];
    let titleCandidate = '';

    // Détection du titre principal (première ligne significative)
    for (const line of rawLines) {
      if (!titleCandidate && line.length > 4 && line.length < 90 && !line.startsWith('Page')) {
        titleCandidate = line;
      }
      // Détection des titres de sections (ex: "I.", "1.", "Chapitre", "Notion", "Théorème")
      if (
        /^(?:[0-9IVX]+\.|\bChapitre\b|\bPartie\b|\bThéorème\b|\bDéfinition\b|[A-ZÀ-Ÿ\s]{4,})/i.test(line) &&
        line.length < 80
      ) {
        headings.push(line);
      } else if (line.length > 25) {
        paragraphs.push(line);
      }
    }

    if (!titleCandidate) {
      titleCandidate = name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    }

    return {
      name,
      mimeType,
      size,
      text: rawText,
      titleCandidate,
      pagesCount,
      headings,
      paragraphs
    };
  }

  /**
   * Fallback de secours par extraction de chaînes texte dans le binaire
   */
  private async fallbackExtractPdfText(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let text = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
          text += String.fromCharCode(b);
        }
      }
      const matches = text.match(/\(([^()]{3,})\)Tj/g);
      if (matches && matches.length > 0) {
        return matches.map(m => m.slice(1, -3)).join(' ');
      }
      return `Cours extrait : ${file.name}`;
    } catch {
      return `Cours extrait : ${file.name}`;
    }
  }
}
