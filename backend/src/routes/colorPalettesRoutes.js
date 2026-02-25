const router = require('express').Router();
const controller = require('../controllers/colorPaletteController');
const verifyToken = require('../middlewares/authMiddleware');

// Públicas
router.get('/public', controller.getPublic);
router.get('/default', controller.getDefault);

// Admin protegidas
router.use(verifyToken);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/public/:id', controller.setPublic);
router.put('/default/:id', controller.setDefault);

module.exports = router;