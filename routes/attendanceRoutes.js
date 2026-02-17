const express = require('express');
const router = express.Router();
const { signIn, signOut, getMyLogs, getAllLogs } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/signin', protect, signIn);
router.post('/signout', protect, signOut);
router.get('/my-logs', protect, getMyLogs);
router.get('/all', protect, admin, getAllLogs);

module.exports = router;
