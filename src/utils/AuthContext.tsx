import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const getAccessToken = () => {
    const sessionData = localStorage.getItem('nimathi-session');
    if (sessionData) {
      const { accessToken } = JSON.parse(sessionData);
      return accessToken;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}