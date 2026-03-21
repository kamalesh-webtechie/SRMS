const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure announcement uploads directory exists
const uploadDir = 'uploads/announcements';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: adminId-timestamp.ext
        const ext = path.extname(file.originalname);
        cb(null, `announcement-${req.user._id}-${Date.now()}${ext}`);
    }
});

// Filter to allow images and common document types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type! Only images (JPG, PNG, GIF) and documents (PDF, DOCX) are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
