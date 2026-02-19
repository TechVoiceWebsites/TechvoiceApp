const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Login User
exports.login = async (req, res) => {
    try {
        const { empId, password } = req.body;
        const user = await User.findOne({ empId });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                empId: user.empId,
                name: user.name,
                role: user.role,
                designation: user.designation,
                biometricEnabled: user.biometricEnabled,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                dob: user.dob,
                address: user.address,
                district: user.district,
                phone: user.phone,
                profileImageUrl: user.profileImageUrl,
                salaryDetails: user.salaryDetails,
                location: user.location,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid Employee ID or Password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle Biometric Authentication
exports.toggleBiometric = async (req, res) => {
    try {
        const { enabled } = req.body;

        // Validate request
        if (!req.user) {
            console.error('toggleBiometric: req.user is undefined');
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ message: 'Invalid enabled value' });
        }

        console.log(`Toggling biometric for user ${req.user._id} to ${enabled}`);

        const user = await User.findById(req.user._id);

        if (!user) {
            console.error(`User not found: ${req.user._id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        user.biometricEnabled = enabled;

        try {
            await user.save();
            console.log('Biometric updated successfully');
        } catch (saveError) {
            console.error('Error saving user:', saveError);
            return res.status(500).json({ message: `Failed to save: ${saveError.message}` });
        }

        res.json({
            message: `Biometric authentication ${enabled ? 'enabled' : 'disabled'}`,
            biometricEnabled: user.biometricEnabled
        });
    } catch (error) {
        console.error('Error in toggleBiometric:', error);
        res.status(500).json({ message: error.message || 'Failed to toggle biometric setting' });
    }
};

// Create User (Admin Only)
exports.createUser = async (req, res) => {
    try {
        const { empId, password, role, designation, salaryDetails, location, email, firstName, lastName, dob, address, district, phone } = req.body;

        const userExists = await User.findOne({ empId });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Handle File URLs from Cloudinary
        const aadhaarUrl = req.files['aadhaar'] ? req.files['aadhaar'][0].path : null;
        const panUrl = req.files['pan'] ? req.files['pan'][0].path : null;

        const fullName = `${firstName} ${lastName}`.trim();

        const user = await User.create({
            empId,
            name: fullName,
            password,
            role,
            designation,
            salaryDetails,
            location,
            email,
            firstName,
            lastName,
            dob,
            address,
            district,
            phone,
            aadhaarUrl,
            panUrl
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                empId: user.empId,
                name: user.name,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ message: error.message });
    }
};
// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, address, dob, district, phone } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user missing' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Use check for undefined to allow setting empty strings
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;
        if (address !== undefined) user.address = address;
        if (dob !== undefined) user.dob = dob;
        if (district !== undefined) user.district = district;
        if (phone !== undefined) user.phone = phone;

        // Update name based on first and last name if provided
        if (firstName !== undefined || lastName !== undefined) {
            user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }

        await user.save();
        console.log(`Profile updated for user: ${user.empId}`);

        res.json({
            _id: user._id,
            empId: user.empId,
            name: user.name,
            role: user.role,
            designation: user.designation,
            biometricEnabled: user.biometricEnabled,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            dob: user.dob,
            address: user.address,
            district: user.district,
            phone: user.phone,
            profileImageUrl: user.profileImageUrl,
            location: user.location,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Upload Profile Image
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user with Cloudinary URL
        user.profileImageUrl = req.file.path;
        await user.save();

        res.json({
            message: 'Profile image updated successfully',
            profileImageUrl: user.profileImageUrl
        });
    } catch (error) {
        console.error('Upload Profile Image Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete Profile Image
exports.deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.profileImageUrl) {
            const filePath = path.join(__dirname, '..', user.profileImageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            user.profileImageUrl = null;
            await user.save();
        }

        res.json({
            message: 'Profile image deleted successfully',
            profileImageUrl: null
        });
    } catch (error) {
        console.error('Delete Profile Image Error:', error);
        res.status(500).json({ message: error.message });
    }
};
