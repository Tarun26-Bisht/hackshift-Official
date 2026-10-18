const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/documents';
    if (file.fieldname === 'logo') dest = 'uploads/logos';
    else if (file.fieldname === 'face') dest = 'uploads/student-faces';
    else if (file.fieldname === 'idCard') dest = 'uploads/student-ids';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Only jpg, png, pdf files allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

module.exports = upload;
