const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/documents';
    if (file.fieldname === 'logo') dest = 'uploads/logos';
    else if (file.fieldname === 'face') dest = 'uploads/student-faces';
    else if (file.fieldname === 'idCard') dest = 'uploads/student-ids';

    // Ensure directory exists
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    } catch (e) {
      console.warn('Directory check error:', e.message);
    }

    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const userId = req.user?._id || req.user?.id || 'anon';
    const ext = path.extname(file.originalname || '') || '.jpg';
    const unique = `${userId}-${Date.now()}${ext.toLowerCase()}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpe?g|png|pdf|webp|gif|bmp|heic)$/i;
  const allowedMimes = /(image\/(jpeg|jpg|png|webp|gif|bmp|heic)|application\/pdf)/i;

  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (allowedExts.test(ext) || allowedMimes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image (JPG, PNG, WEBP) and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = upload;
