const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    studentReg: { type: String, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    // This field ensures 5 classes are recorded as 5 points
    count: { type: Number, default: 1 }, 
    codeGeneratedAt: { type: Date, required: false }, 
    date: { type: Date, default: Date.now },
    code: { type: String, required: true }, // <--- MUST HAVE THIS
// NEW FIELDS FOR SECURITY
    deviceId: { type: String, required: true }, 
    location: {
        lat: Number,
        lng: Number
    },

});

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);