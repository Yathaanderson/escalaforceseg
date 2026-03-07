import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@escala.com': {
    password: 'admin123',
    user: { id: 'u1', nome: 'Administrador', role: 'admin' },
  },
  'carlos@escala.com': {
    password: '123456',
    user: { id: 'u2', nome: 'Carlos Silva', role: 'funcionario', funcionarioId: '1' },
  },
  'maria@escala.com': {
    password: '123456',
    user: { id: 'u3', nome: 'Maria Santos', role: 'funcionario', funcionarioId: '2' },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const entry = mockUsers[email.toLowerCase()];
    if (entry && entry.password === password) {
      setUser(entry.user);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
