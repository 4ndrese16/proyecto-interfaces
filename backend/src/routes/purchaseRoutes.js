const router = require('express').Router();
const verifyToken = require('../middlewares/authMiddleware');
const purchaseInvoiceController = require('../controllers/purchaseInvoiceController');

router.get('/me', verifyToken, purchaseInvoiceController.getMine);
router.get('/me/latest', verifyToken, purchaseInvoiceController.getLatestMine);
router.get('/me/:id', verifyToken, purchaseInvoiceController.getMineById);
router.post('/me', verifyToken, purchaseInvoiceController.createMine);

module.exports = router;
