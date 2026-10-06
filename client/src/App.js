import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import TeacherDash from "./components/TeacherDash";
import StudentDash from "./components/StudentDash";
import VerifyAccount from "./components/VerifyAccount";
import Home from "./components/Home";

function App() {
  // Global Footer Component
  const Footer = () => (
    <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
        © 2026 AMS • DEVELOPED BY RAJ BARDHAN • ALL RIGHTS RESERVED
      </p>
    </footer>
  );

  // Helper function to check stored user session
  const getAuthUser = () => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  };

  return (
    <Router>
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
    </Router>
  );
}

export default App;