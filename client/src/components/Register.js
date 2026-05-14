import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Mail, Lock, Phone, Hash, Image as ImageIcon, ArrowLeft, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [step, setStep] = useState(1); 
  const [role, setRole] = useState("student");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false); // Separate state for resend
  
  // Resend OTP Timer States
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    regNo: "",
  });

  // Timer Logic for OTP
  useEffect(() => {
    let interval;
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLoading(false);
      return alert("Please enter a valid university email address.");
    }

    // 1. Name Length Check
  if (formData.name.length < 3 || formData.name.length > 50) {
    return alert("Name must be between 3 and 50 characters.");
      setLoading(false);

  }

  // 2. Mobile Strict Check
  if (formData.mobile.length !== 10) {
    return alert("Please enter a valid 10-digit mobile number.");
      setLoading(false);

  }

  // 3. Image Size Check (if student)
  if (role === "student" && file) {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) {
      return alert("Profile photo must be less than 2MB.");
      setLoading(false);

    }
  }

  // setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "regNo" && role === "teacher") return;
      data.append(key, formData[key]);
    });
    data.append("role", role);
    if (file && role === "student") data.append("profilePhoto", file);

    try {
      // await axios.post("http://localhost:5000/api/auth/register"

      await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/register"
        
        , data);
      alert("OTP sent to your email!");
      setStep(2);
      setTimer(30); // Reset timer when moving to OTP step
      setCanResend(false);
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

const handleResendOtp = async () => {
  setResendLoading(true); // Only trigger the resend loader
  try {
    await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/resend-otp", { 
      email: formData.email 
    });
    alert("A new OTP has been sent!");
    setTimer(30);
    setCanResend(false);
  } catch (err) {
    alert("Failed to resend OTP");
  } finally {
    setResendLoading(false);
  }
};

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/verify-otp", {
        email: formData.email,
        otp: otp,
      });
      alert("Account verified successfully!");
      navigate("/login");
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 relative overflow-hidden">
        
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h2>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Join Attendance.io</p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              {["student", "teacher"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${role === r ? "bg-white shadow-md text-indigo-600" : "text-slate-500"}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleInitialSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="name" placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700" onChange={handleChange} required />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="email" type="email" placeholder="University Email" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700" onChange={handleChange} required />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700" 
                  onChange={handleChange} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="mobile" placeholder="Mobile Number" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700" onChange={handleChange} required />
              </div>

              {role === "student" && (
                <>
                  <div className="relative">
                    <Hash className="absolute left-4 top-4 text-slate-300" size={18} />
                    <input name="regNo" placeholder="Registration No" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700" onChange={handleChange} required />
                  </div>
                  <div className="md:col-span-2 bg-indigo-50 p-4 rounded-2xl border-2 border-dashed border-indigo-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="bg-indigo-600 p-2 rounded-lg text-white"><ImageIcon size={20}/></div>
                      <span className="text-sm font-bold text-indigo-700">{file ? file.name : "Upload Student ID/Photo"}</span>
                      <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    </label>
                  </div>
                </>
              )}

              <div className="md:col-span-2 mt-4">
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  {loading ? "Processing..." : <><ShieldCheck size={20}/> Create {role} Account</>}
                </button>
                <button type="button" onClick={() => navigate("/login")} className="w-full mt-4 text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
                  <ArrowLeft size={16}/> Back to Login
                </button>
              </div>
            </form>
          </>
        )}
{loading && (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[3rem]">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Processing...</p>
  </div>
)}
        {step === 2 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Verify OTP</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-8">Sent to {formData.email}</p>
            
            <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto space-y-6">
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <div className="text-sm font-bold">
                {canResend ? (
                  <button type="button" onClick={handleResendOtp} className="text-indigo-600 hover:underline">Resend OTP</button>
                ) : (
                  <span className="text-slate-400">Resend in <span className="text-indigo-600">{timer}s</span></span>
                )}
              </div>

              <button disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                {loading ? "Verifying..." : <>Verify Account <ArrowRight size={20}/></>}
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm flex items-center justify-center gap-2 mx-auto">
                <ArrowLeft size={16}/> Edit Details
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;