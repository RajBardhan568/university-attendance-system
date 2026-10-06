import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Soft Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

      <div className="relative z-10 w-full max-w-sm mx-auto">
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-200 rotate-3">
          <ShieldCheck size={40} />
        </div>
        
        {/* Responsive text size to prevent cutting */}
        <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight mb-2">
          AMS <span className="text-indigo-600">.</span>
        </h1>
        
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
          Attendance Management System
        </p>

        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
          The smart attendance ecosystem designed for <br/> 
          <span className="text-slate-800 font-bold">next-generation universities.</span>
        </p>
        
        <div className="flex flex-col gap-3 w-full">
          <Link to="/login" className="group w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-xs">
            <Users size={18} className="group-hover:scale-110 transition-transform" /> Login to Portal
          </Link>
          
          <Link to="/register" className="w-full py-4 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-black hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 text-xs">
            <GraduationCap size={18} /> Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;