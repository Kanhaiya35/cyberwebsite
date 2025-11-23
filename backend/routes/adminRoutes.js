const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { loginAdmin, getMe, updateProfile } = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminMiddleware');

// Multer config for profile photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/profiles/'))
    },
    filename: function (req, file, cb) {
        cb(null, 'admin-profile-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for profile photos
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

router.post('/login', loginAdmin);
router.get('/profile', protectAdmin, getMe);
router.put('/profile', protectAdmin, upload.single('profilePhoto'), updateProfile);

module.exports = router;
