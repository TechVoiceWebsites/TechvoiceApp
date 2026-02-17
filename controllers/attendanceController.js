const Attendance = require('../models/Attendance');

// Company Coordinates
const COMPANY_LAT = 9.919130400389726;
const COMPANY_LONG = 78.09495667209754;
const ALLOWED_RADIUS_M = 50;

// Helper to calculate distance in meters
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

// Sign In
exports.signIn = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const distance = getDistance(latitude, longitude, COMPANY_LAT, COMPANY_LONG);

        if (distance > ALLOWED_RADIUS_M) {
            return res.status(403).json({ message: 'You are not at the i Techvoice office.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const existing = await Attendance.findOne({ userId: req.user._id, date: today });

        if (existing) {
            return res.status(400).json({ message: 'Already signed in for today' });
        }

        const attendance = await Attendance.create({
            userId: req.user._id,
            date: today,
            signInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            locationMatches: true,
            status: 'Present',
            coordinates: { latitude, longitude }
        });

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sign Out
exports.signOut = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const distance = getDistance(latitude, longitude, COMPANY_LAT, COMPANY_LONG);

        if (distance > ALLOWED_RADIUS_M) {
            return res.status(403).json({ message: 'You are not at the i Techvoice office.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today });

        if (!attendance) {
            return res.status(404).json({ message: 'No sign-in record found for today' });
        }

        if (attendance.signOutTime) {
            return res.status(400).json({ message: 'Already signed out for today' });
        }

        attendance.signOutTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        await attendance.save();

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Attendance Logs
exports.getMyLogs = async (req, res) => {
    try {
        const logs = await Attendance.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Attendance Logs (Admin only)
exports.getAllLogs = async (req, res) => {
    try {
        const logs = await Attendance.find()
            .populate('userId', 'name empId designation')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
