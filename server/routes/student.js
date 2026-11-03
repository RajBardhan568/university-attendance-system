const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const upload = require('../cloudinaryConfig');
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

// ==========================================
// 1. MARK ATTENDANCE
// ==========================================

// server/routes/student.js

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

router.post("/mark-attendance", async (req, res) => {
  try {

    const { regNo, code, deviceId, lat, lng } = req.body;

    // Find subject using active attendance code
    const subject = await Subject.findOne({
      activeCode: code.toUpperCase()
    });

    // Invalid code check
    if (!subject) {
      return res.status(400).json({
        error: "Invalid Code"
      });
    }
/// ============================================================
    // FIXED FEATURE: CODE EXPIRATION SECURITY GUARD (CLEANED UP)
    // ============================================================
    if (subject.codeCreatedAt && subject.codeExpiresAt) {
      const currentTime = new Date();
      const expirationDeadline = new Date(subject.codeExpiresAt);

      // Directly compare current server time with pre-calculated DB expiry timestamp
      if (currentTime > expirationDeadline) {
        return res.status(400).json({
          error: "This attendance code has expired! Ask your instructor to regenerate a code."
        });
      }
    } else {
      // Fallback safeguard if the subject somehow has an activeCode but missing timestamp metadata
      return res.status(400).json({
        error: "Attendance session window configuration is invalid or closed."
      });
    }
    // ============================================================
   
    const distance = getDistance(
      lat, // Student latitude
      lng, // Student longitude

      subject.teacherLat, // Teacher latitude
      subject.teacherLng  // Teacher longitude
    );

    // Use custom range from database
    // Default = 20 meters
    const allowedRange = subject.rangeLimit || 20;

    // Student outside classroom range
    if (distance > allowedRange) {

      return res.status(400).json({
        error:
          `Too far! You are ${Math.round(distance)}m away. ` +
          `Allowed range is ${allowedRange}m only.`
      });
    }

    // ==============================
    // OLD FEATURE:
    // One device only
    // ==============================

    const duplicateDevice = await Attendance.findOne({
      subjectId: subject._id,
      deviceId: deviceId,

      date: {
        $gte: subject.codeCreatedAt
      }
    });

    if (duplicateDevice) {

      return res.status(400).json({
        error: "You are already marked your attendance."
      });
    }

    // ==============================
    // SAVE ATTENDANCE
    // ==============================

    const newAttendance = new Attendance({

      studentReg: regNo,

      subjectId: subject._id,

      // Save attendance quantity
      count: subject.lastIncrement,

      // Save device fingerprint
      deviceId,

      // Save student location
      location: {
        lat,
        lng
      },

      // Save used attendance code
      code: req.body.code
    });

    await newAttendance.save();

    // SUCCESS
    res.json({
      message: "Proximity Verified. Attendance Marked!"
    });

  } catch (err) {

    console.error("ATTENDANCE ERROR:", err);

    res.status(500).json({
      error: "Security check failed."
    });
  }
});
// ==========================================
// 2. GET STUDENT STATS
// ==========================================

router.get("/my-stats/:regNo", async (req, res) => {
  try {
    const { regNo } = req.params;

    // Find all attendance
    const myAttendances = await Attendance.find({
      studentReg: regNo,
    });

    // Unique subject ids
    const enrolledSubjectIds = [
      ...new Set(myAttendances.map((a) => a.subjectId.toString())),
    ];

    // Get subjects
    const subjects = await Subject.find({
      _id: {
        $in: enrolledSubjectIds,
      },
    });

    const stats = await Promise.all(
      subjects.map(async (sub) => {
        // IMPORTANT FIX:
        // Sum all counts instead of countDocuments

        const attendanceRecords = await Attendance.find({
          studentReg: regNo,

          subjectId: sub._id,
        });

        let attendedCount = 0;

        attendanceRecords.forEach((record) => {
          attendedCount += Number(record.count) || 1;
        });

        return {
          subjectId: sub._id,
          subjectName: sub.subjectName,
          branch: sub.branch || "N/A",
          semester: sub.semester  || "N/A",
          totalHeld: sub.totalClasses || 0,
          attended: attendedCount,
        };
      }),
    );

    res.json(stats);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ROUTE: Update Student Profile
// Students can update Name, Mobile, and Profile Photo
router.put('/update-profile/:regNo', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { name, mobile } = req.body;
        const updateData = { name, mobile };

        if (req.file) {
            updateData.profilePhoto = req.file.path; // Cloudinary URL
        }

        const updatedUser = await User.findOneAndUpdate(
            { regNo: req.params.regNo },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Student update failed" });
    }
});

//Account Deletion OTP Store (In-Memory)
const deleteOtpStore = new Map();

// 1. Send OTP for Account Deletion
router.post("/send-delete-otp", async (req, res) => {
  try {
    const { regNo } = req.body;
    const student = await User.findOne({ regNo, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    deleteOtpStore.set(student.email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // Valid for 5 minutes
    });

    await sendEmail(
      student.email,
      "AMS Account Deletion OTP",
      `Your OTP to permanently delete your AMS student account is: ${otp}. It is valid for 5 minutes.`
    );

    res.status(200).json({ message: "OTP sent to your registered email." });
  } catch (err) {
    console.error("Send Delete OTP Error:", err);
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

// 2. Verify (Password OR OTP) & Execute Account Deletion
router.post("/delete-account", async (req, res) => {
  try {
    const { regNo, method, password, otp } = req.body;
    const student = await User.findOne({ regNo, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found." });

    // Verify Identity via Password OR OTP
    if (method === "password") {
      if (!password) return res.status(400).json({ error: "Password required." });
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) return res.status(401).json({ error: "Incorrect password." });
    } else if (method === "otp") {
      const record = deleteOtpStore.get(student.email);
      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return res.status(401).json({ error: "Invalid or expired OTP." });
      }
      deleteOtpStore.delete(student.email);
    } else {
      return res.status(400).json({ error: "Invalid verification method." });
    }

    // Step 5: Execute permanent deletion
    await Attendance.deleteMany({ regNo });
    await User.findByIdAndDelete(student._id);

    res.status(200).json({ message: "Student account deleted permanently." });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ error: "Failed to delete student account." });
  }
});

module.exports = router;
