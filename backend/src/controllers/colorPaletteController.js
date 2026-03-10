const { ColorPalette } = require('../models');

exports.getAll = async (req, res) => {
  const palettes = await ColorPalette.findAll();
  res.json(palettes);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const palette = await ColorPalette.findByPk(id);
  if (!palette) return res.status(404).json({ message: 'Palette not found' });
  res.json(palette);
};

exports.getPublic = async (req, res) => {
  const palettes = await ColorPalette.findAll({
    where: { is_public: true }
  });
  res.json(palettes);
};

exports.getDefault = async (req, res) => {
  const palette = await ColorPalette.findOne({
    where: { is_default: true }
  });
  res.json(palette);
};

exports.getSelected = async (req, res) => {
  // Return any palettes that are selected as default, dark or daltonic
  const palettes = await ColorPalette.findAll({
    where: {
      // Sequelize OR: is_default OR is_dark OR is_daltonic
      [require('sequelize').Op.or]: [
        { is_default: true },
        { is_dark: true },
        { is_daltonic: true }
      ]
    }
  });
  res.json(palettes);
};

exports.create = async (req, res) => {
  try {
    const palette = await ColorPalette.create(req.body);
    // if this is the only palette, make it the default
    const total = await ColorPalette.count();
    if (total === 1) {
      await ColorPalette.update({ is_default: true }, { where: { id: palette.id } });
      palette.is_default = true;
    }
    res.json(palette);
  } catch (err) {
    res.status(500).json({ message: "Error creating palette" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  await ColorPalette.update(req.body, { where: { id } });
  res.json({ message: "Updated" });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const palette = await ColorPalette.findByPk(id);
  if (!palette) return res.status(404).json({ message: 'Palette not found' });
  if (palette.is_default || palette.is_dark || palette.is_daltonic) {
    return res.status(400).json({ message: 'Cannot delete a palette that is selected as default/dark/daltonic' });
  }
  await ColorPalette.destroy({ where: { id } });
  res.json({ message: "Deleted" });
};

exports.setDefault = async (req, res) => {
  const { id } = req.params;

  const palette = await ColorPalette.findByPk(id);
  if (!palette) return res.status(404).json({ message: 'Palette not found' });

  // If it's already default, toggle off
  if (palette.is_default) {
    // prevent clearing default if it's the only palette
    const total = await ColorPalette.count();
    if (total <= 1) {
      return res.status(400).json({ message: 'There must be at least one default palette' });
    }
    await ColorPalette.update({ is_default: false }, { where: { id } });
    return res.json({ message: 'Default palette cleared' });
  }

  // Make sure no other palette is default and ensure the newly selected palette is not dark/daltonic
  await ColorPalette.update({ is_default: false }, { where: {} });
  await ColorPalette.update({ is_dark: false, is_daltonic: false }, { where: { id } });
  await ColorPalette.update({ is_default: true }, { where: { id } });

  res.json({ message: 'Default palette updated' });
};

exports.setDark = async (req, res) => {
  const { id } = req.params;

  const palette = await ColorPalette.findByPk(id);
  if (!palette) return res.status(404).json({ message: 'Palette not found' });

  if (palette.is_dark) {
    await ColorPalette.update({ is_dark: false }, { where: { id } });
    return res.json({ message: 'Dark palette cleared' });
  }

  // unset dark for others, and ensure this palette is not default/daltonic
  await ColorPalette.update({ is_dark: false }, { where: {} });
  await ColorPalette.update({ is_default: false, is_daltonic: false }, { where: { id } });
  await ColorPalette.update({ is_dark: true }, { where: { id } });

  res.json({ message: 'Dark palette updated' });
};

exports.setDaltonic = async (req, res) => {
  const { id } = req.params;

  const palette = await ColorPalette.findByPk(id);
  if (!palette) return res.status(404).json({ message: 'Palette not found' });

  if (palette.is_daltonic) {
    await ColorPalette.update({ is_daltonic: false }, { where: { id } });
    return res.json({ message: 'Daltonic palette cleared' });
  }

  // unset daltonic for others, and ensure this palette is not default/dark
  await ColorPalette.update({ is_daltonic: false }, { where: {} });
  await ColorPalette.update({ is_default: false, is_dark: false }, { where: { id } });
  await ColorPalette.update({ is_daltonic: true }, { where: { id } });

  res.json({ message: 'Daltonic palette updated' });
};