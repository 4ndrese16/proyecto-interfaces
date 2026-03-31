const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const productController = require('../controllers/productController');
const {
	uploadProductFiles,
	handleProductUploadError
} = require('../middlewares/productUploadMiddleware');

const router = express.Router();

router.get('/', productController.getAll);
router.get('/:id', productController.getById);

router.post(
	'/',
	verifyToken,
	uploadProductFiles,
	handleProductUploadError,
	productController.create
);

router.put(
	'/:id',
	verifyToken,
	uploadProductFiles,
	handleProductUploadError,
	productController.update
);

router.delete('/:id', verifyToken, productController.remove);

module.exports = router;
