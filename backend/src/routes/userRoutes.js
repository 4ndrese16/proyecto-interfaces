const router = require('express').Router();
const verifyToken = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

router.get('/me', verifyToken, userController.getMe);
router.put('/me', verifyToken, userController.updateMe);

module.exports = router;
