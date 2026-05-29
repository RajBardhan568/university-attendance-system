import React, { useState, useEffect } from "react"; // Added useEffect for timer tracking
import axios from "axios";
import { Mail, ShieldCheck, Lock, ArrowRight, ArrowLeft, Loader2, Clock, RotateCcw } from "lucide-react"; // Added Clock and RotateCcw icons

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ============================================================
  // NEW ADDITIONS: TIMER & RESEND STATE HOOKS
  // ============================================================
  const [timer, setTimer] = useState(60); // 60 seconds countdown window
  const [canResend, setCanResend] = useState(false);

  // Countdown clock effect loop
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);
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
      
      // Initialize Timer States on successful generation
      setTimer(60);
      setCanResend(false);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await axios.post(
        "https://university-attendance-system-rqyy.onrender.com/api/auth/forgot-password",
        { email }
      );
      alert("✨ A brand new OTP code has been sent to your inbox!");
      
      // Reset Countdown Tracker Metrics
      setOtp(""); // Flush old text field inputs
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to resend authentication code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Safety check if user somehow bypasses disabled UI buttons
    if (timer === 0) {
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

  // Helper formatting utility to print standard clock digits (e.g., 00:45)
  const formatTime = (seconds) => {
    return `00:${seconds < 10 ? `0${seconds}` : seconds}`;
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
                
                {/* DYNAMIC TIMER INTERACTIVE UI FEEDBACK BANNER */}
                {timer > 0 ? (
                  <p className="text-xs text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    <Clock size={12} className="animate-pulse" /> Code Expires In: {formatTime(timer)}
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
                disabled={loading || timer === 0} // Blocks typing automatically if code drops past duration deadline
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 tracking-wide disabled:opacity-60"
                placeholder={timer === 0 ? "CODE EXPIRED" : "6-Digit OTP"}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                value={newPassword}
                disabled={loading || timer === 0}
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
                disabled={loading || timer === 0}
                autoComplete="new-password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-60"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            {/* SUBMIT RESET PASSWORD ACTION BUTTON */}
            <button 
              disabled={loading || timer === 0} // Disables form processing if timer hits zero
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

            {/* DYNAMIC RESEND CODE CONTROLLER LINK */}
            <div className="text-center pt-2">
              {canResend ? (
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
                  Resend OTP available in {timer}s
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