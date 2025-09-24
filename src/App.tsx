import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { TaskScheduler } from './components/TaskScheduler';
import { StressFreeActivities } from './components/StressFreeActivities';
import { FeedbackForm } from './components/FeedbackForm';
import { FloatingChatbot } from './components/FloatingChatbot';
import { MeditationScreen } from './components/MeditationScreen';
import { DrawingCanvas } from './components/DrawingCanvas';
import { JournalingScreen } from './components/JournalingScreen';
import { supabase, api } from './utils/supabase/client';

export type User = {
  id: string;
  petName: string;
  email: string;
  avatar: string;
  rewardPoints: number;
  stressLevels: { week: string; level: number; }[];
};

export type AppScreen = 'auth' | 'dashboard' | 'tasks' | 'stress-free' | 'feedback' | 'meditation' | 'drawing' | 'journaling';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('auth');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Set mobile viewport meta tag for Android optimization
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }

    // Set theme color for Android status bar
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColor);
    }
    
    // Check for stored session and restore user
    const checkSession = async () => {
      try {
        const storedDarkMode = localStorage.getItem('nimathi-dark-mode');
        if (storedDarkMode) {
          setIsDarkMode(JSON.parse(storedDarkMode));
        }

        // Test backend connectivity
        try {
          const healthCheck = await api.health();
          console.log('Backend health check:', healthCheck);
        } catch (healthError) {
          console.error('Backend health check failed:', healthError);
        }

        // Check for active Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          // Get user profile from backend
          const userResponse = await api.getUser(session.user.id, session.access_token);
          
          if (userResponse.user) {
            const user: User = {
              id: userResponse.user.id,
              petName: userResponse.user.petName,
              email: userResponse.user.email,
              avatar: userResponse.user.avatar,
              rewardPoints: userResponse.user.rewardPoints || 0,
              stressLevels: userResponse.user.stressLevels || []
            };

            // Store session data
            localStorage.setItem('nimathi-session', JSON.stringify({
              accessToken: session.access_token,
              refreshToken: session.refresh_token
            }));

            setUser(user);
            setCurrentScreen('dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear any invalid session data
        localStorage.removeItem('nimathi-session');
        localStorage.removeItem('nimathi-user');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nimathi-dark-mode', JSON.stringify(isDarkMode));

    // Update theme color for Android status bar
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', isDarkMode ? '#0A0A0A' : '#FFFFFF');
    }
  }, [isDarkMode]);

  const handleLogin = (userData: User) => {
    const userWithDefaults = {
      ...userData,
      rewardPoints: userData.rewardPoints || 0,
      stressLevels: userData.stressLevels || []
    };
    setUser(userWithDefaults);
    localStorage.setItem('nimathi-user', JSON.stringify(userWithDefaults));
    setCurrentScreen('dashboard');
  };

  const updateUser = async (updatedUser: User) => {
    try {
      setUser(updatedUser);
      localStorage.setItem('nimathi-user', JSON.stringify(updatedUser));

      // Sync with backend if we have a session
      const sessionData = localStorage.getItem('nimathi-session');
      if (sessionData) {
        const { accessToken } = JSON.parse(sessionData);
        await api.updateUser(updatedUser.id, updatedUser, accessToken);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('nimathi-user');
      localStorage.removeItem('nimathi-session');
      setCurrentScreen('auth');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const navigateToScreen = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl text-foreground mb-2">Nimathi</h1>
          <p className="text-muted-foreground">Your mental wellness companion</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen w-full max-w-full"
        >
          {currentScreen === 'auth' && (
            <AuthScreen onLogin={handleLogin} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
          )}
          
          {currentScreen === 'dashboard' && user && (
            <Dashboard 
              user={user} 
              onNavigate={navigateToScreen}
              onLogout={handleLogout}
              onUpdateUser={updateUser}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )}
          
          {currentScreen === 'tasks' && user && (
            <TaskScheduler 
              user={user} 
              onBack={() => navigateToScreen('dashboard')}
            />
          )}
          
          {currentScreen === 'stress-free' && user && (
            <StressFreeActivities 
              user={user} 
              onBack={() => navigateToScreen('dashboard')}
              onFeedback={() => navigateToScreen('feedback')}
              onNavigate={navigateToScreen}
            />
          )}
          
          {currentScreen === 'feedback' && user && (
            <FeedbackForm 
              user={user} 
              onBack={() => navigateToScreen('stress-free')}
            />
          )}

          {currentScreen === 'meditation' && user && (
            <MeditationScreen 
              user={user} 
              onBack={() => navigateToScreen('stress-free')}
              onUpdateUser={updateUser}
            />
          )}

          {currentScreen === 'drawing' && user && (
            <DrawingCanvas 
              user={user} 
              onBack={() => navigateToScreen('stress-free')}
              onUpdateUser={updateUser}
            />
          )}

          {currentScreen === 'journaling' && user && (
            <JournalingScreen 
              user={user} 
              onBack={() => navigateToScreen('stress-free')}
              onUpdateUser={updateUser}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Chatbot - only show after login */}
      {user && currentScreen !== 'auth' && (
        <FloatingChatbot user={user} />
      )}
    </div>
  );
}