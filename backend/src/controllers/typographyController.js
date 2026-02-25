const { Typography } = require('../models');

exports.getAll = async (req, res) => {
  const fonts = await Typography.findAll();
  res.json(fonts);
};

exports.getActive = async (req, res) => {
  const font = await Typography.findOne({
    where: { is_active: true }
  });
  res.json(font);
};

exports.create = async (req, res) => {
  const font = await Typography.create(req.body);
  res.json(font);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  await Typography.update(req.body, { where: { id } });
  res.json({ message: "Updated" });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  await Typography.destroy({ where: { id } });
  res.json({ message: "Deleted" });
};

exports.setActive = async (req, res) => {
  const { id } = req.params;

  await Typography.update(
    { is_active: false },
    { where: {} }
  );

  await Typography.update(
    { is_active: true },
    { where: { id } }
  );

  res.json({ message: "Typography activated" });
};