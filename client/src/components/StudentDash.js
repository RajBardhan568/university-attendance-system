import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle,
  AlertCircle,
  PlusCircle,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Edit3,
  Save,
  X,
  Camera,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

const StudentDash = () => {
  // --- 1. STATES ---
  const [view, setView] = useState("dashboard"); // dashboard or profile
  const [attendanceData, setAttendanceData] = useState([]);
  const [inputCode, setInputCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // User State
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {},
  );
  const regNo = user?.regNo;

  // --- 2. DATA FETCHING ---
  const fetchMyAttendance = async () => {
    if (!regNo) return;
    try {
      const res = await axios.get(
        `https://university-attendance-system-rqyy.onrender.com/api/student/my-stats/${regNo}`,
      );
      setAttendanceData(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [regNo]);

  // --- 3. ATTENDANCE LOGIC ---
  const markAttendance = async () => {
    if (!inputCode) return alert("Please enter a code");
    const fingerprint = btoa(
      navigator.userAgent + navigator.languages + window.screen.width,
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.post(
            "https://university-attendance-system-rqyy.onrender.com/api/student/mark-attendance",
            {
              regNo,
              code: inputCode.trim().toUpperCase(),
              deviceId: fingerprint,
              lat: latitude,
              lng: longitude,
            },
          );
          alert(res.data.message);
          setInputCode("");
          fetchMyAttendance();
        } catch (err) {
          alert(err.response?.data?.error || "Verification Failed");
        }
      },
      (err) => alert("Please enable Location Services."),
    );
  };

  // --- 4. PROFILE LOGIC ---
  // Inside StudentDash.jsx

  // 1. FIXED IMAGE UPLOAD
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_preset"); // Ensure this is correct in Cloudinary

    try {
      // Upload to Cloudinary
      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/dtunifmss/image/upload`,
        formData,
      );
      const imageUrl = cloudRes.data.secure_url;

      // NEW: Save the URL to MongoDB immediately
      const dbRes = await axios.put(
          // `http://localhost:5000/api/student/update-profile/${regNo}`,
          `https://university-attendance-system-rqyy.onrender.com/api/student/update-profile/${regNo}`,
        {
          ...user,
          profilePhoto: imageUrl,
        },
      );

      // Update Local State & Storage
      setUser(dbRes.data.user);
      localStorage.setItem("user", JSON.stringify(dbRes.data.user));
      alert("Photo updated in database!");
    } catch (err) {
      alert("Upload failed. Check console.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // 2. FIXED PROFILE TEXT UPDATE
const handleProfileUpdate = async () => {
    try {
        const res = await axios.put(`https://university-attendance-system-rqyy.onrender.com/api/student/update-profile/${regNo}`
          , {
            name: user.name,
            mobile: user.mobile,
            profilePhoto: user.profilePhoto
        });

        // Update local state and storage with the fresh data from DB
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        setIsEditing(false);
        alert(res.data.message);
    } catch (err) {
        console.error(err);
        alert("Update failed. Make sure the server is running.");
    }
};

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="p-4 md:p-10 bg-[#f8fafc] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* NAVIGATION BAR */}
        <nav className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Student Portal
            </h1>
          </div>
          <div className="flex items-center gap-6 font-bold text-sm">
            <button
              onClick={() => setView("dashboard")}
              className={
                view === "dashboard" ? "text-indigo-600" : "text-slate-400"
              }
            >
              Attendance
            </button>
            <button
              onClick={() => setView("profile")}
              className={
                view === "profile" ? "text-indigo-600" : "text-slate-400"
              }
            >
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="text-red-500 bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-100 transition-all"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </nav>

        {view === "dashboard" ? (
          <div className="animate-in fade-in duration-700">
            {/* MARK ATTENDANCE BOX */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-12 border-2 border-dashed border-indigo-200 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-indigo-900 flex items-center justify-center md:justify-start gap-2 mb-1">
                  <PlusCircle className="text-indigo-600" /> Mark Presence
                </h3>
                <p className="text-slate-400 text-sm font-medium italic">
                  Enter 6-digit code shared in class
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-12 border-2 border-dashed border-indigo-200 flex flex-col md:flex-row items-center gap-6 w-full">
              <div className="flex w-full md:w-auto gap-3">
                <input
                  className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                  placeholder="XXXXXX"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={markAttendance}
                 className="w-full md:w-1/3 bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                  <ShieldCheck size={20} /> Submit
                </button>
              </div>
            </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <BookOpen className="text-indigo-600" /> Your Academic Records
            </h2>

            {/* SUBJECT CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {attendanceData.map((item) => {
                const total = item.totalHeld || 0;
                const attended = item.attended || 0;
                const percentage =
                  total > 0 ? ((attended / total) * 100).toFixed(1) : "0.0";

                let statusColor =
                  percentage < 60
                    ? "text-red-600"
                    : percentage < 75
                      ? "text-amber-500"
                      : "text-emerald-600";
                let barColor =
                  percentage < 60
                    ? "bg-red-500"
                    : percentage < 75
                      ? "bg-amber-400"
                      : "bg-emerald-500";

                return (
                  <div
                    key={item.subjectId}
                    className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                          {item.subjectName}
                        </h2>
                        {/* ADDED SEMESTER HERE */}
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            Sem {item.semester || "N/A"}
                          </span>
                          <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            {item.branch}
                          </span>
                        </div>
                      </div>
                      {percentage < 75 && (
                        <AlertCircle
                          size={22}
                          className="text-amber-500 animate-pulse"
                        />
                      )}
                    </div>

                    <div className="flex items-end gap-2 mb-3">
                      <div className={`text-4xl font-black ${statusColor}`}>
                        {percentage}%
                      </div>
                    </div>

                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden mb-6 border border-slate-100">
                      <div
                        className={`h-full transition-all duration-1000 ${barColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-50">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          Attended
                        </p>
                        <p className="font-black text-slate-700">{attended}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          Total Held
                        </p>
                        <p className="font-black text-slate-700">{total}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* PROFILE VIEW */
       /* PROFILE VIEW */
<div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 text-center animate-in zoom-in duration-500">
    <div className="relative w-36 h-36 mx-auto mb-8">
        <div className="w-full h-full bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-5xl font-black overflow-hidden border-4 border-white shadow-xl">
            {uploading ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            ) : user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                user.name?.charAt(0)
            )}
        </div>
        {/* Hidden File Input for Photo */}
        <input type="file" id="profilePic" className="hidden" onChange={handleImageUpload} accept="image/*" />
        <label htmlFor="profilePic" className="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl shadow-lg text-white hover:scale-110 transition-transform cursor-pointer border-4 border-white">
            <Camera size={20} />
        </label>
    </div>

    <div className="space-y-6 text-center">
        {isEditing ? (
            <div className="space-y-4 text-left">
                <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Full Name</label>
                    <input 
                        className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none ring-2 ring-indigo-500 font-bold" 
                        value={user.name} 
                        onChange={e => setUser({...user, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Mobile Number</label>
                    <input 
                        className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none ring-2 ring-indigo-500 font-bold" 
                        value={user.mobile} 
                        onChange={e => setUser({...user, mobile: e.target.value})}
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={handleProfileUpdate} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                        <Save size={20} /> Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-6 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold">
                        Cancel
                    </button>
                </div>
            </div>
        ) : (
            <>
                <div>
                    <h2 className="text-3xl font-black text-slate-900">{user.name}</h2>
                    <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Reg No: {regNo}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] text-left space-y-5 border border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Email Address</span>
                        <span className="font-black text-slate-500 italic text-sm">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Mobile</span>
                        <span className="font-black text-slate-800">{user.mobile || "Not Provided"}</span>
                    </div>
                </div>

                <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 text-indigo-600 font-bold bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-all"
                >
                    <Edit3 size={18} /> Edit Profile Details
                </button>
            </>
        )}
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest pt-4">Administrative records are managed by the faculty.</p>
    </div>
</div>
        )}
      </div>
    </div>
  );
};

export default StudentDash;
