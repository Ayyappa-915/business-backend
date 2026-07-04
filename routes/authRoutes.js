const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, registerStaff, getStaff, deleteStaff } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);

// Staff management (requires login protection)
router.post('/staff', protect, registerStaff);
router.get('/staff', protect, getStaff);
router.delete('/staff/:id', protect, deleteStaff);

module.exports = router;
