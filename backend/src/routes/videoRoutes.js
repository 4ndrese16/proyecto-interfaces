const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const videoController = require('../controllers/videoController');
const {
  uploadVideoFiles,
  handleVideoUploadError
} = require('../middlewares/videoUploadMiddleware');

const router = express.Router();

router.get('/', videoController.getVideo);

router.post(
  '/',
  verifyToken,
  uploadVideoFiles,
  handleVideoUploadError,
  videoController.createOrUpdateVideo
);

router.put(
  '/',
  verifyToken,
  uploadVideoFiles,
  handleVideoUploadError,
  videoController.createOrUpdateVideo
);

module.exports = router;