const router = require('express').Router();
const controller = require('../controllers/colorPaletteController');
const verifyToken = require('../middlewares/authMiddleware');

// Públicas
router.get('/public', controller.getPublic);
router.get('/default', controller.getDefault);
router.get('/selected', controller.getSelected);

// Admin protegidas
router.use(verifyToken);

// Get by id (admin only)
router.get('/:id', controller.getById);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/public/:id', controller.setPublic);
router.put('/default/:id', controller.setDefault);
router.put('/dark/:id', controller.setDark);
router.put('/daltonic/:id', controller.setDaltonic);

module.exports = router;