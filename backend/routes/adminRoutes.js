const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { loginAdmin, getMe, updateProfile } = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminMiddleware');

// Ensure upload folder exists
const profileDir = path.join(__dirname, '../uploads/profiles/');
if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'admin-profile-' + Date.now() + path.extname(file.originalname));
    }
});

// Multer upload config
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, JPEG, GIF files are allowed!'));
        }
    }
});

// Routes
router.post('/login', loginAdmin);
router.get('/profile', protectAdmin, getMe);

// Handle upload with error catch
router.put('/profile', protectAdmin, (req, res, next) => {
    upload.single('profilePhoto')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, updateProfile);

module.exports = router;
