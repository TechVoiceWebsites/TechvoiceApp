const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadPayslip, getMyPayslips, getPayslipsById, downloadPayslip } = require('../controllers/payslipController');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage for Payslips
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'techvoice/payslips',
        allowed_formats: ['pdf'],
        public_id: (req, file) => {
            const decodedName = decodeURIComponent(file.originalname);
            const sanitizedName = decodedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '').split('.')[0];
            return `payslip-${Date.now()}-${sanitizedName}`;
        }
    }
});

const upload = multer({ storage: storage });

// Routes
router.post('/upload', protect, admin, upload.single('payslip'), uploadPayslip);
router.get('/my-payslips', protect, getMyPayslips);
router.get('/download/:id', protect, downloadPayslip);

module.exports = router;
