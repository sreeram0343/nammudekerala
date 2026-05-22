"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string; // citizen, representative, admin
  profile_image?: string;
  constituency_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string, role: string, constituencyId?: number) => Promise<boolean>;
  logout: () => void;
  selectedAssembly: string;
  setSelectedAssembly: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAssembly, setSelectedAssembly] = useState<string>("");

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("nk_token");
      const storedUser = localStorage.getItem("nk_user");
      
      if (storedToken && storedUser) {
        try {
          // Verify token against backend
          const res = await fetch("http://localhost:8000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(storedToken);
            localStorage.setItem("nk_user", JSON.stringify(userData));
          } else {
            // Token expired or invalid
            localStorage.removeItem("nk_token");
            localStorage.removeItem("nk_user");
          }
        } catch (err) {
          console.error("Session restore failed, falling back to cached local storage:", err);
          // Network error: use cached offline fallback for smooth local testing
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      }
      setLoading(false);
    };
    
    restoreSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) return false;
      
      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem("nk_token", data.access_token);
      localStorage.setItem("nk_user", JSON.stringify(data.user));
      
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  const signup = async (
    username: string, 
    email: string, 
    password: string, 
    role: string, 
    constituencyId?: number
  ): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
          constituency_id: constituencyId || null
        }),
      });
      
      return res.ok;
    } catch (err) {
      console.error("Signup error:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nk_token");
    localStorage.removeItem("nk_user");
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      selectedAssembly,
      setSelectedAssembly
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
