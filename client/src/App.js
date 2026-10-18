import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { value } = await Preferences.get({ key: 'user' });
        if (value) {
          setCurrentUser(JSON.parse(value));
        }
      } catch (error) {
        console.error("Failed to load user session", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, [location]);



  useEffect(() => {
    // Hardware back button listener register karein
    const backListener = CapacitorApp.addListener('backButton', () => {
      const currentHash = window.location.hash; // Yeh "#/", "#/login", "#/register" etc. dega

      // Agar user Home/Landing screen ya Login screen par hai
      if (currentHash === '#/' || currentHash === '#/login' || currentHash === '' || currentHash === '#') {
        const confirmExit = window.confirm("Do you want to exit app?");
        if (confirmExit) {
          CapacitorApp.exitApp();
        }
      } else {
        // Agar kisi aur page par hai (jaise Register ya Dashboards), toh pichle page par jayein
        navigate(-1);
      }
    });

    return () => {
      backListener.then(handler => handler.remove());
    };
  }, [navigate, location]);

  // Global Footer Component
  const Footer = () => (
    <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
        © 2026 AMS • DEVELOPED BY RAJ BARDHAN • ALL RIGHTS RESERVED
      </p>
    </footer>
  );

if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-account" element={<VerifyAccount />} />

          {/* Teacher Dashboard Protected Route */}
          <Route
            path="/teacher-dashboard"
            element={
              (() => {
                const currentUser = getAuthUser();
                if (!currentUser || currentUser.role !== "teacher") {
                  return <Navigate to="/login" />;
                }
                return <TeacherDash teacherId={currentUser._id} />;
              })()
            }
          />

          {/* Student Dashboard Protected Route */}
          <Route
            path="/student-dashboard"
            element={
              (() => {
                const currentUser = getAuthUser();
                if (!currentUser || currentUser.role !== "student") {
                  return <Navigate to="/login" />;
                }
                return <StudentDash regNo={currentUser.regNo} />;
              })()
            }
          />

          {/* General Dashboard Redirect Fallback */}
          <Route
            path="/dashboard"
            element={
              (() => {
                const currentUser = getAuthUser();
                if (!currentUser) return <Navigate to="/login" />;
                return currentUser.role === "teacher" ? (
                  <Navigate to="/teacher-dashboard" />
                ) : (
                  <Navigate to="/student-dashboard" />
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

// Main App Component jisme HashRouter wrap kiya gaya hai
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}