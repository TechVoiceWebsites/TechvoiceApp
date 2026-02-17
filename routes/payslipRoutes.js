const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadPayslip, getMyPayslips, getPayslipsById, downloadPayslip } = require('../controllers/payslipController');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Decode in case it's and URL-encoded name, then replace spaces with underscores and remove special chars
        const decodedName = decodeURIComponent(file.originalname);
        const sanitizedParams = decodedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, `${Date.now()}-${sanitizedParams}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Routes
router.post('/upload', protect, admin, upload.single('payslip'), uploadPayslip);
router.get('/my-payslips', protect, getMyPayslips);
router.get('/download/:id', protect, downloadPayslip);

module.exports = router;
