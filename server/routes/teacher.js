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

// 2. DOWNLOAD DATA - Uses the number of records to show 'Obtained' classes
router.get("/subject-stats/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // 1. Get all attendance for this subject
    const attendances = await Attendance.find({ subjectId });
    
    // 2. Get all students enrolled (or just all students)
    const students = await User.find({ role: 'student' });

    const stats = students.map(student => {
      // Find all records matching this student's registration number
      const studentRecords = attendances.filter(att => att.studentReg === student.regNo);
      
      // Sum the 'count' field for the "Obtained" column
      const totalAttended = studentRecords.reduce((sum, rec) => sum + (rec.count || 0), 0);

      return {
        regNo: student.regNo,
        name: student.name,
        attended: totalAttended,
        // THIS IS WHAT IS MISSING IN YOUR SCREENSHOT:
        attendanceRecords: studentRecords 
      };
    });

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
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
