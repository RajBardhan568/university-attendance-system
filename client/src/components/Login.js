import React, { useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // const res = await axios.post("http://localhost:5000/api/auth/login",
        const res = await axios.post("https://university-attendance-system-rqyy.onrender.com/api/auth/login"
        
        ,
        
        {
        email: formData.email,
        password: formData.password,
      });
      
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // Use window.location for a hard refresh to ensure App.js sees the new user
      window.location.href = "/dashboard";
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Account not verified. Redirecting to verification...");
        navigate("/verify-account", { state: { email: formData.email } });
      } else {
        alert(err.response?.data?.error || "Login failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-10 relative overflow-hidden">
        
        {/* Decorative Element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-200">
            <LayoutDashboard size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-widest">
            Portal Access Required
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-4 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
                placeholder="name@university.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center ml-4 mb-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-indigo-600 hover:underline text-[10px] font-bold"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Sign In to Dashboard <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 font-bold text-sm">
            Not registered yet?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;