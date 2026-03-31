const router = require('express').Router();
const verifyToken = require('../middlewares/authMiddleware');
const { getCurrent, saveCurrent } = require('../controllers/companyProfileController');

router.get('/', getCurrent);
router.put('/', verifyToken, saveCurrent);

module.exports = router;
