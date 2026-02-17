const express = require('express');
const router = express.Router();
const { login, createUser, toggleBiometric, updateProfile, uploadProfileImage, deleteProfileImage } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Employee Documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const decodedName = decodeURIComponent(file.originalname);
        const sanitizedName = decodedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, `doc-${Date.now()}-${sanitizedName}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only images and PDFs are allowed!');
        }
    }
});

// Configure Multer for Profile Photos
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/profile/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only images (jpeg, jpg, png) are allowed!');
        }
    }
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
