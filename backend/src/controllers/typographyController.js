const { Typography } = require('../models');

const normalizeSize = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 8) return String(fallback);
  return String(parsed);
};

const buildSetName = (titleName, bodyName) => {
  const title = (titleName || 'Titulos').trim();
  const body = (bodyName || 'Cuerpo').trim();
  return `${title} / ${body}`;
};

const boolFromValue = (value) => value === true || value === 'true' || value === 1 || value === '1';

exports.getAll = async (req, res) => {
  try {
    const fonts = await Typography.findAll();
    res.json(fonts);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo tipografias' });
  }
};

exports.getActive = async (req, res) => {
  try {
    const font = await Typography.findOne({
      where: { is_active: true }
    });
    res.json(font);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo tipografia activa' });
  }
};

exports.create = async (req, res) => {
  try {
    const titleFile = req.files?.title_file?.[0];
    const bodyFile = req.files?.body_file?.[0];

    const titleName = (req.body.font_title_name || titleFile?.originalname?.replace(/\.ttf$/i, '') || 'TitleFont').trim();
    const bodyName = (req.body.font_body_name || bodyFile?.originalname?.replace(/\.ttf$/i, '') || 'BodyFont').trim();

    const payload = {
      name: (req.body.name || buildSetName(titleName, bodyName)).trim(),
      font_title_name: titleName,
      font_body_name: bodyName,
      h1_size: normalizeSize(req.body.h1_size, 24),
      h2_size: normalizeSize(req.body.h2_size, 18),
      p_size: normalizeSize(req.body.p_size, 15),
      is_active: boolFromValue(req.body.is_active)
    };

    if (titleFile) payload.font_title_path = `/uploads/typography/${titleFile.filename}`;
    if (bodyFile) payload.font_body_path = `/uploads/typography/${bodyFile.filename}`;

    const font = await Typography.create(payload);

    const total = await Typography.count();
    if (total === 1) {
      await Typography.update({ is_active: true }, { where: { id: font.id } });
      font.is_active = true;
    }

    res.json(font);
  } catch (error) {
    res.status(500).json({ message: 'Error creando tipografia' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const typography = await Typography.findByPk(id);

    if (!typography) {
      return res.status(404).json({ message: 'Tipografia no encontrada' });
    }

    const titleFile = req.files?.title_file?.[0];
    const bodyFile = req.files?.body_file?.[0];
    const payload = {};

    if (req.body.h1_size !== undefined) payload.h1_size = normalizeSize(req.body.h1_size, typography.h1_size || 24);
    if (req.body.h2_size !== undefined) payload.h2_size = normalizeSize(req.body.h2_size, typography.h2_size || 18);
    if (req.body.p_size !== undefined) payload.p_size = normalizeSize(req.body.p_size, typography.p_size || 15);
    if (req.body.is_active !== undefined) payload.is_active = boolFromValue(req.body.is_active);

    if (req.body.font_title_name !== undefined) {
      const titleName = req.body.font_title_name.trim();
      if (titleName) payload.font_title_name = titleName;
    }

    if (req.body.font_body_name !== undefined) {
      const bodyName = req.body.font_body_name.trim();
      if (bodyName) payload.font_body_name = bodyName;
    }

    if (titleFile) {
      payload.font_title_path = `/uploads/typography/${titleFile.filename}`;
      if (!payload.font_title_name) {
        payload.font_title_name = titleFile.originalname.replace(/\.ttf$/i, '');
      }
    }

    if (bodyFile) {
      payload.font_body_path = `/uploads/typography/${bodyFile.filename}`;
      if (!payload.font_body_name) {
        payload.font_body_name = bodyFile.originalname.replace(/\.ttf$/i, '');
      }
    }

    const finalTitleName = payload.font_title_name || typography.font_title_name || 'TitleFont';
    const finalBodyName = payload.font_body_name || typography.font_body_name || 'BodyFont';
    payload.name = (req.body.name || buildSetName(finalTitleName, finalBodyName)).trim();

    await typography.update(payload);
    return res.json(typography);
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando tipografia' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const typography = await Typography.findByPk(id);
    if (!typography) {
      return res.status(404).json({ message: 'Tipografia no encontrada' });
    }

    if (typography.is_active) {
      return res.status(400).json({ message: 'No se puede eliminar la tipografia activa. Activa otra primero.' });
    }

    await Typography.destroy({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando tipografia' });
  }
};

exports.setActive = async (req, res) => {
  try {
    const { id } = req.params;

    const typography = await Typography.findByPk(id);
    if (!typography) {
      return res.status(404).json({ message: 'Tipografia no encontrada' });
    }

    await Typography.update(
      { is_active: false },
      { where: {} }
    );

    await Typography.update(
      { is_active: true },
      { where: { id } }
    );

    return res.json({ message: 'Typography activated' });
  } catch (error) {
    return res.status(500).json({ message: 'Error activando tipografia' });
  }
};