const router = require('express').Router();
const verifyToken = require('../middlewares/authMiddleware');
const couponController = require('../controllers/couponController');

router.get('/', verifyToken, couponController.getAll);
router.post('/', verifyToken, couponController.create);
router.put('/:id', verifyToken, couponController.update);
router.delete('/:id', verifyToken, couponController.remove);

router.post('/validate', verifyToken, couponController.validate);

module.exports = router;
