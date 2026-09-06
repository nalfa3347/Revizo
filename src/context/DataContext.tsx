import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { IDataProvider } from '../contracts/IDataProvider';
import { createDataProvider } from '../providers/providerFactory';
import { CourseService } from '../services/CourseService';
import { RevisionService } from '../services/RevisionService';
import { QuizService } from '../services/QuizService';
import { GamificationService } from '../services/GamificationService';
import { UserService } from '../services/UserService';
import { SettingsService } from '../services/SettingsService';
import { SearchService } from '../services/SearchService';
import { NotificationService } from '../services/NotificationService';
import { AIOrchestrator } from '../services/ai/AIOrchestrator';
import { UserProfile, UserProgress, AppNotification, AppSettings } from '../types';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface DataContextValue {
  dataProvider: IDataProvider;
  courseService: CourseService;
  revisionService: RevisionService;
  quizService: QuizService;
  gamificationService: GamificationService;
  userService: UserService;
  settingsService: SettingsService;
  searchService: SearchService;
  notificationService: NotificationService;
  aiOrchestrator: AIOrchestrator;
  profile: UserProfile | null;
  progress: UserProgress | null;
  settings: AppSettings | null;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<AppSettings>;
  setActiveUser: (user: UserProfile) => void;
  network: ReturnType<typeof useNetworkStatus>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{
  children: React.ReactNode;
  authUser?: UserProfile | null;
  customDataProvider?: IDataProvider;
}> = ({ children, authUser, customDataProvider }) => {
  const network = useNetworkStatus();
  
  // Instanciation de la couche de données (MockProvider ou SupabaseProvider via Factory)
  const dataProvider = useMemo<IDataProvider>(
    () => customDataProvider || createDataProvider(authUser, 50),
    [customDataProvider, authUser]
  );

  // Services métier
  const courseService = useMemo(() => new CourseService(dataProvider), [dataProvider]);
  const revisionService = useMemo(() => new RevisionService(dataProvider), [dataProvider]);
  const quizService = useMemo(() => new QuizService(dataProvider), [dataProvider]);
  const gamificationService = useMemo(() => new GamificationService(dataProvider), [dataProvider]);
  const userService = useMemo(() => new UserService(dataProvider), [dataProvider]);
  const settingsService = useMemo(() => new SettingsService(dataProvider), [dataProvider]);
  const searchService = useMemo(() => new SearchService(dataProvider), [dataProvider]);
  const notificationService = useMemo(() => new NotificationService(dataProvider), [dataProvider]);
  const aiOrchestrator = useMemo(() => new AIOrchestrator(dataProvider), [dataProvider]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProgress = async () => {
    try {
      const p = await dataProvider.getProgress();
      setProgress(p);
    } catch (err) {
      console.error('Erreur de rafraîchissement de la progression :', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const p = await dataProvider.getProfile();
      setProfile(p);
    } catch (err) {
      console.error('Erreur de rafraîchissement du profil :', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await userService.updateProfile(updates);
    setProfile(updated);
    return updated;
  };

  const updateSettings = async (updates: Partial<AppSettings>): Promise<AppSettings> => {
    const updated = await settingsService.updateSettings(updates);
    setSettings(updated);
    return updated;
  };

  const setActiveUser = (user: UserProfile) => {
    if (dataProvider.setActiveProfile) {
      dataProvider.setActiveProfile(user);
    }
    setProfile(user);
  };

  useEffect(() => {
    if (authUser) {
      if (dataProvider.setActiveProfile) {
        dataProvider.setActiveProfile(authUser);
      }
      setProfile(authUser);
    }
  }, [authUser, dataProvider]);

  useEffect(() => {
    let mounted = true;
    const initData = async () => {
      try {
        if (authUser && dataProvider.setActiveProfile) {
          dataProvider.setActiveProfile(authUser);
        }
        const [prof, prog, stgs, notifs] = await Promise.all([
          dataProvider.getProfile(),
          dataProvider.getProgress(),
          settingsService.getSettings(),
          dataProvider.getNotifications()
        ]);
        if (mounted) {
          setProfile(authUser || prof);
          setProgress(prog);
          setSettings(stgs);
          setNotifications(notifs);
        }
      } catch (err) {
        console.error('Erreur d’initialisation du profil :', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initData();
    return () => {
      mounted = false;
    };
  }, [dataProvider, settingsService, authUser]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const refreshNotifications = async () => {
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications([...notifs]);
    } catch (err) {
      console.error('Erreur de rafraîchissement des notifications :', err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Erreur lors du marquage de notification :', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Erreur lors du marquage global des notifications :', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error('Erreur lors de la suppression des notifications :', err);
    }
  };

  const value = {
    dataProvider,
    courseService,
    revisionService,
    quizService,
    gamificationService,
    userService,
    settingsService,
    searchService,
    notificationService,
    aiOrchestrator,
    profile,
    progress,
    settings,
    notifications,
    unreadNotificationsCount,
    isLoading,
    refreshProgress,
    refreshProfile,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    updateProfile,
    updateSettings,
    setActiveUser,
    network
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData doit être utilisé au sein d’un DataProvider');
  }
  return ctx;
}
