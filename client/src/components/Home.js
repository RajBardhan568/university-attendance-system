import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users, Sparkles, Zap, Lock } from 'lucide-react';

const Home = () => {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-between p-6 text-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

      {/* Top Badge */}
      <div className="relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-wider shadow-sm">
          <Sparkles size={12} className="animate-spin" /> Next-Gen AMS Portal
        </div>
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 w-full max-w-sm mx-auto my-auto py-4">
        
        {/* Animated Icon Container */}
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 rounded-[2.2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200 transform hover:rotate-6 transition-transform duration-300">
          <ShieldCheck size={40} />
        </div>
        
        {/* App Name */}
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-1">
          AMS <span className="text-indigo-600">.</span>
        </h1>
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">
          Attendance Management System
        </p>

        {/* Tagline */}
        <p className="text-slate-600 text-xs sm:text-sm font-medium mb-8 leading-relaxed px-2">
          The smart attendance ecosystem designed for <span className="text-slate-900 font-bold">seamless attendance tracking.</span>
        </p>

        {/* Feature Highlights Pills */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 shadow-sm">
            <Zap size={12} className="text-amber-500" /> Fast Sync
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 shadow-sm">
            <Lock size={12} className="text-indigo-500" /> Secure JWT
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link 
            to="/login" 
            className="group w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 text-xs tracking-wider uppercase"
          >
            <Users size={18} className="group-hover:scale-110 transition-transform" /> Login to Portal
          </Link>
          
          <Link 
            to="/register" 
            className="w-full py-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 rounded-2xl font-black transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 text-xs tracking-wider uppercase shadow-sm"
          >
            <GraduationCap size={18} className="text-indigo-600" /> Create Account
          </Link>
        </div>

      </div>

      {/* Footer Info */}
      <div className="relative z-10 pb-2">
        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
          Optimized for Web & Mobile App
        </p>
      </div>

    </div>
  );
};

export default Home;