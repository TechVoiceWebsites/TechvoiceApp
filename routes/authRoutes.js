const express = require('express');
const router = express.Router();
const { login, createUser, toggleBiometric, updateProfile, uploadProfileImage, deleteProfileImage } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage for Employee Documents
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'techvoice/documents',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        public_id: (req, file) => {
            const decodedName = decodeURIComponent(file.originalname);
            const sanitizedName = decodedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '').split('.')[0];
            return `doc-${Date.now()}-${sanitizedName}`;
        }
    }
});

const upload = multer({ storage });

// Configure Cloudinary Storage for Profile Photos
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'techvoice/profiles',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req, file) => `profile-${req.user._id}-${Date.now()}`
    }
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/login', login);
router.post('/create-user', protect, admin, upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 }
]), createUser);
router.post('/toggle-biometric', protect, toggleBiometric);
router.put('/update-profile', protect, updateProfile);
router.put('/profile-image', protect, uploadProfile.single('image'), uploadProfileImage);
router.delete('/profile-image', protect, deleteProfileImage);

module.exports = router;
