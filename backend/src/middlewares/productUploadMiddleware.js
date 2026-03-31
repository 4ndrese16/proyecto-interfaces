const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
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
      .slice(0, 80);

    cb(null, `${Date.now()}-${baseName || 'image'}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp']);

  if (!allowed.has(ext)) {
    return cb(new Error('Solo se permiten imagenes .jpg, .jpeg, .png o .webp'));
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

const uploadProductFiles = upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'variant_images', maxCount: 20 }
]);

function handleProductUploadError(err, _req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Cada imagen debe pesar menos de 8MB' });
    }
    return res.status(400).json({ message: 'Error al procesar imagenes del producto' });
  }

  if (err.message) {
    return res.status(400).json({ message: err.message });
  }

  return next(err);
}

module.exports = {
  uploadProductFiles,
  handleProductUploadError
};
