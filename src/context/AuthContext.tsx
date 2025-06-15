
import React, { createContext, useState, useEffect, useContext } from "react";
import { mockUsers } from "@/mocks/users";

type User = {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
};

type AuthContextProps = {
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (role: "buyer" | "seller" | "admin") => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const local = localStorage.getItem("user");
    if (local) setCurrentUser(JSON.parse(local));
  }, []);

  const login = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId) || null;
    setCurrentUser(user);
    if (user) localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
  };

  const switchRole = (role: "buyer" | "seller" | "admin") => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe ir envuelto en AuthProvider");
  return ctx;
}
