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
import Home from "./components/Home"; // Add this line

function App() {
  // Global Footer Component to keep the return clean
  const Footer = () => (
    <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} Attendance.io • Developed by Raj Bardhan • All Rights Reserved
      </p>
    </footer>
  );

  // This helper stays here, but we call it INSIDE the Route element
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

            {/* Dynamic Protected Route */}
            <Route
              path="/dashboard"
              element={
                (() => {
                  const currentUser = getAuthUser(); // Re-checks storage every time we hit this route
                  if (!currentUser) return <Navigate to="/login" />;
                  
                  return currentUser.role === "teacher" ? (
                    <TeacherDash teacherId={currentUser._id} />
                  ) : (
                    <StudentDash regNo={currentUser.regNo} />
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

