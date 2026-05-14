import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Mail, Lock, Phone, Hash, Image as ImageIcon, ArrowLeft, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("student");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(300); // 5 minutes in seconds

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    regNo: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    mobile: "",
    regNo: "",
    photo: ""
  });

  // Dual Timer Logic: Resend (30s) and Expiry (5m)
  useEffect(() => {
    let interval;
    if (step === 2) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setOtpExpiry((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    if (timer === 0) setCanResend(true);
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Real-time restriction for Name (Letters only) and Mobile (Numbers only)
    if (name === "name" && !/^[A-Za-z\s]*$/.test(value)) return;
    if (name === "mobile" && !/^\d*$/.test(value)) return;
    
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" }); // Clear error as user types
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    let newErrors = { name: "", email: "", mobile: "", regNo: "", photo: "" };
    let hasError = false;

    // Strict Validations
    if (formData.name.length < 3) { newErrors.name = "Name too short (Min 3 letters)"; hasError = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = "Invalid email format"; hasError = true; }
    if (formData.mobile.length !== 10) { newErrors.mobile = "Must be exactly 10 digits"; hasError = true; }
    if (role === "student" && !formData.regNo) { newErrors.regNo = "Registration number required"; hasError = true; }
    if (role === "student" && !file) { newErrors.photo = "ID Photo is required"; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "regNo" && role === "teacher") return;
      data.append(key, formData[key]);
    });
    data.append("role", role);
    if (file && role === "student") data.append("profilePhoto", file);

    try {
      await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/register", data,{ timeout: 15000 });
      setStep(2);
      setTimer(30);
      setOtpExpiry(300);
      setCanResend(false);
} catch (err) {
  if (err.code === 'ECONNABORTED') {
    alert("Server is taking too long. Please try again.");
  } else {
    alert(err.response?.data?.error || "Connection failed");
  }
} finally {
  setLoading(false);
}
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/resend-otp", { email: formData.email });
      setTimer(30);
      setCanResend(false);
      setOtpExpiry(300); // Reset expiry on resend
    } catch (err) {
      alert("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpExpiry === 0) return alert("OTP Expired. Please resend.");
    setLoading(true);
    try {
      await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/verify-otp", {
        email: formData.email,
        otp: otp,
      });
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 relative overflow-hidden">
        
        {/* Full-Screen Loader Overlay */}
        {(loading || resendLoading) && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-[3rem]">
            <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">
              {resendLoading ? "Resending Code..." : "Syncing with Server..."}
            </p>
          </div>
        )}

        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h2>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Join Attendance.io</p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              {["student", "teacher"].map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${role === r ? "bg-white shadow-md text-indigo-600" : "text-slate-500"}`}>{r}</button>
              ))}
            </div>

            <form onSubmit={handleInitialSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="name" value={formData.name} onChange={handleChange} maxLength={30} placeholder="Full Name" className={`w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none transition-all ${errors.name ? 'border-2 border-red-400' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-4">{errors.name}</p>}
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="University Email" className={`w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none transition-all ${errors.email ? 'border-2 border-red-400' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-4">{errors.email}</p>}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="password" type={showPassword ? "text" : "password"} onChange={handleChange} placeholder="Password" className="w-full pl-12 pr-12 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-4 text-slate-300" size={18} />
                <input name="mobile" value={formData.mobile} onChange={handleChange} maxLength={10} placeholder="Mobile Number" className={`w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none transition-all ${errors.mobile ? 'border-2 border-red-400' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                {errors.mobile && <p className="text-[10px] text-red-500 font-bold mt-1 ml-4">{errors.mobile}</p>}
              </div>

              {role === "student" && (
                <>
                  <div className="relative">
                    <Hash className="absolute left-4 top-4 text-slate-300" size={18} />
                    <input name="regNo" value={formData.regNo} onChange={handleChange} maxLength={15} placeholder="Registration No" className={`w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none transition-all ${errors.regNo ? 'border-2 border-red-400' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                    {errors.regNo && <p className="text-[10px] text-red-500 font-bold mt-1 ml-4">{errors.regNo}</p>}
                  </div>
                  <div className={`md:col-span-2 p-4 rounded-2xl border-2 border-dashed ${errors.photo ? 'bg-red-50 border-red-300' : 'bg-indigo-50 border-indigo-200'}`}>
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white"><ImageIcon size={20}/></div>
                        <span className="text-sm font-bold text-indigo-700">{file ? file.name : "Upload Student ID (MAX 100KB)"}</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const sFile = e.target.files[0];
                        if (sFile && sFile.size > 102400) return alert("Image exceeds 100KB limit!");
                        setFile(sFile);
                      }} />
                    </label>
                  </div>
                </>
              )}

              <div className="md:col-span-2 mt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                   Create {role} Account <ArrowRight size={20}/>
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Verify OTP</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">Valid for: <span className="text-red-500">{Math.floor(otpExpiry / 60)}:{(otpExpiry % 60).toString().padStart(2, '0')}</span></p>
            
            <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto space-y-6">
              <input type="text" maxLength="6" placeholder="000000" className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 text-slate-700" onChange={(e) => setOtp(e.target.value)} required />

              <div className="text-sm font-bold">
                {canResend ? (
                  <button type="button" onClick={handleResendOtp} className="text-indigo-600 hover:underline">Resend OTP</button>
                ) : (
                  <span className="text-slate-400">Resend in <span className="text-indigo-600">{timer}s</span></span>
                )}
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Verify & Login</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;