const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    subjectName: { type: String, required: true },
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    // Using ObjectId is the professional standard for MongoDB relationships
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activeCode: { type: String, default: "" },
    codeCreatedAt: { type: Date, default: null },
    codeExpiresAt: { type: Date, default: null },
    lastIncrement: { type: Number, default: 1 },
    totalClasses: { type: Number, default: 0 },
    teacherLat: { type: Number, default: 0 },
    teacherLng: { type: Number, default: 0 },
    session: { type: String, required: true },
    // Add these to your SubjectSchema
rangeLimit: { type: Number, default: 20 }, // in meters
timeLimit: { type: Number, default: 5 },     // in minutes
createdAt: { type: Date, default: Date.now } ,
},  {timestamps: true });

// This prevents the "Cannot overwrite model once compiled" error
module.exports = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);