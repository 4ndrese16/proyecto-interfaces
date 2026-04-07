const { PrinterProfile } = require('../models');

const sanitize = (value) => String(value || '').trim();

const normalizeDateSlash = (value) => {
  const raw = sanitize(value);
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    // Accept ddmmyyyy and normalize to dd/mm/yyyy
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    return `${dd}/${mm}/${yyyy}`;
  }

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return raw;

  return '';
};

exports.getCurrent = async (_req, res) => {
  try {
    const profile = await PrinterProfile.findOne({ order: [['id', 'DESC']] });
    return res.json(profile || null);
  } catch (_error) {
    return res.status(500).json({ message: 'Error obteniendo datos de la imprenta autorizada' });
  }
};

exports.saveCurrent = async (req, res) => {
  try {
    const company_name = sanitize(req.body.company_name);
    const rif = sanitize(req.body.rif).toUpperCase();
    const providence_code = sanitize(req.body.providence_code).toUpperCase();
    const providence_date = normalizeDateSlash(req.body.providence_date);
    const control_range_start = sanitize(req.body.control_range_start);
    const control_range_end = sanitize(req.body.control_range_end);
    const control_assignment_date = normalizeDateSlash(req.body.control_assignment_date);
    const control_number = control_range_start;

    if (!company_name || !rif || !providence_code || !providence_date || !control_range_start || !control_range_end || !control_assignment_date) {
      return res.status(400).json({ message: 'Todos los campos de la imprenta autorizada son obligatorios y las fechas deben ir en formato dd/mm/aaaa' });
    }

    const existing = await PrinterProfile.findOne({ order: [['id', 'DESC']] });
    const payload = {
      company_name,
      rif,
      providence_code,
      providence_date,
      control_number,
      control_range_start,
      control_range_end,
      control_assignment_date
    };

    if (existing) {
      await existing.update(payload);
      return res.json(existing);
    }

    const created = await PrinterProfile.create(payload);
    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ message: 'Error guardando datos de la imprenta autorizada' });
  }
};
