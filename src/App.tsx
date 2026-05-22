/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './config/firebase';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { UserProfile, VibeMode } from './types';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import EnergyCheckInPage from './pages/EnergyCheckIn';
import TaskManager from './pages/TaskManager';
const Analytics = lazy(() => import('./pages/Analytics'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const SettingsPage = lazy(() => import('./pages/Settings'));
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BurnoutAlert from './components/BurnoutAlert';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { useEnergyTheme } from './hooks/useEnergyTheme';
import { useDashboardData } from './hooks/useDashboardData';
import { SkeletonPage } from './components/ui/Skeletons';
import SEO from './components/SEO';
import Onboarding from './pages/Onboarding';

// Lazy loading features
const FitnessCoach = lazy(() => import('./pages/FitnessCoach'));
const Summarizer = lazy(() => import('./pages/Summarizer'));
const JournalPage = lazy(() => import('./pages/Journal'));
const CoachPage = lazy(() => import('./pages/CoachPage'));
const TentangKami = lazy(() => import('./pages/TentangKami'));

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  vibeMode: VibeMode;
  setVibeMode: (mode: VibeMode) => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  dashboardData?: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const AppContent = () => {
  const { dashboardData, profile } = useApp();
  useEnergyTheme(dashboardData?.energyScore ?? profile?.energyScore ?? 5);

  return (
    <>
      <SEO />
      <BurnoutAlert recentCheckins={dashboardData?.recentCheckins || []} />
      <Routes>
        <Route path="/login" element={<ProtectedRoute reverse><LoginPage /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={profile && !(profile as any).onboardingDone ? <Navigate to="/onboarding" replace /> : <Dashboard />} />
          <Route path="/checkin" element={<EnergyCheckInPage />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/fitness" element={<Suspense fallback={<SkeletonPage />}><FitnessCoach /></Suspense>} />
          <Route path="/journal" element={<Suspense fallback={<SkeletonPage />}><JournalPage /></Suspense>} />
          <Route path="/summarizer" element={<Suspense fallback={<SkeletonPage />}><Summarizer /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<SkeletonPage />}><Analytics /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<SkeletonPage />}><ProfilePage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<SkeletonPage />}><SettingsPage /></Suspense>} />
          <Route path="/coach" element={<Suspense fallback={<SkeletonPage />}><CoachPage /></Suspense>} />
          <Route path="/tentang" element={<Suspense fallback={<SkeletonPage />}><TentangKami /></Suspense>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [vibeMode, setVibeMode] = useState<VibeMode>('balance');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const { data: dashboardData } = useDashboardData(user?.uid);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: uid, ...docSnap.data() } as UserProfile);
      } else {
        const newProfile: any = {
          displayName: auth.currentUser?.displayName || 'User',
          email: auth.currentUser?.email || '',
          energyScore: 5,
          vibeMode: 'balance',
          streak: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setProfile({ id: uid, ...newProfile } as UserProfile);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Handle system theme change listener
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const contextValue = useMemo(() => ({
    user, 
    profile, 
    loading, 
    refreshProfile: () => fetchProfile(user?.uid || ''), 
    vibeMode, 
    setVibeMode,
    theme,
    setTheme,
    dashboardData
  }), [user, profile, loading, vibeMode, theme, dashboardData]);

  if (loading) return null;

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <BrowserRouter>
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                padding: '12px 16px',
                maxWidth: '400px'
              },
              success: { iconTheme: { primary: '#1DB97A', secondary: '#0D0F14' } },
              error:   { iconTheme: { primary: '#FF5C5C', secondary: '#0D0F14' } },
            }} 
          />
          <AppContent />
        </BrowserRouter>
      </AppContext.Provider>
    </ErrorBoundary>
  );
}

