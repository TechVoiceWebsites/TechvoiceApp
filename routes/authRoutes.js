const express = require('express');
const router = express.Router();
const { login, createUser, toggleBiometric, updateProfile, uploadProfileImage, deleteProfileImage } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const streamifier = require('streamifier');

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('WARNING: Cloudinary environment variables are missing!');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configured for cloud:', process.env.CLOUDINARY_CLOUD_NAME);

// Use memory storage (no temp files, works on Vercel)
const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage });
const uploadProfile = multer({ storage: memStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: upload a buffer directly to Cloudinary using upload_stream
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Middleware: handle employee document uploads (aadhaar, pan)
const handleDocumentUpload = async (req, res, next) => {
    try {
        if (!req.files) return next();

        const uploadedFiles = {};

        for (const fieldName of ['aadhaar', 'pan']) {
            const fileArr = req.files[fieldName];
            if (fileArr && fileArr.length > 0) {
                const file = fileArr[0];
                const decodedName = decodeURIComponent(file.originalname);
                const sanitizedName = decodedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '').split('.')[0];
                const publicId = `doc-${Date.now()}-${sanitizedName}`;

                const result = await uploadToCloudinary(file.buffer, {
                    folder: 'techvoice/documents',
                    public_id: publicId,
                    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
                    resource_type: 'auto'
                });

                // Attach result path to file object for controller compatibility
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

// Middleware: handle profile image upload
const handleProfileUpload = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const userId = req.user ? req.user._id : 'unknown';
        const publicId = `profile-${userId}-${Date.now()}`;

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'techvoice/profiles',
            public_id: publicId,
            allowed_formats: ['jpg', 'png', 'jpeg'],
            resource_type: 'image'
        });

        // Attach result to file object for controller compatibility
        req.file.path = result.secure_url;
        next();
    } catch (error) {
        console.error('Profile image upload error:', error);
        return res.status(500).json({ message: 'Profile image upload failed: ' + error.message });
    }
};

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
