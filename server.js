const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const path = require('path');

// Routes
console.log('--- Environment Check ---');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('CLOUDINARY_CLOUD_NAME exists:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('------------------------');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/payslip', require('./routes/payslipRoutes'));

// Serve Uploads
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.warn('Could not create uploads directory (expected in read-only environments like Vercel)');
}

app.use('/uploads', (req, res, next) => {
    console.log(`Request for static file: ${req.url}`);
    next();
}, express.static(uploadDir));

app.get('/', (req, res) => {
    res.send('i Techvoice Smart Attendance API is running...');
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is missing from environment variables!');
} else {
    console.log('Attempting to connect to MongoDB...');
    mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000,
    })
        .then(() => {
            console.log('✅ MongoDB Connected Successfully');
            // Vercel handles the listening, but we still need this for local dev
            if (process.env.NODE_ENV !== 'production') {
                app.listen(PORT, () => {
                    console.log(`🚀 Server running on port ${PORT}`);
                });
            }
        })
        .catch(err => {
            console.error('❌ Database connection error:');
            console.error('Error Name:', err.name);
            console.error('Error Message:', err.message);
            if (err.message.includes('ENOTFOUND')) {
                console.error('Reason: DNS lookup failed. Check your internet connection or Mongo URI.');
            } else if (err.message.includes('ETIMEDOUT')) {
                console.error('Reason: Connection timed out. Ensure your IP is whitelisted in MongoDB Atlas.');
            }
        });
}

module.exports = app;
