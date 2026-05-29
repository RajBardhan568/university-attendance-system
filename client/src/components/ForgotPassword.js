import React, { useState } from "react";
import axios from "axios";
import { Mail, ShieldCheck, Lock, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"; // Added Loader2 icon

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); // FIXED: Added loading hook state variable

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); // Start Loader
    try {
      await axios.post(
        "https://university-attendance-system-rqyy.onrender.com/api/auth/forgot-password",
        { email }
      );
      alert("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "User not found");
    } finally {
      setLoading(false); // Stop Loader
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Passwords do not match!");
    
    setLoading(true); // Start Loader
    try {
      await axios.post(
        "https://university-attendance-system-rqyy.onrender.com/api/auth/reset-password-otp", 
        { email, otp, newPassword }
      );
      alert("Password reset successful! Redirecting to login...");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false); // Stop Loader
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h2>
          {/* FIXED: Dynamic subtitle showing exactly where the OTP was dispatched */}
          {step === 1 ? (
            <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">
              Secure your account
            </p>
          ) : (
            <div className="mt-2">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                Enter the 6-digit code
              </p>
              <p className="text-xs text-indigo-600 font-semibold bg-indigo-50/70 inline-block px-3 py-1 rounded-xl mt-2 border border-indigo-100/30">
                Sent to: <span className="text-slate-700 font-bold">{email}</span>
              </p>
            </div>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="email"
                value={email}
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-60"
                placeholder="university-email@domain.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all disabled:bg-indigo-400"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Sending Code...
                </>
              ) : (
                <>
                  Send Reset Code <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* FIXED: Explicit text attributes & autoComplete blocking tags stop the autofill bug */}
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                value={otp}
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 tracking-wide disabled:opacity-60"
                placeholder="6-Digit OTP"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Rejects non-numeric characters automatically
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                value={newPassword}
                disabled={loading}
                autoComplete="new-password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-60"
                placeholder="New Password"
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                value={confirmPassword}
                disabled={loading}
                autoComplete="new-password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-60"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all disabled:bg-indigo-400"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Updating Account...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}

        <button 
          onClick={() => step === 1 ? window.location.href="/login" : setStep(1)} 
          disabled={loading}
          className="w-full mt-6 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-500 disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;