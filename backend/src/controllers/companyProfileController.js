const { CompanyProfile } = require('../models');

const sanitize = (value) => String(value || '').trim();

exports.getCurrent = async (_req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ order: [['id', 'DESC']] });
    return res.json(profile || null);
  } catch (_error) {
    return res.status(500).json({ message: 'Error obteniendo datos fiscales de la empresa' });
  }
};

exports.saveCurrent = async (req, res) => {
  try {
    const legal_name = sanitize(req.body.legal_name);
    const fiscal_address = sanitize(req.body.fiscal_address);
    const rif = sanitize(req.body.rif).toUpperCase();

    if (!legal_name || !fiscal_address || !rif) {
      return res.status(400).json({ message: 'Razon social, domicilio fiscal y RIF son obligatorios' });
    }

    const existing = await CompanyProfile.findOne({ order: [['id', 'DESC']] });

    if (existing) {
      await existing.update({ legal_name, fiscal_address, rif });
      return res.json(existing);
    }

    const created = await CompanyProfile.create({ legal_name, fiscal_address, rif });
    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ message: 'Error guardando datos fiscales de la empresa' });
  }
};
