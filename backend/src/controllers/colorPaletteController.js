const { ColorPalette } = require('../models');

exports.getAll = async (req, res) => {
  const palettes = await ColorPalette.findAll();
  res.json(palettes);
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

exports.create = async (req, res) => {
  try {
    const palette = await ColorPalette.create(req.body);
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
  await ColorPalette.destroy({ where: { id } });
  res.json({ message: "Deleted" });
};

exports.setPublic = async (req, res) => {
  const { id } = req.params;

  const publicCount = await ColorPalette.count({
    where: { is_public: true }
  });

  if (publicCount >= 3) {
    return res.status(400).json({
      message: "Maximum of 3 public palettes allowed"
    });
  }

  await ColorPalette.update(
    { is_public: true },
    { where: { id } }
  );

  res.json({ message: "Palette set as public" });
};

exports.setDefault = async (req, res) => {
  const { id } = req.params;

  await ColorPalette.update(
    { is_default: false },
    { where: {} }
  );

  await ColorPalette.update(
    { is_default: true },
    { where: { id } }
  );

  res.json({ message: "Default palette updated" });
};