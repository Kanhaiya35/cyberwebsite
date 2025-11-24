const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { registerReporter, loginReporter, getMe, updateProfile, logoutReporter } = require('../controllers/reporterController');
const { protect } = require('../middleware/authMiddleware');
const { validateReporterRegistration } = require('./validation.js');

// Ensure profiles directory exists before multer runs
const profilesDir = path.join(__dirname, '../uploads/profiles/');
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profilesDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

// Multer upload config
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
        }
    }
});

// 🔥 Register Route (NOW with correct order)
router.post(
    '/register',
    validateReporterRegistration,
    (req, res, next) => {
        upload.single('profilePhoto')(req, res, function (err) {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },
    registerReporter
);

// Login route
router.post('/login', loginReporter);

// Logout Route
router.post('/logout', logoutReporter);

// Get profile
router.get('/profile', protect, getMe);

// Update profile route with error-handled upload
router.put(
    '/profile',
    protect,
    (req, res, next) => {
        upload.single('profilePhoto')(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: err.message });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },
    updateProfile
);

module.exports = router;
