import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { IAuthProvider, IdentifierCheckResult } from '../contracts/IAuthProvider';
import { createAuthProvider } from '../providers/providerFactory';
import { AuthService } from '../services/AuthService';
import { UserProfile, SignInCredentials, SignUpData } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authService: AuthService;
  checkIdentifier: (identifier: string) => Promise<IdentifierCheckResult>;
  signIn: (credentials: SignInCredentials) => Promise<UserProfile>;
  signUp: (data: SignUpData) => Promise<UserProfile>;
  completeAuth: (user: UserProfile) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  customAuthProvider?: IAuthProvider;
  onUserChange?: (user: UserProfile | null) => void;
}> = ({ children, customAuthProvider, onUserChange }) => {
  // Provider d'authentification (MockAuthProvider en local, SupabaseAuthProvider via Factory)
  const authProvider = useMemo<IAuthProvider>(
    () => customAuthProvider || createAuthProvider(50),
    [customAuthProvider]
  );

  // Service métier de validation et sécurité
  const authService = useMemo(() => new AuthService(authProvider), [authProvider]);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Vérification de la session au démarrage
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          if (onUserChange) {
            onUserChange(currentUser);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de session :', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Abonnement réactif aux changements de session (rafraîchissement automatique du token, multi-onglets)
    const unsubscribe = authService.onAuthStateChange((userState) => {
      if (mounted) {
        setUser(userState);
        if (onUserChange) {
          onUserChange(userState);
        }
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authService, onUserChange]);

  const checkIdentifier = async (identifier: string): Promise<IdentifierCheckResult> => {
    return authService.checkIdentifier(identifier);
  };

  const signIn = async (credentials: SignInCredentials): Promise<UserProfile> => {
    const loggedUser = await authService.signIn(credentials);
    setUser(loggedUser);
    if (onUserChange) {
      onUserChange(loggedUser);
    }
    return loggedUser;
  };

  const signUp = async (data: SignUpData): Promise<UserProfile> => {
    const newUser = await authService.signUp(data);
    return newUser;
  };

  const completeAuth = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    if (onUserChange) {
      onUserChange(loggedInUser);
    }
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
    if (onUserChange) {
      onUserChange(null);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    authService,
    checkIdentifier,
    signIn,
    signUp,
    completeAuth,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return ctx;
}
