const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Get All Employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('-password');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Attendance Logs (for reports)
exports.getAllAttendance = async (req, res) => {
    try {
        const logs = await Attendance.find().populate('userId', 'name empId designation role').sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Stats for Dashboard
exports.getStats = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const today = new Date().toISOString().split('T')[0];
        const presentToday = await Attendance.countDocuments({ date: today });

        res.json({
            totalEmployees,
            presentToday,
            absentToday: totalEmployees - presentToday
        });
    } catch (error) {
        console.error('getStats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update Employee (Admin Only)
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            designation,
            salaryDetails,
            location,
            firstName,
            lastName,
            email,
            address,
            dob,
            district,
            phone
        } = req.body;

        const employee = await User.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (firstName !== undefined) employee.firstName = firstName;
        if (lastName !== undefined) employee.lastName = lastName;
        if (email !== undefined) employee.email = email;
        if (address !== undefined) employee.address = address;
        if (dob !== undefined) employee.dob = dob;
        if (district !== undefined) employee.district = district;
        if (designation !== undefined) employee.designation = designation;
        if (phone !== undefined) employee.phone = phone;
        if (salaryDetails !== undefined) employee.salaryDetails = salaryDetails;
        if (location !== undefined) employee.location = location;

        // Update full name if explicitly provided or if first/last name changed
        if (name !== undefined) {
            employee.name = name;
        } else if (firstName !== undefined || lastName !== undefined) {
            employee.name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        }

        await employee.save();
        res.json({ message: 'Employee updated successfully', employee });
    } catch (error) {
        console.error('updateEmployee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete Employee (Admin Only)
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await User.findById(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Recently Added Employees (Last 3)
exports.getRecentEmployees = async (req, res) => {
    try {
        const recent = await User.find({ role: 'employee' })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(3);
        res.json(recent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Manual Attendance Entry (Admin Only)
exports.manualAttendance = async (req, res) => {
    try {
        const { userId, date, status, signInTime, signOutTime } = req.body;

        // Check if attendance already exists
        const existing = await Attendance.findOne({ userId, date });

        if (existing) {
            existing.status = status;
            existing.manualEntry = true;
            if (signInTime) existing.signInTime = signInTime;
            if (signOutTime) existing.signOutTime = signOutTime;
            await existing.save();
            return res.json({ message: 'Attendance updated', attendance: existing });
        }

        // Create new attendance record
        const attendance = await Attendance.create({
            userId,
            date,
            status,
            signInTime: signInTime || '09:00 AM',
            signOutTime: signOutTime || null,
            manualEntry: true,
            locationMatches: false
        });

        res.status(201).json({ message: 'Attendance marked', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
