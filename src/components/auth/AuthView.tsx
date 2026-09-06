import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SchoolLevel } from '../../types';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { signIn, signUp, completeAuth, checkIdentifier } = useAuth();

  // Mode principal : 'login' | 'signup' | 'onboarding'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'onboarding'>('login');
  const [createdUser, setCreatedUser] = useState<any>(null);

  // --- ÉTAT CONNEXION ---
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'identifier' | 'password'>('identifier');
  const [accountNotFound, setAccountNotFound] = useState(false);

  // --- ÉTAT INSCRIPTION ---
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const [signupIdentifier, setSignupIdentifier] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupGrade, setSignupGrade] = useState<SchoolLevel>('3e');

  // --- ÉTAT ONBOARDING ---
  const [createdUserName, setCreatedUserName] = useState('');
  const [selectedLearningGoal, setSelectedLearningGoal] = useState<'daily' | 'quiz' | 'exam'>('daily');

  // États génériques
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetErrors = () => {
    setErrorMessage(null);
    setAccountNotFound(false);
  };

  // --- ACTIONS CONNEXION ---

  // Étape 1 : Vérification de l'identifiant
  const handleCheckIdentifier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    resetErrors();

    const trimmed = loginIdentifier.trim();
    if (!trimmed) {
      setErrorMessage(
        loginMethod === 'email'
          ? 'Indique ton adresse email pour continuer.'
          : 'Indique ton numéro de téléphone pour continuer.'
      );
      return;
    }

    try {
      setIsLoading(true);
      const res = await checkIdentifier(trimmed);
      if (res.exists) {
        setLoginStep('password');
        setErrorMessage(null);
      } else {
        setAccountNotFound(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Vérifie ton adresse email ou ton numéro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2 : Soumission du mot de passe et connexion
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    resetErrors();

    if (!loginPassword.trim()) {
      setErrorMessage('Indique ton mot de passe.');
      return;
    }

    try {
      setIsLoading(true);
      await signIn({
        identifier: loginIdentifier.trim(),
        password: loginPassword.trim()
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  // Basculer vers l'inscription avec l'identifiant déjà saisi
  const handleSwitchToSignUpWithPrefill = () => {
    setSignupIdentifier(loginIdentifier);
    setSignupMethod(loginMethod);
    setAuthMode('signup');
    resetErrors();
  };

  // --- ACTIONS INSCRIPTION ---

  const handleSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    resetErrors();

    const trimmedId = signupIdentifier.trim();
    const trimmedPwd = signupPassword.trim();
    const trimmedName = signupDisplayName.trim();

    if (!trimmedId) {
      setErrorMessage(
        signupMethod === 'email'
          ? 'Indique ton adresse email.'
          : 'Indique ton numéro de téléphone.'
      );
      return;
    }

    if (!trimmedPwd || trimmedPwd.length < 6) {
      setErrorMessage('Ce mot de passe n’est pas valide (au moins 6 caractères).');
      return;
    }

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Indique ton prénom et ton nom.');
      return;
    }

    try {
      setIsLoading(true);
      const newUser = await signUp({
        identifier: trimmedId,
        identifierType: signupMethod,
        password: trimmedPwd,
        displayName: trimmedName,
        gradeLevel: signupGrade
      });

      setCreatedUser(newUser);
      setCreatedUserName(newUser.displayName);
      setAuthMode('onboarding');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de créer ton compte. Vérifie tes informations.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ONBOARDING ---

  const handleFinishOnboarding = () => {
    if (createdUser) {
      completeAuth(createdUser);
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
    { value: '6e', label: '6e' },
    { value: '5e', label: '5e' },
    { value: '4e', label: '4e' },
    { value: '3e', label: '3e (Brevet)' },
    { value: '2nde', label: '2nde' },
    { value: '1ere', label: '1ère (Bac)' },
    { value: 'Terminale', label: 'Terminale' },
    { value: 'Superieur', label: 'Supérieur' }
  ];

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* LOGO & EN-TÊTE DE MARQUE */}
        <div className="auth-brand-header">
          <div className="auth-logo">
            <span className="auth-logo-text">
              REVIZO<span className="brand-sparkle">✦</span>
            </span>
          </div>
          {authMode === 'login' && (
            <>
              <h1 className="auth-title">Heureux de te revoir !</h1>
              <p className="auth-subtitle">
                Révise plus vite et mémorise l’essentiel de tes cours.
              </p>
            </>
          )}
          {authMode === 'signup' && (
            <>
              <h1 className="auth-title">Créer mon compte</h1>
              <p className="auth-subtitle">
                Rejoins REVIZO pour transformer tes cours en fiches et quiz.
              </p>
            </>
          )}
          {authMode === 'onboarding' && (
            <>
              <div className="auth-welcome-badge">
                <Sparkles size={20} color="#F59E0B" />
              </div>
              <h1 className="auth-title">Bienvenue sur REVIZO 👋</h1>
              <p className="auth-subtitle">
                Ravi de t’accueillir {createdUserName || 'parmi nous'} ! Comment souhaites-tu apprendre ?
              </p>
            </>
          )}
        </div>

        {/* MESSAGE D'ERREUR BIENVEILLANT SANS JARGON TECHNIQUE */}
        {errorMessage && (
          <div className="auth-error-banner" id="auth-error-notice">
            <AlertCircle size={18} className="auth-error-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. VUE DE CONNEXION                                       */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <div className="auth-form-view">
            {loginStep === 'identifier' ? (
              <form onSubmit={handleCheckIdentifier}>
                {/* SÉLECTEUR DE MÉTHODE : EMAIL OU TÉLÉPHONE */}
                <div className="auth-method-tabs">
                  <button
                    type="button"
                    className={`auth-method-tab ${loginMethod === 'email' ? 'active' : ''}`}
                    onClick={() => {
                      setLoginMethod('email');
                      resetErrors();
                    }}
                    id="tab-login-email"
                  >
                    <Mail size={16} />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-method-tab ${loginMethod === 'phone' ? 'active' : ''}`}
                    onClick={() => {
                      setLoginMethod('phone');
                      resetErrors();
                    }}
                    id="tab-login-phone"
                  >
                    <Phone size={16} />
                    <span>Téléphone</span>
                  </button>
                </div>

                {/* CHAMP IDENTIFIANT */}
                <div className="auth-field-group">
                  <label htmlFor="login-identifier" className="auth-field-label">
                    {loginMethod === 'email' ? 'Adresse email scolaire' : 'Numéro de téléphone'}
                  </label>
                  <div className="auth-input-wrapper">
                    {loginMethod === 'email' ? (
                      <Mail size={18} className="auth-input-icon" />
                    ) : (
                      <Phone size={18} className="auth-input-icon" />
                    )}
                    <input
                      id="login-identifier"
                      type={loginMethod === 'email' ? 'email' : 'tel'}
                      value={loginIdentifier}
                      onChange={e => {
                        setLoginIdentifier(e.target.value);
                        resetErrors();
                      }}
                      placeholder={
                        loginMethod === 'email'
                          ? 'ex : nasser@revizo.app'
                          : 'ex : 06 12 34 56 78'
                      }
                      className="auth-input"
                      autoFocus
                    />
                  </div>
                  <span className="auth-field-hint">
                    {loginMethod === 'email'
                      ? 'Compte démo : nasser@revizo.app'
                      : 'Compte démo : 0612345678'}
                  </span>
                </div>

                {/* COMPTE INCONNU -> PROPOSITION ÉLÉGANTE DE CRÉATION */}
                {accountNotFound && (
                  <div className="auth-not-found-card" id="account-not-found-banner">
                    <p className="auth-not-found-text">
                      Aucun compte n’est associé à cet identifiant.
                    </p>
                    <button
                      type="button"
                      className="btn-create-from-unknown"
                      onClick={handleSwitchToSignUpWithPrefill}
                      id="btn-suggest-create-account"
                    >
                      <Sparkles size={16} />
                      <span>Créer mon compte avec cet identifiant</span>
                    </button>
                  </div>
                )}

                {/* BOUTON CONTINUER */}
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                  id="btn-auth-continue"
                >
                  {isLoading ? (
                    <span className="auth-btn-loading">Vérification...</span>
                  ) : (
                    <>
                      <span>Continuer</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ÉTAPE 2 : MOT DE PASSE DU COMPTE RECONNU */
              <form onSubmit={handleLoginSubmit}>
                <div className="auth-user-recap">
                  <div className="auth-user-recap-icon">
                    {loginMethod === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                  </div>
                  <span className="auth-user-recap-text">{loginIdentifier}</span>
                  <button
                    type="button"
                    className="auth-btn-change-id"
                    onClick={() => {
                      setLoginStep('identifier');
                      setLoginPassword('');
                      resetErrors();
                    }}
                    id="btn-change-identifier"
                  >
                    Modifier
                  </button>
                </div>

                <div className="auth-field-group">
                  <label htmlFor="login-password" className="auth-field-label">
                    Mot de passe
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => {
                        setLoginPassword(e.target.value);
                        resetErrors();
                      }}
                      placeholder="Entre ton mot de passe"
                      className="auth-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="auth-btn-toggle-pwd"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      title={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      id="btn-toggle-password-visibility"
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <span className="auth-field-hint">
                    Mot de passe démo : Password123!
                  </span>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                  id="btn-login-submit"
                >
                  {isLoading ? (
                    <span className="auth-btn-loading">Connexion en cours...</span>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* BASCULE VERS INSCRIPTION */}
            <div className="auth-switch-footer">
              <span>Pas encore de compte ?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setAuthMode('signup');
                  resetErrors();
                }}
                id="link-switch-to-signup"
              >
                Créer mon compte
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. VUE DE CRÉATION DE COMPTE (INSCRIPTION EN 4 ÉTAPES)   */}
        {/* ======================================================== */}
        {authMode === 'signup' && (
          <div className="auth-form-view">
            <form onSubmit={handleSignUpSubmit}>
              {/* SÉLECTEUR IDENTIFIANT */}
              <div className="auth-method-tabs">
                <button
                  type="button"
                  className={`auth-method-tab ${signupMethod === 'email' ? 'active' : ''}`}
                  onClick={() => {
                    setSignupMethod('email');
                    resetErrors();
                  }}
                  id="tab-signup-email"
                >
                  <Mail size={16} />
                  <span>Avec un email</span>
                </button>
                <button
                  type="button"
                  className={`auth-method-tab ${signupMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => {
                    setSignupMethod('phone');
                    resetErrors();
                  }}
                  id="tab-signup-phone"
                >
                  <Phone size={16} />
                  <span>Avec un téléphone</span>
                </button>
              </div>

              {/* ÉTAPE 1 : IDENTIFIANT */}
              <div className="auth-field-group">
                <label htmlFor="signup-identifier" className="auth-field-label">
                  1. {signupMethod === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
                </label>
                <div className="auth-input-wrapper">
                  {signupMethod === 'email' ? (
                    <Mail size={18} className="auth-input-icon" />
                  ) : (
                    <Phone size={18} className="auth-input-icon" />
                  )}
                  <input
                    id="signup-identifier"
                    type={signupMethod === 'email' ? 'email' : 'tel'}
                    value={signupIdentifier}
                    onChange={e => {
                      setSignupIdentifier(e.target.value);
                      resetErrors();
                    }}
                    placeholder={
                      signupMethod === 'email' ? 'ex : lea.martin@college.fr' : 'ex : 06 12 34 56 78'
                    }
                    className="auth-input"
                  />
                </div>
              </div>

              {/* ÉTAPE 2 : MOT DE PASSE */}
              <div className="auth-field-group">
                <label htmlFor="signup-password" className="auth-field-label">
                  2. Mot de passe secret
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={e => {
                      setSignupPassword(e.target.value);
                      resetErrors();
                    }}
                    placeholder="Au moins 6 caractères"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-btn-toggle-pwd"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    title={showSignupPassword ? 'Masquer' : 'Afficher'}
                    id="btn-toggle-signup-pwd"
                  >
                    {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* ÉTAPE 3 : PRÉNOM ET NOM */}
              <div className="auth-field-group">
                <label htmlFor="signup-name" className="auth-field-label">
                  3. Prénom et nom
                </label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    value={signupDisplayName}
                    onChange={e => {
                      setSignupDisplayName(e.target.value);
                      resetErrors();
                    }}
                    placeholder="ex : Léa Martin"
                    className="auth-input"
                  />
                </div>
              </div>

              {/* ÉTAPE 4 : CLASSE SCOLAIRE */}
              <div className="auth-field-group">
                <label className="auth-field-label">
                  4. Ta classe scolaire actuelle
                </label>
                <div className="auth-grade-grid" id="signup-grade-grid">
                  {SCHOOL_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      type="button"
                      className={`auth-grade-pill ${signupGrade === lvl.value ? 'selected' : ''}`}
                      onClick={() => setSignupGrade(lvl.value)}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOUTON CRÉATION DE COMPTE */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
                id="btn-signup-submit"
              >
                {isLoading ? (
                  <span className="auth-btn-loading">Création de ton compte...</span>
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <Sparkles size={18} />
                  </>
                )}
              </button>
            </form>

            {/* BASCULE VERS CONNEXION */}
            <div className="auth-switch-footer">
              <span>Déjà un compte élève ?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setAuthMode('login');
                  resetErrors();
                }}
                id="link-switch-to-login"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. VUE D'ONBOARDING COURT                                */}
        {/* ======================================================== */}
        {authMode === 'onboarding' && (
          <div className="auth-onboarding-view">
            <div className="auth-onboarding-goals">
              <button
                type="button"
                className={`onboarding-goal-card ${selectedLearningGoal === 'daily' ? 'selected' : ''}`}
                onClick={() => setSelectedLearningGoal('daily')}
              >
                <div className="goal-icon-box orange">
                  <Target size={22} />
                </div>
                <div className="goal-info">
                  <h4 className="goal-title">15 minutes par jour</h4>
                  <p className="goal-desc">
                    Consolide régulièrement tes cours pour ne jamais accumuler de retard.
                  </p>
                </div>
                <div className="goal-check">
                  {selectedLearningGoal === 'daily' && <CheckCircle2 size={20} color="#EA580C" />}
                </div>
              </button>

              <button
                type="button"
                className={`onboarding-goal-card ${selectedLearningGoal === 'quiz' ? 'selected' : ''}`}
                onClick={() => setSelectedLearningGoal('quiz')}
              >
                <div className="goal-icon-box yellow">
                  <Zap size={22} />
                </div>
                <div className="goal-info">
                  <h4 className="goal-title">Mémorisation par quiz</h4>
                  <p className="goal-desc">
                    Teste tes connaissances avec feedback immédiat et analyse d’erreurs.
                  </p>
                </div>
                <div className="goal-check">
                  {selectedLearningGoal === 'quiz' && <CheckCircle2 size={20} color="#EA580C" />}
                </div>
              </button>
            </div>

            <button
              type="button"
              className="auth-submit-btn"
              onClick={handleFinishOnboarding}
              id="btn-onboarding-finish"
            >
              <span>Commencer à réviser</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* MENTION DE SÉCURITÉ DISCRÈTE */}
      <div className="auth-footer-privacy">
        <ShieldCheck size={14} />
        <span>REVIZO protège tes données scolaires • Zéro revente • Environnement certifié</span>
      </div>
    </div>
  );
};
