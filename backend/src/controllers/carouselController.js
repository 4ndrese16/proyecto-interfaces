const { CarouselImage } = require('../models');

const toFilePath = (file) => (file ? `/uploads/carousel/${file.filename}` : null);

const getCarouselImages = async (_req, res) => {
  try {
    const images = await CarouselImage.findAll({
      where: { active: true },
      order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const result = images.map((image) => ({
      ...image.toJSON(),
      image_path: image.image_path ? `${baseUrl}${image.image_path}` : null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const uploadCarouselImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debe enviar una imagen para el carrusel' });
    }

    const { alt_text } = req.body;
    const count = await CarouselImage.count();

    const image = await CarouselImage.create({
      image_path: toFilePath(req.file),
      alt_text: alt_text || '',
      display_order: count
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Error uploading carousel image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const deleteCarouselImage = async (req, res) => {
  try {
    const image = await CarouselImage.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Imagen de carrusel no encontrada' });
    }

    await image.destroy();
    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getCarouselImages,
  uploadCarouselImage,
  deleteCarouselImage
};
