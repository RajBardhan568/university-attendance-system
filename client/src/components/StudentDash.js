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
  const [loading, setLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
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

    // Start Loader
    setIsMarking(true);

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

          alert("✅ " + res.data.message);
          setInputCode(""); // Clears the code from screen
          fetchMyAttendance(); // Refresh the progress bars
        } catch (err) {
          alert("❌ " + (err.response?.data?.error || "Verification Failed"));
        } finally {
          // Stop Loader
          setIsMarking(false);
        }
      },
      (err) => {
        alert("📍 Please enable Location Services to mark attendance.");
        setIsMarking(false); // Stop loader if location is denied
      },
      { enableHighAccuracy: true, timeout: 5000 }, // Professional addition for accuracy
    );
  };

  // --- 4. PROFILE LOGIC ---
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle temporary image preview when user picks a file
  const handleImageSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 102400) return alert("Photo must be under 100KB");
      setSelectedFile(file); // Store for final save

      // Local preview so the UI looks instant
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  
  // Unified Update for Student (Name + Mobile + Photo)
  const handleProfileUpdate = async () => {
    // 1. Validations
    const nameRegex = /^[A-Za-z\s]+$/;
    if (
      !nameRegex.test(user.name) ||
      user.name.length < 3 ||
      user.name.length > 30
    ) {
      return alert("Name: 3-30 letters only.");
    }
    if (!/^\d{10}$/.test(user.mobile)) {
      return alert("Mobile: Exactly 10 digits.");
    }

    setLoading(true);
    try {
      // 2. Use FormData (Backend expects multipart for students)
      const data = new FormData();
      data.append("name", user.name);
      data.append("mobile", user.mobile);
      if (selectedFile) {
        data.append("profilePhoto", selectedFile);
      }

      const res = await axios.put(
        `https://university-attendance-system-rqyy.onrender.com/api/student/update-profile/${user.regNo}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      // 3. Sync everything
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setIsEditing(false);
      setSelectedFile(null);
      alert("Student Profile Updated!");
    } catch (err) {
      console.error("Student Update Error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Update failed.");
    } finally {
      setLoading(false);
    }
  };
const handleLogout = () => {
  // Pop up a confirmation dialog box
  const isConfirmed = window.confirm("Are you sure you want to logout?");
  
  // If the user clicks "OK", clear data and redirect
  if (isConfirmed) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // If you are using React Router use: navigate("/login");
    window.location.href = "/login"; 
  }
  // If they click "Cancel", nothing happens and they stay logged in
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
  className="flex items-center gap-2 text-sm font-bold text-rose-600 hover:bg-rose-50 p-3 rounded-2xl w-full transition-all"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
  Logout
</button>
          </div>
        </nav>

        {view === "dashboard" ? (
          <div className="animate-in fade-in duration-700">
            {/* MARK ATTENDANCE BOX - Cleaned and Responsive */}
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 mb-12 border-2 border-dashed border-indigo-200 flex flex-col items-center text-center">
              {/* Header Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-black text-indigo-900 flex items-center justify-center gap-3 mb-2">
                  <PlusCircle className="text-indigo-600" size={28} /> Mark
                  Presence
                </h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  Enter the 6-digit session code shared by your teacher
                </p>
              </div>

              {/* Input & Button Container - Now stacked vertically */}
              <div className="w-full max-w-md space-y-4">
                <div className="relative">
                  <input
                    className="w-full text-center tracking-[0.6em] text-3xl font-black py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-indigo-500 focus:bg-white transition-all text-indigo-600 placeholder:text-slate-200"
                    placeholder="XXXXXX"
                    maxLength={6}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  />
                </div>

                {/* Submit Button - Positioned clearly below */}
                <button
                  disabled={isMarking}
                  onClick={markAttendance}
                  className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 
        ${isMarking ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                >
                  {isMarking ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying Presence...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} />
                      <span>Submit Attendance</span>
                    </>
                  )}
                </button>
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
          <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 text-center animate-in zoom-in duration-500">
            <div className="relative w-36 h-36 mx-auto mb-8">
              <div className="w-full h-full bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-5xl font-black overflow-hidden border-4 border-white shadow-xl">
                {uploading ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                ) : user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name?.charAt(0)
                )}
              </div>
              <input
                type="file"
                id="profilePic"
                className="hidden"
                onChange={handleImageSelection}
                accept="image/*"
              />
              <label
                htmlFor="profilePic"
                className="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl shadow-lg text-white hover:scale-110 transition-transform cursor-pointer border-4 border-white"
              >
                <Camera size={20} />
              </label>
            </div>

            <div className="space-y-6 text-center">
              {isEditing ? (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
                      Full Name (Letters Only)
                    </label>
                    <input
                      className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none ring-2 ring-indigo-500 font-bold"
                      value={user.name}
                      maxLength={30}
                      onInput={(e) =>
                        (e.target.value = e.target.value.replace(
                          /[^A-Za-z\s]/g,
                          "",
                        ))
                      }
                      onChange={(e) =>
                        setUser({ ...user, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
                      Mobile Number
                    </label>
                    <input
                      className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none ring-2 ring-indigo-500 font-bold"
                      value={user.mobile}
                      maxLength={10}
                      onInput={(e) =>
                        (e.target.value = e.target.value.replace(/\D/g, ""))
                      }
                      onChange={(e) =>
                        setUser({ ...user, mobile: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleProfileUpdate}
                      className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <Save size={20} /> Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 truncate px-4">
                      {user.name}
                    </h2>
                    <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                      Reg No: {regNo}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[2rem] text-left space-y-5 border border-slate-100 overflow-hidden">
                    <div className="flex justify-between items-center gap-4">

                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest shrink-0">
                        Email Address
                      </span>
                      <span className="font-black text-slate-500 italic text-sm truncate">
                        {user.email}
                      </span>
                    </div>
                     <div className="flex justify-between items-center gap-4">
                      
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest shrink-0">
                        Branch
                      </span>
                      <span className="font-black text-slate-500 italic text-sm truncate">
                        {user.branch || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Mobile
                      </span>
                      <span className="font-black text-slate-800">
                        {user.mobile || "Not Provided"}
                      </span>
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

              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest pt-4">
                Administrative records are managed by the faculty.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDash;
