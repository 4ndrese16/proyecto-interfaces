const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const carouselController = require('../controllers/carouselController');
const { uploadCarouselImage, handleCarouselUploadError } = require('../middlewares/carouselUploadMiddleware');

const router = express.Router();

router.get('/', carouselController.getCarouselImages);
router.post('/', verifyToken, uploadCarouselImage, handleCarouselUploadError, carouselController.uploadCarouselImage);
router.delete('/:id', verifyToken, carouselController.deleteCarouselImage);

module.exports = router;
