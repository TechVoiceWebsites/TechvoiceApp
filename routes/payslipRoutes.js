const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadPayslip, getMyPayslips, getPayslipsById, downloadPayslip } = require('../controllers/payslipController');

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage (no temp files, works on Vercel)
const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage });

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

// Middleware: handle payslip upload to Cloudinary
const handlePayslipUpload = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const decodedName = decodeURIComponent(req.file.originalname);
        const sanitizedName = decodedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '').split('.')[0];
        const publicId = `payslip-${Date.now()}-${sanitizedName}`;

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'techvoice/payslips',
            public_id: publicId,
            resource_type: 'auto'
        });

        // Attach result to file object for controller compatibility
        req.file.path = result.secure_url;
        req.file.cloudinaryId = result.public_id;
        next();
    } catch (error) {
        console.error('Payslip upload error:', error);
        return res.status(500).json({ message: 'Payslip upload failed: ' + error.message });
    }
};

// Routes
router.post('/upload', protect, admin, upload.single('payslip'), handlePayslipUpload, uploadPayslip);
router.get('/my-payslips', protect, getMyPayslips);
router.get('/download/:id', protect, downloadPayslip);

module.exports = router;
