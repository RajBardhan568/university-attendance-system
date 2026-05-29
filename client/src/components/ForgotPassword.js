import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, ShieldCheck, Lock, ArrowRight, ArrowLeft, Loader2, Clock, RotateCcw } from "lucide-react";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ============================================================
  // UPDATED CONFIGURATION: SEPARATED OTP & RESEND TIMERS
  // ============================================================
  const [otpTimer, setOtpTimer] = useState(300);     // 5 Minutes (300 seconds) expiration window
  const [resendTimer, setResendTimer] = useState(60); // 1 Minute (60 seconds) cooldown window

  // Dual countdown clock effect loop
  useEffect(() => {
    let interval = null;
    if (step === 2) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);
  // ============================================================

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "https://university-attendance-system-rqyy.onrender.com/api/auth/forgot-password",
        { email }
      );
      alert("OTP sent to your email!");
      
      // Initialize separate timer metrics upon entering Step 2
      setOtpTimer(300);
      setResendTimer(60);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return; // Prevent clicking before cooldown clears
    setLoading(true);
    try {
      await axios.post(
        "https://university-attendance-system-rqyy.onrender.com/api/auth/forgot-password",
        { email }
      );
      alert("✨ A brand new OTP code has been sent to your inbox!");
      
      // Reset separate tracking metrics
      setOtp(""); 
      setOtpTimer(300); // Gives another fresh 5 minutes
      setResendTimer(60); // Resets 1 minute resend restriction cooldown
    } catch (err) {
      alert(err.response?.data?.error || "Failed to resend authentication code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Safety check if the 5-minute window expires
    if (otpTimer === 0) {
      alert("❌ This OTP has expired! Please click the resend button to receive a new one.");
      return;
    }
    
    if (newPassword !== confirmPassword) return alert("Passwords do not match!");
    
    setLoading(true);
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
      setLoading(false);
    }
  };

  // Helper formatting utility to print standard clock digits (MM:SS) up to 5 minutes
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h2>
          
          {step === 1 ? (
            <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">
              Secure your account
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                Enter the 6-digit code
              </p>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-xs text-indigo-600 font-semibold bg-indigo-50/70 inline-block px-3 py-1 rounded-xl border border-indigo-100/30">
                  Sent to: <span className="text-slate-700 font-bold">{email}</span>
                </p>
                
                {/* 5-MINUTE CODE EXPIRATION TRACKER BANNER */}
                {otpTimer > 0 ? (
                  <p className="text-xs text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    <Clock size={12} className="animate-pulse" /> Code Expires In: {formatTime(otpTimer)}
                  </p>
                ) : (
                  <p className="text-xs text-rose-600 font-black flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                    ⚠️ OTP Code Expired! Request a new session token below.
                  </p>
                )}
              </div>
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
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                value={otp}
                disabled={loading || otpTimer === 0} // Disables field only when the full 5-minute timer hits zero
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 tracking-wide disabled:opacity-60"
                placeholder={otpTimer === 0 ? "CODE EXPIRED" : "6-Digit OTP"}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                value={newPassword}
                disabled={loading || otpTimer === 0}
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
                disabled={loading || otpTimer === 0}
                autoComplete="new-password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-60"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              disabled={loading || otpTimer === 0}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Updating Account...
                </>
              ) : (
                "Update Password"
              )}
            </button>

            {/* 1-MINUTE RESEND COOLDOWN LINK CONTROLLER */}
            <div className="text-center pt-2">
              {resendTimer === 0 ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm"
                >
                  <RotateCcw size={12} /> Resend OTP Code
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  Resend OTP available in {resendTimer}s
                </span>
              )}
            </div>
          </form>
        )}

        <button 
          onClick={() => step === 1 ? window.location.href="/login" : setStep(1)} 
          disabled={loading}
          className="w-full mt-4 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-500 disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;