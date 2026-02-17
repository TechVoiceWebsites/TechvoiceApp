const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
    getAllAttendance,
    getStats,
    updateEmployee,
    deleteEmployee,
    getRecentEmployees,
    manualAttendance
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/employees', protect, admin, getAllEmployees);
router.get('/employees/recent', protect, admin, getRecentEmployees);
router.put('/employees/:id', protect, admin, updateEmployee);
router.delete('/employees/:id', protect, admin, deleteEmployee);
router.get('/attendance', protect, admin, getAllAttendance);
router.post('/attendance/manual', protect, admin, manualAttendance);
router.get('/stats', protect, admin, getStats);

module.exports = router;
