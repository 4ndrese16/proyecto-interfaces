const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'carousel');
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

    cb(null, `${Date.now()}-${baseName || 'carousel'}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Solo se permiten imágenes .jpg, .jpeg, .png o .webp'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para imágenes de carrusel
  }
});

const uploadCarouselImage = upload.single('image');

function handleCarouselUploadError(err, _req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'La imagen debe pesar menos de 10MB' });
    }
  }

  res.status(400).json({ message: err.message });
}

module.exports = {
  uploadCarouselImage,
  handleCarouselUploadError
};
