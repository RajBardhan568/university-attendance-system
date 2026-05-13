import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx"; // Import this at the top
import {
  Trash2,
  Download,
  Plus,
  Hash,
  BookOpen,
  Search,
  User,
  LayoutDashboard,
  LogOut,
  Edit3,
  Save,
  X,
} from "lucide-react";

const Timer = ({ expiresAt }) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const remaining = Math.floor((expiryTime - now) / 1000);
      setSecondsLeft(remaining > 0 ? remaining : 0);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]); // This ensures the timer restarts when a new code is generated

  if (secondsLeft <= 0)
    return (
      <span className="text-red-500 font-bold text-xs uppercase">Expired</span>
    );

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  return (
    <span className="text-emerald-500 font-mono font-bold text-sm">
      Valid: {mins}:{secs < 10 ? "0" : ""}
      {secs}
    </span>
  );
};

const TeacherDash = ({ teacherId }) => {
  const [view, setView] = useState("dashboard");
  const [subjects, setSubjects] = useState([]);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    branch: "",
    sem: "",
  });
  const [manualIncrements, setManualIncrements] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {},
  );
  const [todayCounts, setTodayCounts] = useState({});
  const [selectedRange, setSelectedRange] = useState({});
  const [selectedTime, setSelectedTime] = useState({});
  const fetchSessionCount = async (subjectId) => {
    try {
      // Updated URL to match the new session-count route
      const res = await axios.get(
        `https://university-attendance-system-rqyy.onrender.com/api/teacher/session-count/${subjectId}`,
      );
      setTodayCounts((prev) => ({ ...prev, [subjectId]: res.data.count }));
    } catch (err) {
      console.error("Error fetching session count:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(
        `https://university-attendance-system-rqyy.onrender.com/api/teacher/my-subjects/${teacherId}`,
      );
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();

    const interval = setInterval(() => {
      // Change fetchTodayCount to fetchSessionCount here
      subjects.forEach((sub) => fetchSessionCount(sub._id));
    }, 10000);

    return () => clearInterval(interval);
  }, [teacherId, subjects.length]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await axios.get(
        `https://university-attendance-system-rqyy.onrender.com/api/teacher/search-student/${searchQuery}`,
        
      );
      setSearchResult(res.data);
    } catch (err) {
      alert("Student Not Found");
      setSearchResult(null);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Assuming you have an update route: /api/auth/update
      await axios.put(`https://university-attendance-system-rqyy.onrender.com/api/auth/update/${user._id}`, user);
      localStorage.setItem("user", JSON.stringify(user));
      setIsEditing(false);
      alert("Profile Updated Successfully!");
    } catch (err) {
      alert("Update failed");
    }
  };

  const addSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://university-attendance-system-rqyy.onrender.com/api/teacher/add-subject",
        {
          subjectName: subjectForm.name,
          semester: subjectForm.sem,
          branch: subjectForm.branch,
          teacherId,
        },
      );
      setSubjects([...subjects, res.data]);
      setSubjectForm({ name: "", branch: "", sem: "" });
    } catch (err) {
      alert("Error adding subject");
    }
  };

  const generateCode = async (subjectId) => {
    // Use the values from state, or the default if they don't exist yet
    const count = manualIncrements[subjectId] || 1;
    const range = selectedRange[subjectId] || 20;
    const time = selectedTime[subjectId] || 5;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await axios.post(
          "https://university-attendance-system-rqyy.onrender.com/api/teacher/generate-code",
          {
            subjectId,
            incrementBy: Number(count),
            teacherLat: pos.coords.latitude,
            teacherLng: pos.coords.longitude,
            timeLimit: Number(time), // Ensure this is a Number
            rangeLimit: Number(range), // Ensure this is a Number
          },
        );

        setSubjects(
          subjects.map((s) =>
            s._id === subjectId ? res.data.updatedSubject : s,
          ),
        );

        fetchSessionCount(subjectId);
      } catch (err) {
        console.error("Generate error:", err);
      }
    });
  };

  const downloadReport = async (subject, format) => {
    try {
      const res = await axios.get(
        `https://university-attendance-system-rqyy.onrender.com/api/teacher/subject-stats/${subject._id}`
        
        
        ,
      );
      const data = res.data;

      if (format === "pdf") {
        const doc = new jsPDF();
        doc
          .setFontSize(22)
          .setTextColor(79, 70, 229)
          .setFont("helvetica", "bold")
          .text("ATTENDANCE REPORT", 14, 22);
        doc.setFontSize(11).setTextColor(80).setFont("helvetica", "normal");
        doc.text(`Faculty: ${user.name}`, 14, 35);
        doc.text(
          `Subject: ${subject.subjectName} | Sem: ${subject.semester}`,
          14,
          42,
        );
        doc.text(`Total Classes: ${subject.totalClasses}`, 14, 49);

        autoTable(doc, {
          startY: 55,
          head: [["Reg No", "Name", "Obtained", "Total", "%", "Status"]],
          body: data.map((s) => {
            const pct = (s.attended / subject.totalClasses) * 100;
            return [
              s.regNo,
              s.name,
              s.attended,
              subject.totalClasses,
              `${pct.toFixed(1)}%`,
              pct >= 75 ? "OK" : "SHORTAGE",
            ];
          }),
          headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save(`${subject.subjectName}_Report.pdf`);
      } else if (format === "xlsx") {
        // Prepare data specifically for Excel
        const excelData = data.map((s) => {
          const pct = (s.attended / subject.totalClasses) * 100;
          return {
            "Registration No": s.regNo,
            "Student Name": s.name,
            "Classes Attended": s.attended,
            "Total Classes": subject.totalClasses,
            Percentage: `${pct.toFixed(1)}%`,
            Status: pct >= 75 ? "OK" : "SHORTAGE",
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        // Auto-size columns for better look
        const maxWidth = excelData.reduce(
          (w, r) => Math.max(w, r["Student Name"].length),
          10,
        );
        worksheet["!cols"] = [
          { wch: 15 },
          { wch: maxWidth + 5 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
        ];

        XLSX.writeFile(workbook, `${subject.subjectName}_Attendance.xlsx`);
      }
    } catch (error) {
      console.error(error);
      alert("Error downloading report");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* NAV - Fully Responsive */}
        <nav className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-900">Attendance.io</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-8 font-bold text-sm">
            <button
              onClick={() => setView("dashboard")}
              className={
                view === "dashboard" ? "text-indigo-600" : "text-slate-400"
              }
            >
              Dashboard
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
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="text-red-500 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </nav>

        {view === "dashboard" ? (
          <div className="space-y-8">
            {/* SEARCH - Full Width on mobile */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Student Registration Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                Find Student
              </button>
            </div>

            {searchResult && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-indigo-50 mb-10 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10"></div>

                <button
                  onClick={() => setSearchResult(null)}
                  className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Student Photo Placeholder */}
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                    {searchResult.profilePic ? (
                      <img
                        src={searchResult.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-slate-300" />
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 mb-1">
                      {searchResult.name}
                    </h3>
                    <p className="text-indigo-600 font-bold tracking-widest text-sm uppercase mb-6">
                      Student Information
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                          Registration Number
                        </p>
                        <p className="font-bold text-slate-700">
                          {searchResult.regNo}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                          Mobile Number
                        </p>
                        <p className="font-bold text-slate-700">
                          {searchResult.mobile || "Not Provided"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                          Email Address
                        </p>
                        <p className="font-bold text-slate-700">
                          {searchResult.email}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                          Department
                        </p>
                        <p className="font-bold text-slate-700">
                          {searchResult.branch || "CSE"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* FORM - Spans 4 cols */}
              <div className="lg:col-span-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-10">
                  <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-600" /> New Subject
                  </h2>
                  <form onSubmit={addSubject} className="space-y-4">
                    <input
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Subject Name"
                      value={subjectForm.name}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, name: e.target.value })
                      }
                      required
                    />
                    <input
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Branch"
                      value={subjectForm.branch}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          branch: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Semester"
                      value={subjectForm.sem}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, sem: e.target.value })
                      }
                      required
                    />
                    <button className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-100">
                      Add Subject
                    </button>
                  </form>
                </div>
              </div>

              {/* CARDS - Spans 8 cols, Responsive grid inside */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((sub) => (
                  <div
                    key={sub._id}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                        <BookOpen size={20} />
                      </div>
                      {/* delete logic */}
                      <button
                        onClick={async () => {
                          if (window.confirm("Delete this subject?")) {
                            try {
                              await axios.delete(
                                `https://university-attendance-system-rqyy.onrender.com/api/teacher/delete-subject/${sub._id}`,
                              );
                              setSubjects(
                                subjects.filter((s) => s._id !== sub._id),
                              );
                            } catch (err) {
                              alert("Delete failed");
                            }
                          }
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h3 className="text-xl font-black text-slate-800">
                      {sub.subjectName}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mb-4">
                      {sub.branch} • Sem {sub.semester}
                    </p>
                    <div className="bg-slate-50 p-4 rounded-3xl text-center mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Active Code
                      </p>
                      <p className="text-3xl font-black text-indigo-600">
                        {sub.activeCode || "---"}
                      </p>
                      {/* REAL-TIME ATTENDANCE COUNTERS */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                            Total Held
                          </p>
                          <p className="text-xl font-black text-slate-700">
                            {sub.totalClasses}
                          </p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center relative">
                          <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </span>
                          <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">
                            Marked Today
                          </p>
                          <p className="text-xl font-black text-indigo-600">
                            {todayCounts[sub._id] || 0}
                          </p>
                        </div>
                      </div>
                      {sub.activeCode && (
                        <Timer expiresAt={sub.codeExpiresAt} />
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        placeholder="Qty"
                        className="w-16 bg-slate-50 rounded-xl text-center font-bold"
                        value={manualIncrements[sub._id] || ""}
                        onChange={(e) =>
                          setManualIncrements({
                            ...manualIncrements,
                            [sub._id]: e.target.value,
                          })
                        }
                      />
                      {/* TIME DROPDOWN */}
                      <select
                        className="bg-slate-50 p-2 rounded-xl text-[10px] font-bold border border-slate-100 outline-none"
                        // 1. Link to state
                        value={selectedTime[sub._id] || "5"}
                        // 2. Update state when changed
                        onChange={(e) =>
                          setSelectedTime({
                            ...selectedTime,
                            [sub._id]: e.target.value,
                          })
                        }
                      >
                        <option value="2">2 min</option>
                        <option value="5">5 min</option>
                        <option value="10">10 min</option>
                      </select>

                      {/* RANGE DROPDOWN */}
                      <select
                        className="bg-slate-50 p-2 rounded-xl text-[10px] font-bold border border-slate-100 outline-none"
                        // 1. Link to state
                        value={selectedRange[sub._id] || "20"}
                        // 2. Update state when changed
                        onChange={(e) =>
                          setSelectedRange({
                            ...selectedRange,
                            [sub._id]: e.target.value,
                          })
                        }
                      >
                        <option value="10">10m</option>
                        <option value="20">20m</option>
                        <option value="50">50m</option>
                      </select>

                      <button
                        onClick={() => generateCode(sub._id)}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold"
                      >
                        Generate
                      </button>
                    </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {subjects.map((subject) => (
    <div key={subject._id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
      {/* ... Subject Name and Code Display ... */}

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Export Data</p>
        <div className="flex gap-3">
          <button 
            onClick={() => downloadReport(subject, 'pdf')}
            className="flex-1 bg-indigo-600/10 text-indigo-600 py-3 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Download PDF
          </button>
          <button 
            onClick={() => downloadReport(subject, 'xlsx')}
            className="flex-1 bg-emerald-600/10 text-emerald-600 py-3 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Download Excel
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* PROFILE - Responsive layout with Edit */
          <div className="max-w-xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-5xl font-black">
                {user.name?.charAt(0)}
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg text-indigo-600 border border-slate-100"
              >
                {isEditing ? <X size={20} /> : <Edit3 size={20} />}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-black text-slate-400 ml-2">
                    FULL NAME
                  </label>
                  <input
                    className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none ring-2 ring-indigo-500"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 ml-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                    className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none ring-2 ring-indigo-500"
                    value={user.email}
                    onChange={(e) =>
                      setUser({ ...user, email: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={handleUpdateProfile}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900">
                  {user.name}
                </h2>
                <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">
                  Faculty ID: {teacherId}
                </p>
                <div className="bg-slate-50 p-6 rounded-3xl text-left space-y-4 mt-8">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Email</span>
                    <span className="font-black text-slate-700">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Subjects</span>
                    <span className="font-black text-slate-700">
                      {subjects.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDash;
