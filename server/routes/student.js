const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const upload = require('../cloudinaryConfig');

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

    // ==============================
    // NEW FEATURE:
    // Dynamic Geofencing Range
    // ==============================

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
        error: "One device per attendance allowed!"
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
            { new: true }
        );
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Student update failed" });
    }
});


module.exports = router;
