"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { GoogleOAuthProvider } from "@react-oauth/google";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string; // citizen, representative, admin
  profile_image: string | null;
  constituency_id: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: (token: string) => Promise<{ success: boolean; message?: string }>;
  signup: (username: string, email: string, password: string, role: string, constituencyId?: number) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  selectedAssembly: string;
  setSelectedAssembly: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

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
          // Attempt to parse stored user data safely
          const parsedUser = JSON.parse(storedUser);
          
          // Verify token against backend using authService
          const userData = await authService.getMe();
          setUser(userData);
          setToken(storedToken);
          localStorage.setItem("nk_user", JSON.stringify(userData));
        } catch (err) {
          console.error("Session restore failed:", err);
          // If it's a 401 Unauthorized or 403, clear local storage
          if (err instanceof Error && (err.message.includes("401") || err.message.includes("403") || err.message.toLowerCase().includes("unauthorized"))) {
            localStorage.removeItem("nk_token");
            localStorage.removeItem("nk_user");
            setToken(null);
            setUser(null);
          } else if (storedUser) {
            // Network error fallback to cached user
            try {
              setUser(JSON.parse(storedUser));
              setToken(storedToken);
            } catch {
              localStorage.removeItem("nk_token");
              localStorage.removeItem("nk_user");
            }
          }
        }
      }
      setLoading(false);
    };
    
    restoreSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await authService.login({ username, password });
      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem("nk_token", data.access_token);
      localStorage.setItem("nk_user", JSON.stringify(data.user));
      
      return { success: true };
    } catch (err: any) {
      console.error("Login failed:", err);
      return { success: false, message: err.message || "Invalid username or password" };
    }
  };

  const googleLogin = async (googleToken: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await authService.googleLogin(googleToken);
      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem("nk_token", data.access_token);
      localStorage.setItem("nk_user", JSON.stringify(data.user));
      
      return { success: true };
    } catch (err: any) {
      console.error("Google login failed:", err);
      return { success: false, message: err.message || "Google authentication failed" };
    }
  };

  const signup = async (
    username: string, 
    email: string, 
    password: string, 
    role: string, 
    constituencyId?: number
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await authService.signup({
        username,
        email,
        password,
        role,
        constituency_id: constituencyId || null
      });
      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err);
      return { success: false, message: err.message || "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nk_token");
    localStorage.removeItem("nk_user");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{
        user,
        token,
        loading,
        login,
        googleLogin,
        signup,
        logout,
        selectedAssembly,
        setSelectedAssembly
      }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
