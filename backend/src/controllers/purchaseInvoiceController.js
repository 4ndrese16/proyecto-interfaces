const { PurchaseInvoice, User, CompanyProfile, PrinterProfile, Coupon, sequelize } = require('../models');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Number(n.toFixed(2));
}

function createInvoiceNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `F-${yyyy}${mm}${dd}-${random}`;
}

function hasText(value) {
  return String(value || '').trim().length > 0;
}

function isUserBillingComplete(user) {
  if (!user) return false;
  return [
    user.full_name,
    user.email,
    user.fiscal_address,
    user.phone,
    user.document_id
  ].every(hasText);
}

function isCompanyBillingComplete(company) {
  if (!company) return false;
  return [company.legal_name, company.fiscal_address, company.rif].every(hasText);
}

function isPrinterBillingComplete(printer) {
  if (!printer) return false;
  return [
    printer.company_name,
    printer.rif,
    printer.providence_code,
    printer.providence_date,
    printer.control_range_start,
    printer.control_range_end,
    printer.control_assignment_date
  ].every(hasText);
}

function sanitize(value) {
  return String(value || '').trim();
}

exports.getMine = async (req, res) => {
  try {
    const items = await PurchaseInvoice.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.json(items);
  } catch (_e) {
    return res.status(500).json({ message: 'Error obteniendo historial de compras' });
  }
};

exports.createMine = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const companyProfile = await CompanyProfile.findOne({ order: [['id', 'DESC']] });
    const printerProfile = await PrinterProfile.findOne({ order: [['id', 'DESC']] });

    if (!isCompanyBillingComplete(companyProfile) || !isPrinterBillingComplete(printerProfile)) {
      return res.status(400).json({ message: 'No se puede emitir la factura: el admin debe completar los datos de facturacion e imprenta autorizada.' });
    }

    if (!isUserBillingComplete(user)) {
      return res.status(400).json({ message: 'No se puede emitir la factura: completa primero tus datos de facturacion en Mi Cuenta.' });
    }

    const payload = {
      user_id: req.user.id,
      invoice_number: createInvoiceNumber(),
      control_number: String(printerProfile.control_range_start || '').trim(),
      subtotal: toNumber(req.body.subtotal),
      discount: toNumber(req.body.discount),
      taxable_base: toNumber(req.body.taxable_base),
      vat_amount: toNumber(req.body.vat_amount),
      total: toNumber(req.body.total),
      currency: String(req.body.currency || 'BOB').trim() || 'BOB',
      items: Array.isArray(req.body.items) ? req.body.items : [],
      payment_plan: req.body.payment_plan && typeof req.body.payment_plan === 'object' ? req.body.payment_plan : {},
      payment_parts: Array.isArray(req.body.payment_parts) ? req.body.payment_parts : [],
      coupon: req.body.coupon && typeof req.body.coupon === 'object' ? req.body.coupon : null,
      issuer_data: {
        legal_name: companyProfile.legal_name,
        fiscal_address: companyProfile.fiscal_address,
        rif: companyProfile.rif
      },
      buyer_data: {
        full_name: user.full_name,
        email: user.email,
        fiscal_address: user.fiscal_address,
        phone: user.phone,
        document_id: user.document_id,
        tax_id: user.tax_id || ''
      },
      printer_data: {
        company_name: printerProfile.company_name,
        rif: printerProfile.rif,
        providence_code: printerProfile.providence_code,
        providence_date: printerProfile.providence_date,
        control_number: String(printerProfile.control_range_start || '').trim(),
        control_range_start: printerProfile.control_range_start,
        control_range_end: printerProfile.control_range_end,
        control_assignment_date: printerProfile.control_assignment_date
      },
      status: 'paid'
    };

    if (!payload.items.length) {
      return res.status(400).json({ message: 'Debes enviar los items de la compra' });
    }

    const tx = await sequelize.transaction();

    try {

    let couponSnapshot = null;
    if (payload.coupon && typeof payload.coupon === 'object') {
      const couponId = payload.coupon.id;
      const couponCode = sanitize(payload.coupon.code).toUpperCase();

      const where = couponId ? { id: couponId } : (couponCode ? { code: couponCode } : null);
      if (where) {
        const coupon = await Coupon.findOne({ where, transaction: tx, lock: tx.LOCK.UPDATE });

        if (!coupon) {
          await tx.rollback();
          return res.status(400).json({ message: 'El cupon aplicado no existe' });
        }

        if (!coupon.is_active) {
          await tx.rollback();
          return res.status(400).json({ message: 'El cupon aplicado esta inactivo' });
        }

        if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
          await tx.rollback();
          return res.status(400).json({ message: 'El cupon aplicado esta vencido' });
        }

        if (coupon.usage_limit !== null && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
          await tx.rollback();
          return res.status(400).json({ message: 'El cupon aplicado ya alcanzo su limite de uso' });
        }

        await coupon.increment('used_count', { by: 1, transaction: tx });

        couponSnapshot = {
          id: coupon.id,
          code: coupon.code,
          discount_value: Number(coupon.discount_value || 0),
          used_count_before: Number(coupon.used_count || 0),
          used_count_after: Number(coupon.used_count || 0) + 1
        };
      }
    }

    if (couponSnapshot) {
      payload.coupon = {
        ...(payload.coupon || {}),
        ...couponSnapshot
      };
    }

      const created = await PurchaseInvoice.create(payload, { transaction: tx });
      await tx.commit();
      return res.status(201).json(created);
    } catch (_e) {
      try {
        await tx.rollback();
      } catch (__e) {
        // ignore rollback errors
      }
      return res.status(500).json({ message: 'Error registrando compra' });
    }
  } catch (_e) {
    return res.status(500).json({ message: 'Error registrando compra' });
  }
};

exports.getMineById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await PurchaseInvoice.findOne({ where: { id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ message: 'Factura no encontrada' });
    return res.json(item);
  } catch (_e) {
    return res.status(500).json({ message: 'Error obteniendo factura' });
  }
};

exports.getLatestMine = async (req, res) => {
  try {
    const item = await PurchaseInvoice.findOne({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    if (!item) return res.status(404).json({ message: 'No hay facturas registradas' });
    return res.json(item);
  } catch (_e) {
    return res.status(500).json({ message: 'Error obteniendo ultima factura' });
  }
};
