import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users } from 'lucide-react';


const Home = () => {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Soft Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

      <div className="relative z-10">
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-200 rotate-3">
          <ShieldCheck size={48} />
        </div>
        
        <h1 className="text-7xl font-black text-slate-800 tracking-tighter mb-6">
          Attendance<span className="text-indigo-600">.io</span>
        </h1>
        
        <p className="text-slate-500 max-w-lg text-xl font-medium mb-12 leading-relaxed">
          The smart attendance ecosystem designed for <br/> 
          <span className="text-slate-800 font-bold">next-generation universities.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <Link to="/login" className="group px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3">
            <Users size={22} className="group-hover:scale-110 transition-transform" /> Login to Portal
          </Link>
          
          <Link to="/register" className="px-10 py-5 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-black hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center gap-3">
            <GraduationCap size={22} /> Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;