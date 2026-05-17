const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
// 1. CREATE SUBJECT (Added branch support)
router.post("/add-subject", async (req, res) => {
  try {
    const { subjectName, semester, branch, teacherId } = req.body;
    const newSubject = new Subject({
      subjectName,
      semester,
      branch,
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
    
    // 1. Get ALL attendance for this subject (.lean() converts documents into pure, readable JSON objects)
    const attendances = await Attendance.find({ subjectId }).lean();
    
    // 2. Get unique registration numbers from THESE records only
    const activeRegNos = [...new Set(attendances.map(a => a.studentReg))];

    // 3. Build the response for only these students
    const stats = await Promise.all(activeRegNos.map(async (regNo) => {
      // Using .lean() here too for clean, raw data performance
      const user = await User.findOne({ regNo }).lean(); 
      const myRecords = attendances.filter(a => a.studentReg === regNo);
      
      return {
        regNo: regNo,
        name: user ? user.name : "Unknown",
        attended: myRecords.reduce((sum, r) => sum + (r.count || 0), 0),
        // Now this is a pure JSON array that React/XLSX can easily parse for timestamps
        attendanceRecords: myRecords 
      };
    }));

    // Sort by Reg No
    stats.sort((a, b) => a.regNo.localeCompare(b.regNo));

    res.json(stats);
  } catch (err) {
    console.error("Backend matrix generation error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});
// 4. MANUAL QUANTITY GENERATE CODE
router.post("/generate-code", async (req, res) => {
  try {
    const {subjectId, incrementBy, teacherLat,teacherLng,timeLimit,rangeLimit,} = req.body;

    // 1. Generate the new 6-character code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 2. Handle Dynamic Expiry Logic
    // Converts the user selection (e.g., 2) into a real future timestamp
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
        },
        // Increment the total classes count based on 'Qty' input
        $inc: {
          totalClasses: Number(incrementBy) || 1,
        },
      },
      { new: true, runValidators: true } // runValidators ensures data types are correct
    );

    if (!updatedSubject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // 4. Success Response
    res.json({
      code: newCode,
      updatedSubject,
    });
    
    console.log(`[SUCCESS] New Session: ${updatedSubject.subjectName} | Code: ${newCode} | Range: ${rangeLimit}m | Expires in: ${minutesToAdd}min`);

  } catch (err) {
    console.error("GENERATE ERROR:", err);
    res.status(500).json({ error: "Server failed to generate session code" });
  }
});
// 1. DELETE SUBJECT - This was crashing because of the model error
// server/routes/teacher.js

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

module.exports = router;
