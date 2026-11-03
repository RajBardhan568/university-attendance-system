const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Session = require('../models/Session');
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

// 1. CREATE SUBJECT (Added branch support)
router.post("/add-subject", async (req, res) => {
  try {
    const { subjectName, semester, branch, session, teacherId } = req.body;
    const newSubject = new Subject({
      subjectName,
      semester,
      branch,
      session,
      teacherId,
    });
    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (err) {
    console.error("Add Subject Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. PERSISTENCE: GET SUBJECTS
router.get("/my-subjects/:teacherId", async (req, res) => {
  try {
    const subjects = await Subject.find({ teacherId: req.params.teacherId });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// 2. DOWNLOAD DATA - Matrix Layout fixing the hidden Mongoose properties issue

router.get("/subject-stats/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // 1. Get ALL attendance marks for this subject
    const attendances = await Attendance.find({ subjectId }).lean();
    
    // 2. Get ALL sessions (generated codes) held for this subject
    const sessions = await Session.find({ subjectId }).lean();
    
    // 3. Only get active student users who have marked at least once for this subject
    const activeRegNos = [...new Set(attendances.map(a => a.studentReg))];

    const stats = await Promise.all(activeRegNos.map(async (regNo) => {
      const user = await User.findOne({ regNo }).lean();
      const studentRecords = attendances.filter(a => a.studentReg === regNo);
      
      return {
        regNo: regNo,
        name: user ? user.name : "Unknown",
        attended: studentRecords.reduce((sum, r) => sum + (r.count || 0), 0),
        attendanceRecords: studentRecords, // Student history links here
      };
    }));

    stats.sort((a, b) => a.regNo.localeCompare(b.regNo));

    // Send both stats and the global session history to the frontend
    res.json({ stats, sessions });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});
// 4. MANUAL QUANTITY GENERATE CODE
// 4. MANUAL QUANTITY GENERATE CODE
router.post("/generate-code", async (req, res) => {
  try {
    const { subjectId, incrementBy, teacherLat, teacherLng, timeLimit, rangeLimit } = req.body;

    // 1. Generate the new 6-character code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 2. Handle Dynamic Expiry Logic
    const minutesToAdd = Number(timeLimit) || 5;
    const expiryDate = new Date(Date.now() + minutesToAdd * 60 * 1000);

    // 3. Update Subject with both Session & Security data
    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      {
        $set: {
          activeCode: newCode,
          codeCreatedAt: new Date(),
          codeExpiresAt: expiryDate,
          lastIncrement: Number(incrementBy) || 1,
          teacherLat: Number(teacherLat),
          teacherLng: Number(teacherLng),
          rangeLimit: Number(rangeLimit) || 20,
          timeLimit: Number(timeLimit) || 5,
        },
        // Increment the total classes count based on 'Qty' input
        $inc: {
          totalClasses: Number(incrementBy) || 1,
        },
      },
      { new: true, runValidators: true } 
    );

    if (!updatedSubject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // ==========================================
    // NEW ADDITION: Save the instance as an absolute session track
    // This logs the class session right here, even if 0 students sign in!
    // ==========================================
    const Session = require("../models/Session"); // Import your Session model
    const newSession = new Session({
      subjectId: subjectId,
      code: newCode,
      createdAt: new Date(),
      weight: Number(incrementBy) || 1 // Stores if it was a single or double class entry
    });
    await newSession.save();
    // ==========================================

    // 4. Success Response
    res.json({
      code: newCode,
      updatedSubject,
    });
    
    console.log(`[SUCCESS] New Session Saved to DB: ${updatedSubject.subjectName} | Code: ${newCode} | Range: ${rangeLimit}m | Expires in: ${minutesToAdd}min`);

  } catch (err) {
    console.error("GENERATE ERROR:", err);
    res.status(500).json({ error: "Server failed to generate session code" });
  }
});

// ROUTE: Delete a subject and its associated attendance
router.delete("/delete-subject/:id", async (req, res) => {
  try {
    const subjectId = req.params.id;

    // 1. Delete the subject itself
    const deletedSubject = await Subject.findByIdAndDelete(subjectId);

    if (!deletedSubject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // 2. Clean up: Delete all attendance records linked to this subject
    await Attendance.deleteMany({ subjectId: subjectId });

    res.json({
      message: "Subject and attendance records deleted successfully",
    });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Server error during deletion" });
  }
});

router.get("/search-student/:regNo", async (req, res) => {
  try {
    const student = await User.findOne({
      regNo: req.params.regNo,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      name: student.name,
      regNo: student.regNo,
      email: student.email,
      mobile: student.mobile, // Fixed case sensitivity (was Mobile)
      profilePic: student.profilePhoto, // Fixed mapping (was profilePic)
      branch: student.branch || "CSE",
    });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Add this to your teacher routes
router.get("/session-count/:subjectId", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);

    if (!subject || !subject.activeCode) {
      return res.json({ count: 0 });
    }

    // Use .toString() to ensure we are matching exact characters
    const currentCode = subject.activeCode.toString().trim();

    const count = await Attendance.countDocuments({
      subjectId: req.params.subjectId,
      code: currentCode, // Matches the exact string
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Counter failed" });
  }
});

// Teachers can ONLY update Name and Mobile (No 'upload' middleware needed)
router.put('/update-profile/:id', async (req, res) => {
    try {
        const { name, mobile } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { name, mobile } },
            { new: true }
        );
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Teacher update failed" });
    }
});


// ROUTE: Delete Teacher Account
const teacherDeleteOtpStore = new Map();

// 1. Send OTP for Teacher Account Deletion
router.post("/send-delete-otp", async (req, res) => {
  try {
    const { teacherId, email } = req.body;
    const teacher = await User.findOne(
      teacherId ? { _id: teacherId, role: "teacher" } : { email, role: "teacher" }
    );
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    teacherDeleteOtpStore.set(teacher.email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail(
      teacher.email,
      "AMS Teacher Account Deletion OTP",
      `Your OTP to permanently delete your AMS teacher account is: ${otp}. Valid for 5 minutes.`
    );

    res.status(200).json({ message: "OTP sent to your registered email." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

// 2. Verify (Password OR OTP) & Execute Teacher Account Deletion
router.post("/delete-account", async (req, res) => {
  try {
    const { teacherId, email, method, password, otp } = req.body;
    const teacher = await User.findOne(
      teacherId ? { _id: teacherId, role: "teacher" } : { email, role: "teacher" }
    );
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });

    if (method === "password") {
      if (!password) return res.status(400).json({ error: "Password required." });
      const isMatch = await bcrypt.compare(password, teacher.password);
      if (!isMatch) return res.status(401).json({ error: "Incorrect password." });
    } else if (method === "otp") {
      const record = teacherDeleteOtpStore.get(teacher.email);
      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return res.status(401).json({ error: "Invalid or expired OTP." });
      }
      teacherDeleteOtpStore.delete(teacher.email);
    } else {
      return res.status(400).json({ error: "Invalid verification method." });
    }

    await Subject.deleteMany({ teacherId: teacher._id });
    await Session.deleteMany({ teacherId: teacher._id });
    await User.findByIdAndDelete(teacher._id);

    res.status(200).json({ message: "Teacher account deleted permanently." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete teacher account." });
  }
});


const mongoose = require('mongoose');

// 1. AUTO-SUGGESTIONS ROUTE (Handles both ObjectId and String subjectId)
router.get('/student-suggestions/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { query } = req.query;

    if (!query) return res.json([]);

    const teacherSubjects = await Subject.find({ teacherId }).select('_id');
    
    // ObjectId aur String dono formats bana lein
    const subjectObjectIds = teacherSubjects.map(sub => sub._id);
    const subjectStringIds = teacherSubjects.map(sub => sub._id.toString());

    // Raw collection query taaki Mongoose type-casting kisi record ko drop na kare
    const attendanceDocs = await Attendance.collection.find({
      subjectId: { $in: [...subjectObjectIds, ...subjectStringIds] }
    }).toArray();

    const attendedRegNos = [
      ...new Set(
        attendanceDocs.map(doc => (doc.studentReg || doc.regNo || "").trim()).filter(Boolean)
      )
    ];

    const suggestions = await User.find({
      role: 'student',
      regNo: { 
        $in: attendedRegNos, 
        $regex: query.trim(), 
        $options: 'i' 
      }
    }).select('name regNo branch profilePhoto').limit(6);

    res.json(suggestions);
  } catch (err) {
    console.error("Suggestion Error:", err);
    res.status(500).json({ error: "Failed to fetch student suggestions." });
  }
});

// 2. STRICT SEARCH STUDENT ROUTE (With Deep Diagnostic Logs & Raw Matching)
router.get('/search-student/:teacherId/:regNo', async (req, res) => {
  try {
    const { teacherId, regNo } = req.params;
    const cleanRegNo = regNo.trim();

    // Step A: Teacher ke subjects nikaalein
    const teacherSubjects = await Subject.find({ teacherId }).select('_id subjectName');
    const subjectObjectIds = teacherSubjects.map(sub => sub._id);
    const subjectStringIds = teacherSubjects.map(sub => sub._id.toString());

    // Step B: Pehle check karein ki is student ka Attendance table me KOI BHI record hai ya nahi
    const allStudentAttendance = await Attendance.collection.find({
      $or: [
        { studentReg: { $regex: new RegExp(`^\\s*${cleanRegNo}\\s*$`, 'i') } },
        { regNo: { $regex: new RegExp(`^\\s*${cleanRegNo}\\s*$`, 'i') } }
      ]
    }).toArray();

    console.log(`=== DEEP DEBUG FOR ${cleanRegNo} ===`);
    console.log("Teacher Current Subject IDs:", subjectStringIds);
    console.log("Total Attendance Docs for Student in DB (Any Subject):", allStudentAttendance.length);
    if (allStudentAttendance.length > 0) {
      console.log("Sample Student Attendance Doc:", JSON.stringify(allStudentAttendance[0]));
    }

    // Step C: Ab check karein ki unme se kitne records is teacher ke current subjects se match karte hain
    const matchedRecords = allStudentAttendance.filter(doc => {
      const docSubId = doc.subjectId ? doc.subjectId.toString() : "";
      return subjectStringIds.includes(docSubId);
    });

    console.log("Matched Records with Teacher's Subjects:", matchedRecords.length);

    if (matchedRecords.length === 0) {
      // Agar student ne attendance lagayi thi par wo subject delete ho chuka hai ya dusre teacher ka hai
      const reasonDetails = allStudentAttendance.length > 0
        ? `Student (Reg. No: ${cleanRegNo}) has ${allStudentAttendance.length} attendance record(s) in the database, but none belong to your currently active subjects (Subject IDs might be from a deleted subject).`
        : `Student (Reg. No: ${cleanRegNo}) has not marked attendance in any subject yet.`;

      return res.status(404).json({ 
        error: "No Attendance Record Found",
        details: reasonDetails
      });
    }

    // Step D: Total classes count calculate karein
    const totalAttendedClasses = matchedRecords.reduce(
      (sum, record) => sum + (Number(record.count) || 1), 
      0
    );

    // Step E: Student profile fetch karein
    const student = await User.findOne({ 
      regNo: { $regex: new RegExp(`^\\s*${cleanRegNo}\\s*$`, 'i') }, 
      role: 'student' 
    });

    if (!student) {
      return res.status(404).json({ 
        error: "Student Profile Not Found",
        details: "Attendance record exists, but no matching student profile was found."
      });
    }

    res.json({
      student,
      attendanceCount: totalAttendedClasses,
      records: matchedRecords
    });
  } catch (err) {
    console.error("Search Route Error:", err);
    res.status(500).json({ error: "Unable to retrieve student records at this time." });
  }
});

module.exports = router;
