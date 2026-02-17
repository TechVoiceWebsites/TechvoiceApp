const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['employee', 'admin'],
        default: 'employee'
    },
    designation: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    dob: {
        type: Date
    },
    address: {
        type: String
    },
    district: {
        type: String
    },
    aadhaarUrl: {
        type: String
    },
    panUrl: {
        type: String
    },
    salaryDetails: {
        type: Map,
        of: String
    },
    location: {
        type: String,
        default: 'Madurai'
    },
    biometricEnabled: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String
    },
    profileImageUrl: {
        type: String
    }
}, { timestamps: true });

// Method to compare password (using plain text as requested)
userSchema.methods.comparePassword = async function (enteredPassword) {
    return enteredPassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
