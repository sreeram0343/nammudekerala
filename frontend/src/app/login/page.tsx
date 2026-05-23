"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Mail, Lock, User as UserIcon, CheckCircle2, ChevronRight, MapPin, Award } from "lucide-react";
import { assemblyService } from "@/services/assemblyService";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, googleLogin, user } = useAuth();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen"); // citizen, representative
  const [constituencyId, setConstituencyId] = useState<number | undefined>(undefined);
  
  const [assemblies, setAssemblies] = useState<{ id: number; assembly_name: string; district: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
    
    // Check backend health
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`)
      .then(res => res.ok ? setServerStatus("online") : setServerStatus("offline"))
      .catch(() => setServerStatus("offline"));

    // Fetch assemblies for signup constituency selection using assemblyService
    assemblyService.getAssemblies()
      .then((data) => {
        setAssemblies(data);
        if (data.length > 0) setConstituencyId(data[0].id);
      })
      .catch((err) => console.error("Error loading assemblies in login:", err));
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isLoginTab) {
        const result = await login(username, password);
        if (result.success) {
          router.push("/");
        } else {
          setErrorMsg(result.message || "Invalid username or password. Please try again.");
        }
      } else {
        const result = await signup(username, email, password, role, constituencyId);
        if (result.success) {
          setSuccessMsg("Registration successful! Please sign in using your credentials.");
          setIsLoginTab(true);
          setEmail("");
          setPassword("");
        } else {
          setErrorMsg(result.message || "Registration failed. Username or email might already be registered.");
        }
      }
    } catch (err) {
      console.error("Auth action failed:", err);
      setErrorMsg("An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        router.push("/");
      } else {
        setErrorMsg(result.message || "Google login failed.");
      }
    } catch (err) {
      setErrorMsg("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-kerala-dark-bg px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Brand Watermark BG */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.01] pointer-events-none font-black text-[12vw] uppercase select-none">
        KERALA
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* Logo and Tagline */}
        <div className="text-center">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 font-extrabold text-white text-xl shadow-lg shadow-emerald-600/20 mb-3 hover:scale-105 active:scale-95 transition-all">
            ന
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {isLoginTab ? "Welcome to Nammude Kerala" : "Join the Civic Square"}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            {serverStatus === "online" ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                ● Server Online
              </span>
            ) : serverStatus === "offline" ? (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                ● Server Offline (Check Config)
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-400 animate-pulse">
                ● Connecting to server...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">
            {isLoginTab 
              ? "Sign in to report local issues, vote, and track MLA responses." 
              : "Create a citizen or verified representative profile."
            }
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
          
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                isLoginTab
                  ? "bg-card text-emerald-600 shadow-sm dark:text-emerald-400"
                  : "text-slate-500 hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                !isLoginTab
                  ? "bg-card text-emerald-600 shadow-sm dark:text-emerald-400"
                  : "text-slate-500 hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {/* Google Login Section */}
          <div className="flex flex-col items-center justify-center space-y-3 pb-2">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMsg("Google Login failed")}
              useOneTap
              theme="outline"
              shape="pill"
              size="large"
              text={isLoginTab ? "signin_with" : "signup_with"}
              width="100%"
            />
            <div className="relative w-full flex items-center gap-2 py-2">
              <div className="h-[1px] w-full bg-border" />
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Or use email</span>
              <div className="h-[1px] w-full bg-border" />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-950/20 dark:bg-red-950/15 dark:text-red-400">
              ⚠️ {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/15 dark:text-emerald-400">
              ✅ {successMsg}
            </div>
          )}

          {/* Forms */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. ajith_kumar"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Email (Signup only) */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ajith@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Role & Constituency Toggle (Signup only) */}
            {!isLoginTab && (
              <div className="space-y-4 border-t border-border pt-4">
                {/* Role selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Profile Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("citizen")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all ${
                        role === "citizen"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border-border hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <UserIcon className="h-4 w-4" /> Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("representative")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all ${
                        role === "representative"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border-border hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <Award className="h-4 w-4" /> Verified MLA
                    </button>
                  </div>
                </div>

                {/* Constituency Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    {role === "representative" ? "MLA Constituency" : "My Home Constituency"}
                  </label>
                  <select
                    value={constituencyId}
                    onChange={(e) => setConstituencyId(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                  >
                    {assemblies.map((asm) => (
                      <option key={asm.id} value={asm.id}>
                        @{asm.assembly_name} ({asm.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 active:scale-98 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isLoginTab ? (
                "Sign In"
              ) : (
                "Register Account"
              )}
            </button>
          </form>

        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400">
            Skip, browse as guest <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
