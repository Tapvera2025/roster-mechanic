/**
 * File Upload Configuration
 *
 * Multer configuration for handling photo uploads
 * Used for clock in/out photo verification
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/clock-photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: employeeId_timestamp_type.ext
    const employeeId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const type = req.body.type || 'clock'; // 'in' or 'out'
    const ext = path.extname(file.originalname);
    const filename = `${employeeId}_${timestamp}_${type}${ext}`;
    cb(null, filename);
  },
});

// File filter - accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware for single photo upload
const uploadSinglePhoto = upload.single('photo');

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// Helper to get file URL
const getPhotoUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/clock-photos/${filename}`;
};

// Helper to delete photo file
const deletePhoto = (photoUrl) => {
  if (!photoUrl) return;

  try {
    const filename = path.basename(photoUrl);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
};

module.exports = {
  upload,
  uploadSinglePhoto,
  handleUploadError,
  getPhotoUrl,
  deletePhoto,
  uploadDir,
};
