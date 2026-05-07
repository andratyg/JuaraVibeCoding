/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './config/firebase';
import { doc, getDoc, setDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { UserProfile, VibeMode } from './types';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import BottomTabBar from './components/layout/BottomTabBar';
import ThemeWrapper from './components/layout/ThemeWrapper';
import Dashboard from './pages/Dashboard';
import EnergyCheckInPage from './pages/EnergyCheckIn';
import TaskManager from './pages/TaskManager';
import FitnessCoach from './pages/FitnessCoach';
import JournalPage from './pages/Journal';
import Summarizer from './pages/Summarizer';
import Analytics from './pages/Analytics';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ChatCoach from './components/features/ChatCoach';
import WellnessNudges from './components/features/WellnessNudges';

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  vibeMode: VibeMode;
  setVibeMode: (mode: VibeMode) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [vibeMode, setVibeMode] = useState<VibeMode>('balance');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: uid, ...data } as UserProfile);
        if (data.theme) setTheme(data.theme);
      } else {
        // Initialize profile
        const newProfile: UserProfile = {
          id: uid,
          displayName: auth.currentUser?.displayName || 'User',
          fullName: auth.currentUser?.displayName || 'Flow Member',
          email: auth.currentUser?.email || '',
          photoURL: auth.currentUser?.photoURL || '',
          bio: '',
          phoneNumber: auth.currentUser?.phoneNumber || '',
          energyScore: 5,
          vibeMode: 'balance',
          streak: 0,
          settings: {
            notifications: {
              email: true,
              push: true,
              messages: false,
              alerts: true
            },
            privacy: {
              visibility: 'public',
              dataSharing: true
            },
            aiPreferences: {
              coachTone: 'balanced',
              nudgeFrequency: 'normal',
              focusAreas: ['Fitness', 'Mental Health']
            },
            accessibility: {
              highContrast: false,
              fontScale: 1,
              reducedMotion: false
            },
            theme: 'light'
          }
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'system', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0D0F14]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      refreshProfile: () => fetchProfile(user?.uid || ''), 
      vibeMode, 
      setVibeMode,
      theme,
      setTheme: (t) => {
        setTheme(t);
        if (user) updateDoc(doc(db, 'users', user.uid), { theme: t });
      }
    }}>
      <BrowserRouter>
        <ThemeWrapper>
          <Routes>
            <Route path="/login" element={<ProtectedRoute reverse><LoginPage /></ProtectedRoute>} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-[#0D0F14]">
                  <Sidebar />
                  <main className="min-h-screen ml-0 md:ml-[52px] lg:ml-[220px] pb-[72px] md:pb-0 transition-all duration-300 flex flex-col">
                    <TopBar />
                    <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto w-full">
                      <ChatCoach />
                      <WellnessNudges />
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/energy" element={<EnergyCheckInPage />} />
                        <Route path="/tasks" element={<TaskManager />} />
                        <Route path="/fitness" element={<FitnessCoach />} />
                        <Route path="/journal" element={<JournalPage />} />
                        <Route path="/summarizer" element={<Summarizer />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Routes>
                    </div>
                  </main>
                  <BottomTabBar />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </ThemeWrapper>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
