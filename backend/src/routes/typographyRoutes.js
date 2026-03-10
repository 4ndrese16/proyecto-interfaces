const router = require('express').Router();
const controller = require('../controllers/typographyController');
const verifyToken = require('../middlewares/authMiddleware');
const { uploadTypographyFiles, handleTypographyUploadError } = require('../middlewares/typographyUploadMiddleware');

// Pública
router.get('/active', controller.getActive);

// Protegidas
router.use(verifyToken);

router.get('/', controller.getAll);
router.post('/', uploadTypographyFiles, controller.create);
router.put('/:id', uploadTypographyFiles, controller.update);
router.delete('/:id', controller.delete);
router.put('/active/:id', controller.setActive);

router.use(handleTypographyUploadError);

module.exports = router;