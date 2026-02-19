const express = require('express');
const router = express.Router();
const { login, createUser, toggleBiometric, updateProfile, uploadProfileImage, deleteProfileImage } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary once at startup
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY, '| Cloud:', process.env.CLOUDINARY_CLOUD_NAME);

// ── Memory storage (Vercel-safe, no temp files) ──────────────────────────────
const imageFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG/PNG images are allowed'), false);
};

const docFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG/PNG/PDF files are allowed'), false);
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter: docFilter });
const uploadProfile = multer({ storage: multer.memoryStorage(), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helper: stream buffer → Cloudinary ───────────────────────────────────────
const uploadToCloudinary = (buffer, options) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });

// ── Middleware: upload employee documents ─────────────────────────────────────
const handleDocumentUpload = async (req, res, next) => {
    try {
        if (!req.files) return next();
        const uploadedFiles = {};
        for (const fieldName of ['aadhaar', 'pan']) {
            const fileArr = req.files[fieldName];
            if (fileArr && fileArr.length > 0) {
                const file = fileArr[0];
                const sanitizedName = decodeURIComponent(file.originalname)
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9.\-_]/g, '')
                    .split('.')[0];
                const publicId = `doc-${Date.now()}-${sanitizedName}`;
                const result = await uploadToCloudinary(file.buffer, {
                    folder: 'techvoice/documents',
                    public_id: publicId,
                    resource_type: 'auto'   // ← no allowed_formats (removes it from sig)
                });
                file.path = result.secure_url;
                uploadedFiles[fieldName] = [file];
            }
        }
        req.files = uploadedFiles;
        next();
    } catch (error) {
        console.error('Document upload error:', error);
        return res.status(500).json({ message: 'File upload failed: ' + error.message });
    }
};

// ── Middleware: upload profile image ──────────────────────────────────────────
const handleProfileUpload = async (req, res, next) => {
    try {
        if (!req.file) return next();
        const userId = req.user ? req.user._id : 'unknown';
        const publicId = `profile-${userId}-${Date.now()}`;
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'techvoice/profiles',
            public_id: publicId,
            resource_type: 'image'           // ← no allowed_formats (removes it from sig)
        });
        req.file.path = result.secure_url;
        next();
    } catch (error) {
        console.error('Profile image upload error:', error);
        return res.status(500).json({ message: 'Profile image upload failed: ' + error.message });
    }
};

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/login', login);
router.post('/create-user', protect, admin, upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 }
]), handleDocumentUpload, createUser);
router.post('/toggle-biometric', protect, toggleBiometric);
router.put('/update-profile', protect, updateProfile);
router.put('/profile-image', protect, uploadProfile.single('image'), handleProfileUpload, uploadProfileImage);
router.delete('/profile-image', protect, deleteProfileImage);

module.exports = router;
