import React, { useState, useEffect, useRef } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { LandingPage } from './components/landing/LandingPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell, TabKey } from './components/layout/AppShell';
import { HomeView } from './components/home/HomeView';
import { RevisionView } from './components/revision/RevisionView';
import { CoursesView } from './components/courses/CoursesView';
import { QuizView } from './components/quiz/QuizView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { SearchView } from './components/search/SearchView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { DiamondsView } from './components/economy/DiamondsView';
import { SubscriptionView } from './components/economy/SubscriptionView';
import { ReferralView } from './components/economy/ReferralView';
import { Course, SearchResultItem, AppNotification } from './types';

interface MainAppContentProps {
  onLogout: () => Promise<void>;
}

const MainAppContent: React.FC<MainAppContentProps> = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [previousTab, setPreviousTab] = useState<TabKey>('home');
  const [isReadingRevision, setIsReadingRevision] = useState(false);
  const [quizSelectedCourse, setQuizSelectedCourse] = useState<Course | null>(null);
  const backHandlerRef = useRef<(() => void) | null>(null);
  const {
    courseService
  } = useData();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    courseService.getAllCourses().then(data => {
      setCourses(data);
    });
  }, [courseService]);

  // Chargement révision
  const handleOpenRevision = (course: Course) => {
    setSelectedCourse(course);
    setCurrentTab('revisions');
  };

  // Lancement du Quiz interactif
  const handleStartQuiz = (course: Course) => {
    setQuizSelectedCourse(course);
    setCurrentTab('quizzes');
  };

  const handleNavigate = (tab: TabKey) => {
    if (isReadingRevision) {
      setIsReadingRevision(false);
    }
    setSelectedCourse(null);
    setQuizSelectedCourse(null);
    const overlayTabs: TabKey[] = ['profile', 'search', 'notifications', 'settings', 'diamonds', 'subscription', 'referral'];
    if (overlayTabs.includes(tab) && !overlayTabs.includes(currentTab)) {
      setPreviousTab(currentTab);
    }
    setCurrentTab(tab);
  };

  const handleSelectSearchResult = async (item: SearchResultItem) => {
    let targetCourse = courses.find(c => c.id === item.courseId);
    if (!targetCourse) {
      targetCourse = (await courseService.getCourse(item.courseId)) || undefined;
    }

    if (targetCourse) {
      if (item.type === 'quiz') {
        handleStartQuiz(targetCourse);
      } else {
        handleOpenRevision(targetCourse);
      }
    } else {
      setCurrentTab(item.targetTab);
    }
  };

  const handleNotificationNavigation = async (notif: AppNotification) => {
    if (!notif.targetTab) return;

    if (notif.targetTab === 'profile') {
      setCurrentTab('profile');
      return;
    }

    if (notif.targetTab === 'courses') {
      setCurrentTab('courses');
      return;
    }

    if (notif.targetId) {
      let targetCourse = courses.find(c => c.id === notif.targetId);
      if (!targetCourse) {
        targetCourse = (await courseService.getCourse(notif.targetId)) || undefined;
      }

      if (targetCourse) {
        if (notif.targetTab === 'quizzes') {
          handleStartQuiz(targetCourse);
          return;
        }
        if (notif.targetTab === 'revisions') {
          handleOpenRevision(targetCourse);
          return;
        }
      }
    }

    setCurrentTab(notif.targetTab);
  };

  return (
    <AppShell
      currentTab={currentTab}
      onNavigate={handleNavigate}
      isReadingRevision={isReadingRevision}
      onBackFromReading={() => {
        if (backHandlerRef.current) {
          backHandlerRef.current();
        }
        setIsReadingRevision(false);
        setSelectedCourse(null);
        setQuizSelectedCourse(null);
      }}
      onBackFromProfile={() => {
        setCurrentTab(previousTab || 'home');
      }}
      onBackFromSettings={() => {
        setCurrentTab('profile');
      }}
      onBackFromSearch={() => {
        setCurrentTab(previousTab || 'home');
      }}
      onBackFromNotifications={() => {
        setCurrentTab(previousTab || 'home');
      }}
      onBackFromDiamonds={() => {
        setCurrentTab(previousTab || 'home');
      }}
      onBackFromSubscription={() => {
        setCurrentTab(previousTab || 'home');
      }}
      onBackFromReferral={() => {
        setCurrentTab(previousTab || 'home');
      }}
    >
      {/* 1. ACCUEIL — FIDÈLE AUX RÉFÉRENCES VISUELLES (Desktop & Mobile) */}
      {currentTab === 'home' && (
        <HomeView
          onNavigateToCourses={() => setCurrentTab('courses')}
          onStartRevision={() => {
            if (courses.length > 0) {
              handleOpenRevision(courses[0]);
            } else {
              setCurrentTab('revisions');
            }
          }}
        />
      )}

      {/* 2. RÉVISION — CONFORME À LA MAQUETTE VISUELLE OFFICIELLE */}
      {currentTab === 'revisions' && (
        <RevisionView
          onNavigateToCourses={() => {
            setSelectedCourse(null);
            setCurrentTab('courses');
          }}
          onStartQuiz={handleStartQuiz}
          onNavigateToSubscription={() => setCurrentTab('subscription')}
          onReadingChange={isReading => {
            setIsReadingRevision(isReading);
            if (!isReading) {
              setSelectedCourse(null);
            }
          }}
          registerBackHandler={fn => {
            backHandlerRef.current = fn;
          }}
          initialCourse={selectedCourse}
        />
      )}

      {/* 3. MES COURS */}
      {currentTab === 'courses' && (
        <CoursesView
          onAddCourse={() => {
            setSelectedCourse(null);
            setCurrentTab('revisions');
          }}
          onOpenCourse={course => {
            handleOpenRevision(course);
          }}
        />
      )}

      {/* 4. QUIZ — EXPÉRIENCE COMPLÈTE (Hub, Préparation, Joueur, Erreurs, Révision ciblée, Retest) */}
      {currentTab === 'quizzes' && (
        <QuizView
          initialCourse={quizSelectedCourse}
          onNavigateToRevision={course => {
            handleOpenRevision(course);
          }}
          onNavigateToCourses={() => {
            setCurrentTab('courses');
          }}
        />
      )}

      {/* 5. PROFIL — EXPÉRIENCE COMPLÈTE (Identité, Progression, Objectifs, Monnaie & Abonnement, Paramètres, Déconnexion) */}
      {currentTab === 'profile' && (
        <ProfileView
          onBack={() => setCurrentTab(previousTab || 'home')}
          onNavigateToNotifications={() => setCurrentTab('notifications')}
          onNavigateToSettings={() => setCurrentTab('settings')}
          onNavigateToDiamonds={() => setCurrentTab('diamonds')}
          onNavigateToSubscription={() => setCurrentTab('subscription')}
          onNavigateToReferral={() => setCurrentTab('referral')}
          onLogoutSuccess={async () => {
            await onLogout();
          }}
        />
      )}

      {/* 5. bis PARAMÈTRES — EXPÉRIENCE COMPLÈTE */}
      {currentTab === 'settings' && (
        <SettingsView
          onBack={() => setCurrentTab('profile')}
          onNavigateToProfile={() => setCurrentTab('profile')}
          onLogoutSuccess={async () => {
            await onLogout();
          }}
        />
      )}

      {/* 6. RECHERCHE GLOBALE */}
      {currentTab === 'search' && (
        <SearchView
          onBack={() => setCurrentTab(previousTab || 'home')}
          onSelectResult={handleSelectSearchResult}
        />
      )}

      {/* 7. CENTRE DE NOTIFICATIONS */}
      {currentTab === 'notifications' && (
        <NotificationsView
          onBack={() => setCurrentTab(previousTab || 'home')}
          onNavigateToContent={handleNotificationNavigation}
        />
      )}

      {/* 8. MES DIAMANTS & ÉNERGIE */}
      {currentTab === 'diamonds' && (
        <DiamondsView
          onBack={() => setCurrentTab(previousTab || 'home')}
          onNavigateToSubscription={() => setCurrentTab('subscription')}
          onNavigateToReferral={() => setCurrentTab('referral')}
        />
      )}

      {/* 9. ABONNEMENT REVIZO */}
      {currentTab === 'subscription' && (
        <SubscriptionView
          onBack={() => setCurrentTab(previousTab || 'home')}
        />
      )}

      {/* 10. INVITE TES AMIS (PARRAINAGE) */}
      {currentTab === 'referral' && (
        <ReferralView
          onBack={() => setCurrentTab(previousTab || 'home')}
        />
      )}
    </AppShell>
  );
};

const AppRoot: React.FC = () => {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [authRequestedMode, setAuthRequestedMode] = useState<'login' | 'signup' | null>(null);

  if (isLoading) {
    return (
      <div className="auth-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
            REVIZO<span className="brand-sparkle">✦</span>
          </span>
          <div style={{ marginTop: '16px', color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>
            Chargement de ton espace sécurisé...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (authRequestedMode) {
      return (
        <AuthView
          initialMode={authRequestedMode}
          onBack={() => setAuthRequestedMode(null)}
        />
      );
    }
    return (
      <LandingPage
        onOpenAuth={(mode) => setAuthRequestedMode(mode)}
      />
    );
  }

  return (
    <DataProvider authUser={user}>
      <MainAppContent onLogout={signOut} />
    </DataProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
