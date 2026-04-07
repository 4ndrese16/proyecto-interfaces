const { User } = require('../models');

function sanitize(value) {
  return String(value || '').trim();
}

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'full_name', 'email', 'fiscal_address', 'phone', 'document_id', 'tax_id']
    });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json(user);
  } catch (_e) {
    return res.status(500).json({ message: 'Error obteniendo perfil de usuario' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const payload = {
      full_name: sanitize(req.body.full_name),
      email: sanitize(req.body.email),
      fiscal_address: sanitize(req.body.fiscal_address),
      phone: sanitize(req.body.phone),
      document_id: sanitize(req.body.document_id),
      tax_id: sanitize(req.body.tax_id)
    };

    await user.update(payload);

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      ...payload
    });
  } catch (_e) {
    return res.status(500).json({ message: 'Error actualizando perfil de usuario' });
  }
};
