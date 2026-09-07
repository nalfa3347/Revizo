import React, { useEffect } from 'react';
import { X, Phone, Mail, MessageCircle, ShieldCheck, FileText, Lock, ExternalLink } from 'lucide-react';
import { RevizoLogo } from '../common/RevizoLogo';

export type LegalModalType = 'mentions' | 'cgu' | 'confidentialite' | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
  onSelectTab: (type: LegalModalType) => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  activeModal,
  onClose,
  onSelectTab
}) => {
  // Fermer la modal avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div
        className="legal-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* EN-TÊTE MODAL */}
        <div className="legal-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RevizoLogo size={32} />
            <div>
              <h3 className="legal-modal-title">
                {activeModal === 'mentions' && 'Mentions Légales'}
                {activeModal === 'cgu' && "Conditions Générales d'Utilisation"}
                {activeModal === 'confidentialite' && 'Politique de Confidentialité'}
              </h3>
              <p className="legal-modal-subtitle">Application REVIZO — Révisions & Quiz par IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="legal-modal-close-btn"
            aria-label="Fermer"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="legal-modal-tabs">
          <button
            type="button"
            className={`legal-modal-tab ${activeModal === 'mentions' ? 'is-active' : ''}`}
            onClick={() => onSelectTab('mentions')}
          >
            <FileText size={15} />
            <span>Mentions légales</span>
          </button>
          <button
            type="button"
            className={`legal-modal-tab ${activeModal === 'cgu' ? 'is-active' : ''}`}
            onClick={() => onSelectTab('cgu')}
          >
            <ShieldCheck size={15} />
            <span>Conditions d'utilisation</span>
          </button>
          <button
            type="button"
            className={`legal-modal-tab ${activeModal === 'confidentialite' ? 'is-active' : ''}`}
            onClick={() => onSelectTab('confidentialite')}
          >
            <Lock size={15} />
            <span>Confidentialité & Données</span>
          </button>
        </div>

        {/* CONTENU MODAL */}
        <div className="legal-modal-body">
          {/* BANDEAU CONTACT DIRECT */}
          <div className="legal-contact-card">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#111827', fontWeight: 700 }}>
              Contacts directs du créateur du projet :
            </h4>
            <div className="legal-contact-links">
              <a
                href="https://wa.me/22892880010"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-contact-pill whatsapp"
              >
                <MessageCircle size={16} />
                <span>WhatsApp : +228 92 88 00 10</span>
              </a>
              <a
                href="tel:+22892880010"
                className="legal-contact-pill phone"
              >
                <Phone size={16} />
                <span>Tél : +228 92 88 00 10</span>
              </a>
              <a
                href="mailto:nasserpillar4@gmail.com"
                className="legal-contact-pill email"
              >
                <Mail size={16} />
                <span>nasserpillar4@gmail.com</span>
              </a>
            </div>
          </div>

          {/* ONGLET 1 : MENTIONS LÉGALES */}
          {activeModal === 'mentions' && (
            <div className="legal-section-content">
              <h4>1. Édition du site et de l'application</h4>
              <p>
                L'application <strong>REVIZO</strong> (accessible via l'adresse web et installable en application mobile)
                est un projet indépendant conçu et développé par :
              </p>
              <ul>
                <li><strong>Responsable & Créateur :</strong> Nasser (Développeur indépendant)</li>
                <li><strong>Statut :</strong> Développeur particulier / Projet indépendant</li>
                <li><strong>Téléphone / WhatsApp :</strong> +228 92 88 00 10</li>
                <li><strong>Email direct :</strong> nasserpillar4@gmail.com</li>
                <li><strong>Pays de résidence :</strong> Togo</li>
              </ul>
              <p>
                Conformément à la volonté de son créateur, le projet est édité à titre individuel dans une démarche
                d'innovation pédagogique au service des élèves et étudiants.
              </p>

              <h4>2. Hébergement de l'application</h4>
              <p>L'infrastructure technique de REVIZO est hébergée par des prestataires de classe mondiale :</p>
              <ul>
                <li>
                  <strong>Hébergement Frontend & CDN :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
                  Site web : <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com <ExternalLink size={12} /></a>
                </li>
                <li>
                  <strong>Base de données & Authentification :</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapour.
                  Site web : <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com <ExternalLink size={12} /></a>
                </li>
              </ul>

              <h4>3. Propriété intellectuelle</h4>
              <p>
                Le nom REVIZO, le logo à dégradé orange officiel, l'interface graphique et les algorithmes d'orchestration pédagogique
                sont la création exclusive de leur auteur. Tous les cours et documents téléversés par l'élève restent l'entière
                propriété de l'élève ou de leurs auteurs respectifs.
              </p>
            </div>
          )}

          {/* ONGLET 2 : CONDITIONS D'UTILISATION */}
          {activeModal === 'cgu' && (
            <div className="legal-section-content">
              <h4>1. Présentation et objet du service</h4>
              <p>
                REVIZO est une plateforme numérique d'assistance scolaire permettant aux élèves et étudiants de transformer
                leurs cours (fichiers PDF, photographies de cahiers ou textes) en fiches de révision structurées, synthétiques et en quiz d'évaluation interactifs.
              </p>

              <h4>2. Accès et création de compte</h4>
              <p>
                L'accès à la création de quiz et fiches nécessite la création d'un compte personnel. L'utilisateur s'engage à fournir
                des informations véridiques et à préserver la confidentialité de son mot de passe.
              </p>

              <h4>3. Utilisation loyale et contenu importé</h4>
              <p>
                L'utilisateur s'engage à importer des cours et supports d'apprentissage dans un cadre strictement pédagogique et personnel.
                Il est formellement interdit d'utiliser la plateforme pour diffuser du contenu illicite, diffamatoire ou contraire aux lois en vigueur.
              </p>

              <h4>4. Disponibilité du service</h4>
              <p>
                Le service s'efforce d'assurer une disponibilité 24h/24 et 7j/7. Des interruptions pour maintenance ou mise à jour technique
                peuvent intervenir afin d'améliorer la qualité des algorithmes de révision.
              </p>

              <h4>5. Contact et assistance</h4>
              <p>
                Pour toute question relative à l'utilisation de l'application ou pour signaler un dysfonctionnement, vous pouvez
                directement contacter l'administrateur par téléphone ou WhatsApp au <strong>+228 92 88 00 10</strong> ou par email à <strong>nasserpillar4@gmail.com</strong>.
              </p>
            </div>
          )}

          {/* ONGLET 3 : CONFIDENTIALITÉ */}
          {activeModal === 'confidentialite' && (
            <div className="legal-section-content">
              <h4>1. Respect strict de votre vie privée</h4>
              <p>
                La confidentialité de vos documents et de votre progression scolaire est primordiale.
                REVIZO applique les règles de protection des données les plus strictes :
              </p>
              <ul>
                <li><strong>Aucune revente de données :</strong> Vos informations et documents ne sont jamais vendus, loués ou partagés avec des sociétés publicitaires.</li>
                <li><strong>Isolation des cours :</strong> Vos fiches et quiz sont protégés par le mécanisme <em>Row Level Security (RLS)</em> garantissant que vous seul avez accès à vos propres cours.</li>
                <li><strong>Chiffrement :</strong> Toutes les communications entre votre téléphone et nos serveurs sont protégées par chiffrement HTTPS / SSL.</li>
              </ul>

              <h4>2. Données collectées</h4>
              <p>
                Les seules données collectées sont celles strictement nécessaires au fonctionnement de vos révisions : votre adresse email,
                vos documents de cours importés et vos résultats de quiz pour mesurer vos progrès.
              </p>

              <h4>3. Droit de suppression</h4>
              <p>
                Vous pouvez à tout moment demander la suppression complète et définitive de votre compte et de l'ensemble de vos documents
                en envoyant un simple message à <strong>nasserpillar4@gmail.com</strong> ou au <strong>+228 92 88 00 10</strong>.
              </p>
            </div>
          )}
        </div>

        {/* PIED DE PAGE MODAL */}
        <div className="legal-modal-footer">
          <span style={{ fontSize: '0.85rem', color: 'var(--landing-text-muted)' }}>
            REVIZO • Contact direct : +228 92 88 00 10
          </span>
          <button
            type="button"
            className="landing-hero-btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.9rem' }}
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
