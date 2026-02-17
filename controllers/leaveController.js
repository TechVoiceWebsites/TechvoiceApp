const Leave = require('../models/Leave');

// Apply for Leave
exports.applyLeave = async (req, res) => {
    try {
        const { leaveType, date, reason } = req.body;
        const userId = req.user._id;

        const leave = await Leave.create({
            user: userId,
            leaveType,
            date,
            reason
        });

        res.status(201).json({ message: 'Leave application submitted', leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get My Leaves
exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Leaves (Admin)
exports.getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('user', 'name empId designation role').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Leave Status (Admin)
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminComment } = req.body;

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        leave.status = status;
        if (adminComment) leave.adminComment = adminComment;

        await leave.save();
        res.json({ message: `Leave ${status}`, leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
