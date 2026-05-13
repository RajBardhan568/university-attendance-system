import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Mail, ArrowRight, RotateCcw, Clock } from 'lucide-react';

const VerifyAccount = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(60); // 60-second countdown
    const [canResend, setCanResend] = useState(false);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/verify-otp", { email, otp });
            alert("Account Verified!");
            navigate("/login");
        } catch (err) {
            alert(err.response?.data?.error || "Invalid Code");
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        try {
            await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/resend-otp", { email });
            alert("New OTP sent!");
            setTimer(60); // Reset timer
            setCanResend(false);
        } catch (err) {
            alert("Failed to resend OTP. Ensure the email is correct.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Verify Account</h2>
                
                <form onSubmit={handleVerify} className="mt-8 space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-semibold text-slate-700"
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                        />
                    </div>
                    <input 
                        type="text" 
                        maxLength="6"
                        className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                        placeholder="000000"
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                        Verify Account <ArrowRight size={20}/>
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-3">
                    {!canResend ? (
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                            <Clock size={16} /> Resend available in {timer}s
                        </div>
                    ) : (
                        <button 
                            onClick={handleResend}
                            className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline"
                        >
                            <RotateCcw size={16} /> Resend Verification Code
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyAccount;