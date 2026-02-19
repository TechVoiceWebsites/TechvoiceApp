const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadPayslip, getMyPayslips, getPayslipsById, downloadPayslip } = require('../controllers/payslipController');
const cloudinary = require('cloudinary').v2;
const maskSecret = (secret) => {
    if (!secret) return "NOT_SET";
    return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
};

// Configure Cloudinary once
console.log('--- CLOUDINARY CONFIG (PAYSLIP) START ---');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('API_SECRET_MASK:', maskSecret(process.env.CLOUDINARY_API_SECRET));
console.log('-----------------------------------------');

const BACKEND_VERSION = "2.1-DirectUpload";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Memory storage (Vercel-safe, no temp files)
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
};
const upload = multer({ storage: multer.memoryStorage(), fileFilter: pdfFilter });

// Helper: stream buffer → Cloudinary
const uploadToCloudinary = (buffer, options) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });

// Middleware: upload payslip to Cloudinary
const handlePayslipUpload = async (req, res, next) => {
    try {
        if (!req.file) return next();
        const sanitizedName = decodeURIComponent(req.file.originalname)
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9.\-_]/g, '')
            .split('.')[0];
        const publicId = `payslip-${Date.now()}-${sanitizedName}`;
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'techvoice/payslips',
            public_id: publicId,
            resource_type: 'raw'   // ← no allowed_formats (removes it from sig)
        });
        req.file.path = result.secure_url;
        req.file.cloudinaryId = result.public_id;
        next();
    } catch (error) {
        console.error('Payslip upload error:', error);
        return res.status(500).json({
            message: `[${BACKEND_VERSION}] Payslip upload failed: ` + error.message,
            debug_info: { folder: 'techvoice/payslips' }
        });
    }
};

// Routes
router.post('/upload', protect, admin, upload.single('payslip'), handlePayslipUpload, uploadPayslip);
router.get('/my-payslips', protect, getMyPayslips);
router.get('/download/:id', protect, downloadPayslip);

module.exports = router;
