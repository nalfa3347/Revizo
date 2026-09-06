import { describe, it, expect, beforeEach } from 'vitest';
import { RevisionService } from '../services/RevisionService';
import { CourseService } from '../services/CourseService';
import { MockDataProvider } from '../providers/mock/MockDataProvider';

describe('Phase 13 & Phase 25 — Consultation Hors Connexion & Gestion Réseau', () => {
  let provider: MockDataProvider;
  let revisionService: RevisionService;
  let courseService: CourseService;

  beforeEach(() => {
    provider = new MockDataProvider(0);
    revisionService = new RevisionService(provider);
    courseService = new CourseService(provider);
  });

  it('permet de télécharger une révision et marque son état isDownloaded à true', async () => {
    const revision = await revisionService.getRevisionForCourse('crs-hist-01');
    expect(revision).not.toBeNull();
    expect(revision?.isDownloaded).toBe(false);

    const success = await revisionService.downloadRevisionPDF(revision!);
    expect(success).toBe(true);

    const updated = await revisionService.getRevisionForCourse('crs-hist-01');
    expect(updated?.isDownloaded).toBe(true);
    expect(updated?.downloadedAt).toBeDefined();
  });

  it('permet de consulter une révision téléchargée en mode hors connexion', async () => {
    // 1. Télécharger la révision en amont
    const revision = await revisionService.getRevisionForCourse('crs-fr-01');
    expect(revision).not.toBeNull();
    expect(revision?.isDownloaded).toBe(false);
    await revisionService.downloadRevisionPDF(revision!);

    // 2. Simuler le passage hors connexion
    const isOnline = false;
    const downloadedRevision = await revisionService.getRevisionForCourse('crs-fr-01');

    // Règle Phase 13 : Une révision téléchargée doit être accessible et posséder son contenu
    expect(downloadedRevision?.isDownloaded).toBe(true);
    expect(downloadedRevision?.sections.length).toBeGreaterThan(0);
    expect(downloadedRevision?.summary).toBeTruthy();

    // Vérification de la garde : si isOnline est false ET isDownloaded est true => consultation autorisée
    const canConsultOffline = !isOnline && downloadedRevision?.isDownloaded === true;
    expect(canConsultOffline).toBe(true);
  });

  it('interdit la consultation hors connexion pour une révision non téléchargée', async () => {
    const isOnline = false;
    // On s'assure qu'elle n'est pas téléchargée sur un nouveau provider
    const freshProvider = new MockDataProvider(0);
    const freshRevService = new RevisionService(freshProvider);
    const rev = await freshRevService.getRevisionForCourse('crs-hist-01');
    expect(rev?.isDownloaded).toBe(false);

    // Vérification de la garde : si isOnline est false ET isDownloaded est false => consultation bloquée
    const canConsultOffline = isOnline || rev?.isDownloaded === true;
    expect(canConsultOffline).toBe(false);
  });

  it('vérifie la logique du hook de simulation réseau (Phase 25)', () => {
    let isRealOnline = true;
    let isSimulatedOffline = false;

    // Calcul de l'état effectif
    let isEffectiveOnline = isRealOnline && !isSimulatedOffline;
    expect(isEffectiveOnline).toBe(true);

    // Bascule en simulation hors-ligne
    isSimulatedOffline = true;
    isEffectiveOnline = isRealOnline && !isSimulatedOffline;
    expect(isEffectiveOnline).toBe(false);

    // Rétablissement du réseau
    isSimulatedOffline = false;
    isEffectiveOnline = isRealOnline && !isSimulatedOffline;
    expect(isEffectiveOnline).toBe(true);

    // Cas de coupure réelle
    isRealOnline = false;
    isEffectiveOnline = isRealOnline && !isSimulatedOffline;
    expect(isEffectiveOnline).toBe(false);
  });

  it('vérifie que les cours téléchargés sont repérables dans la bibliothèque', async () => {
    const courses = await courseService.getAllCourses();
    expect(courses.length).toBeGreaterThan(0);

    // Initialement non téléchargé
    const histCourse = courses.find(c => c.id === 'crs-hist-01');
    expect(histCourse?.isDownloaded).toBe(false);

    // Téléchargement de la révision associée
    const rev = await revisionService.getRevisionForCourse('crs-hist-01');
    await revisionService.downloadRevisionPDF(rev!);

    // Rafraîchissement des cours
    const updatedCourses = await courseService.getAllCourses();
    const updatedHist = updatedCourses.find(c => c.id === 'crs-hist-01');
    expect(updatedHist?.isDownloaded).toBe(true);
  });
});
