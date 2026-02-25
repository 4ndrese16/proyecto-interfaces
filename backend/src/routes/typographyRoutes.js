const router = require('express').Router();
const controller = require('../controllers/typographyController');
const verifyToken = require('../middlewares/authMiddleware');

// Pública
router.get('/active', controller.getActive);

// Protegidas
router.use(verifyToken);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/active/:id', controller.setActive);

module.exports = router;