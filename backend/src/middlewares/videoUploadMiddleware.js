const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'videos');
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

    cb(null, `${Date.now()}-${baseName || 'video'}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.mp4', '.mp3', '.vtt'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Solo se permiten archivos .mp4, .mp3 o .vtt'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB para videos
  }
});

const uploadVideoFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio1', maxCount: 1 },
  { name: 'audio2', maxCount: 1 },
  { name: 'subtitle1', maxCount: 1 },
  { name: 'subtitle2', maxCount: 1 }
]);

function handleVideoUploadError(err, _req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Cada archivo debe pesar menos de 100MB' });
    }
  }

  res.status(400).json({ message: err.message });
}

module.exports = {
  uploadVideoFiles,
  handleVideoUploadError
};