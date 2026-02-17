const Payslip = require('../models/Payslip');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Upload Payslip (Admin)
exports.uploadPayslip = async (req, res) => {
    try {
        const { userId, month, year } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Move file to structured employee payslip folder
        const userDir = path.join('uploads', 'profile', user.name);
        const payslipDir = path.join(userDir, 'payslip');
        if (!fs.existsSync(payslipDir)) {
            fs.mkdirSync(payslipDir, { recursive: true });
        }

        const oldPath = file.path;
        const newPath = path.join(payslipDir, file.filename);
        fs.renameSync(oldPath, newPath);

        const payslip = await Payslip.create({
            user: userId,
            month,
            year,
            fileUrl: `uploads/profile/${user.name}/payslip/${file.filename}`
        });

        res.status(201).json({ message: 'Payslip uploaded successfully', payslip });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get My Payslips
exports.getMyPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({ user: req.user._id }).sort({ year: -1, month: -1 });
        res.json(payslips);
    } catch (error) {
        console.error('getMyPayslips Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Payslips for a specific user (Admin - Optional/Future use)
exports.getPayslipsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const payslips = await Payslip.find({ user: userId }).sort({ year: -1, month: -1 });
        res.json(payslips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Download Payslip (Secure)
exports.downloadPayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);

        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        // Check ownership or admin
        if (payslip.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to download this payslip' });
        }

        const filePath = path.join(__dirname, '..', payslip.fileUrl);

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({ message: 'File not found on server' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
