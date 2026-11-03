import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { SplashScreen } from "@capacitor/splash-screen";
import { ShieldCheck } from "lucide-react";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import TeacherDash from "./components/TeacherDash";
import StudentDash from "./components/StudentDash";
import VerifyAccount from "./components/VerifyAccount";
import Home from "./components/Home";

// 1. Naya sub-component banaya taaki useNavigate aur useLocation Router ke andar chalein
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

// 1. Smart Session Check: Full splash on first/logged-out open, instant load when logged in
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { value } = await Preferences.get({ key: "user" });

        if (value) {
          // User is already logged in -> Open Dashboard almost instantly!
          setCurrentUser(JSON.parse(value));
        } else {
          // User is NOT logged in (First time / Logged out) -> Play full 1.8s splash animation
          if (loading) {
            await new Promise((resolve) => setTimeout(resolve, 1800));
          }
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to load user session:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [location]);


useEffect(() => {
  // Register hardware back button listener for non-dashboard screens
  const backListener = CapacitorApp.addListener("backButton", () => {
    const currentHash = window.location.hash;

    // Exit only if on root or login screens; dashboards handle their own tab state
    if (
      currentHash === "#/" ||
      currentHash === "#/login" ||
      currentHash === "" ||
      currentHash === "#"
    ) {
      CapacitorApp.exitApp();
    } else if (
      !currentHash.includes("student-dashboard") &&
      !currentHash.includes("teacher-dashboard")
    ) {
      navigate(-1);
    }
  });

  return () => {
    backListener.then((handler) => handler.remove());
  };
}, [navigate, location]);

// 3. Custom Animated Splash Screen (Replaces "Loading session...")
if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 via-white to-indigo-50/60 py-14 px-6 overflow-hidden relative select-none">
        {/* Soft Background Glows */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />

        <div />

        {/* Center Animated Official Logo Card */}
        <div className="flex flex-col items-center z-10">
          <div className="relative flex items-center justify-center">
            {/* Outer Animated Pulse Rings */}
            <div
              className="absolute w-52 h-52 rounded-full border-2 border-indigo-500/20 animate-ping"
              style={{ animationDuration: "2.2s" }}
            />
            <div className="absolute w-60 h-60 rounded-full bg-gradient-to-tr from-indigo-500/10 to-amber-500/10 blur-xl animate-pulse" />

            {/* Logo Container */}
            <div className="relative w-48 h-48 rounded-3xl bg-white shadow-2xl shadow-indigo-950/15 border border-slate-100 p-3 flex items-center justify-center animate- splash-pop">
              <img
                src="/logo.png"
                alt="AMS Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>

          {/* Animated Loading Bar */}
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-10 shadow-inner">
            <div className="h-full bg-gradient-to-r from-indigo-900 via-indigo-600 to-amber-500 rounded-full animate-loading-bar" />
          </div>

          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mt-4 animate-pulse">
            Initializing Portal...
          </p>
        </div>

        {/* Bottom Official Tagline */}
        <div className="z-10 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-semibold">
            Secure • Geo-Verified • Real-Time
          </p>
        </div>
      </div>
    );
  }

  // Global Footer Component
  const Footer = () => (
    <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
        © 2026 AMS • DEVELOPED BY RAJ BARDHAN • ALL RIGHTS RESERVED
      </p>
    </footer>
  );

return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-grow">
        <Routes>
          {/* Root Route: Redirect logged-in users directly to their dashboard */}
          <Route
            path="/"
            element={
              currentUser ? (
                currentUser.role === "teacher" ? (
                  <Navigate to="/teacher-dashboard" replace />
                ) : (
                  <Navigate to="/student-dashboard" replace />
                )
              ) : (
                <Home />
              )
            }
          />

          {/* Login Route: Prevent logged-in users from seeing the login screen again */}
          <Route
            path="/login"
            element={
              currentUser ? (
                currentUser.role === "teacher" ? (
                  <Navigate to="/teacher-dashboard" replace />
                ) : (
                  <Navigate to="/student-dashboard" replace />
                )
              ) : (
                <Login />
              )
            }
          />

          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-account" element={<VerifyAccount />} />

          {/* Teacher Dashboard Protected Route */}
          <Route
            path="/teacher-dashboard"
            element={
              (() => {
                if (!currentUser || currentUser.role !== "teacher") {
                  return <Navigate to="/login" replace />;
                }
                return <TeacherDash teacherId={currentUser._id} initialUser={currentUser}/>;
              })()
            }
          />

          {/* Student Dashboard Protected Route */}
          <Route
            path="/student-dashboard"
            element={
              (() => {
                if (!currentUser || currentUser.role !== "student") {
                  return <Navigate to="/login" replace />;
                }
                return <StudentDash regNo={currentUser.regNo} initialUser={currentUser} />;
              })()
            }
          />

          {/* General Dashboard Redirect Fallback */}
          <Route
            path="/dashboard"
            element={
              (() => {
                if (!currentUser) return <Navigate to="/login" replace />;
                return currentUser.role === "teacher" ? (
                  <Navigate to="/teacher-dashboard" replace />
                ) : (
                  <Navigate to="/student-dashboard" replace />
                );
              })()
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

// Main App Component wrapped with HashRouter
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}