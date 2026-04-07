const { Coupon } = require('../models');

const sanitize = (value) => String(value || '').trim();

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Number(num.toFixed(2));
};

const toInteger = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const num = parseInt(value, 10);
  if (!Number.isFinite(num)) return fallback;
  return num;
};

const toDateOrNull = (value) => {
  const text = sanitize(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const boolFromValue = (value) => value === true || value === 'true' || value === 1 || value === '1';

function computeDiscount(coupon, subtotal) {
  const base = toNumber(subtotal, 0);
  let discount = Number((base * (toNumber(coupon.discount_value, 0) / 100)).toFixed(2));

  discount = Math.max(0, Math.min(discount, base));
  return Number(discount.toFixed(2));
}

function validateCouponRules(coupon, subtotal) {
  const now = new Date();
  const base = toNumber(subtotal, 0);

  if (!coupon.is_active) {
    return { valid: false, message: 'El cupon no esta activo' };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now.getTime()) {
    return { valid: false, message: 'El cupon esta vencido' };
  }

  if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
    return { valid: false, message: 'El cupon ya alcanzo su limite de uso' };
  }

  const discount = computeDiscount(coupon, base);
  if (discount <= 0) {
    return { valid: false, message: 'El cupon no aplica para este monto' };
  }

  return { valid: true, discount };
}

exports.getAll = async (_req, res) => {
  try {
    const items = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    return res.json(items);
  } catch (_error) {
    return res.status(500).json({ message: 'Error obteniendo cupones' });
  }
};

exports.create = async (req, res) => {
  try {
    const code = sanitize(req.body.code).toUpperCase();
    const description = sanitize(req.body.description) || `Cupon ${code}`;
    const discount_type = 'percent';
    const discount_value = toNumber(req.body.discount_value, 0);
    const usage_limit = toInteger(req.body.usage_limit, null);
    const expires_at = toDateOrNull(req.body.expires_at);
    const is_active = req.body.is_active === undefined ? true : boolFromValue(req.body.is_active);

    if (!code) {
      return res.status(400).json({ message: 'El codigo es obligatorio' });
    }

    if (discount_value <= 0) {
      return res.status(400).json({ message: 'El porcentaje de descuento debe ser mayor a 0' });
    }

    if (discount_value > 100) {
      return res.status(400).json({ message: 'El descuento porcentual no puede ser mayor a 100' });
    }

    if (usage_limit === null || usage_limit <= 0) {
      return res.status(400).json({ message: 'La cantidad de usos debe ser mayor a 0' });
    }

    if (!expires_at) {
      return res.status(400).json({ message: 'La fecha de expiracion es obligatoria' });
    }

    const exists = await Coupon.findOne({ where: { code } });
    if (exists) {
      return res.status(409).json({ message: 'Ya existe un cupon con ese codigo' });
    }

    const created = await Coupon.create({
      code,
      description,
      discount_type,
      discount_value,
      min_purchase: 0,
      max_discount: null,
      usage_limit,
      expires_at,
      is_active
    });

    return res.status(201).json(created);
  } catch (_error) {
    return res.status(500).json({ message: 'Error creando cupon' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) return res.status(404).json({ message: 'Cupon no encontrado' });

    const payload = {};

    if (req.body.code !== undefined) payload.code = sanitize(req.body.code).toUpperCase();
    if (req.body.description !== undefined) payload.description = sanitize(req.body.description);
    payload.discount_type = 'percent';
    if (req.body.discount_value !== undefined) payload.discount_value = toNumber(req.body.discount_value, 0);
    if (req.body.usage_limit !== undefined) payload.usage_limit = toInteger(req.body.usage_limit, null);
    if (req.body.expires_at !== undefined) payload.expires_at = toDateOrNull(req.body.expires_at);
    if (req.body.is_active !== undefined) payload.is_active = boolFromValue(req.body.is_active);

    if (payload.discount_value !== undefined) {
      if (payload.discount_value <= 0 || payload.discount_value > 100) {
        return res.status(400).json({ message: 'El porcentaje de descuento debe estar entre 1 y 100' });
      }
    }

    if (payload.usage_limit !== undefined && (payload.usage_limit === null || payload.usage_limit <= 0)) {
      return res.status(400).json({ message: 'La cantidad de usos debe ser mayor a 0' });
    }

    if (payload.expires_at !== undefined && !payload.expires_at) {
      return res.status(400).json({ message: 'La fecha de expiracion es obligatoria' });
    }

    payload.min_purchase = 0;
    payload.max_discount = null;

    await coupon.update(payload);
    return res.json(coupon);
  } catch (_error) {
    return res.status(500).json({ message: 'Error actualizando cupon' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) return res.status(404).json({ message: 'Cupon no encontrado' });
    await coupon.destroy();
    return res.json({ message: 'Cupon eliminado' });
  } catch (_error) {
    return res.status(500).json({ message: 'Error eliminando cupon' });
  }
};

exports.validate = async (req, res) => {
  try {
    const code = sanitize(req.body.code).toUpperCase();
    const subtotal = toNumber(req.body.subtotal, 0);

    if (!code) {
      return res.status(400).json({ message: 'Debes enviar un codigo de cupon' });
    }

    const coupon = await Coupon.findOne({ where: { code } });
    if (!coupon) {
      return res.status(404).json({ message: 'Cupon no encontrado' });
    }

    const validation = validateCouponRules(coupon, subtotal);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    return res.json({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount: validation.discount,
      usage_limit: coupon.usage_limit,
      expires_at: coupon.expires_at
    });
  } catch (_error) {
    return res.status(500).json({ message: 'Error validando cupon' });
  }
};
