const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'typography');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .parse(file.originalname)
      .name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 60);

    cb(null, `${Date.now()}-${baseName || 'font'}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext !== '.ttf') {
    return cb(new Error('Solo se permiten archivos .ttf'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const uploadTypographyFiles = upload.fields([
  { name: 'title_file', maxCount: 1 },
  { name: 'body_file', maxCount: 1 }
]);

function handleTypographyUploadError(err, _req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Cada archivo debe pesar menos de 10MB' });
    }
    return res.status(400).json({ message: 'Error al procesar archivos de tipografia' });
  }

  if (err.message) {
    return res.status(400).json({ message: err.message });
  }

  return next(err);
}

module.exports = {
  uploadTypographyFiles,
  handleTypographyUploadError
};
