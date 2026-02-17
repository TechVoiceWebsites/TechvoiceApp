const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // format: YYYY-MM-DD
        required: true
    },
    signInTime: {
        type: String, // format: HH:mm AM/PM
        required: true
    },
    signOutTime: {
        type: String // format: HH:mm AM/PM
    },
    locationMatches: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present'
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    manualEntry: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
