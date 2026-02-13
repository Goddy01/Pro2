import { createContext, useContext, useState, useCallback } from 'react';

const TOKEN_KEY = 'sideline_admin_token';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  );

  const login = useCallback((t: string) => {
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
