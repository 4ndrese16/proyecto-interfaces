#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/../.env' });

const { User, initDB, sequelize } = require('../src/models');

async function main() {
  try {
    if (typeof initDB === 'function') await initDB();

    const users = await User.findAll();
    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      if (user.role !== 'customer' && user.role !== 'admin') {
        skipped += 1;
        continue;
      }

      const isAdmin = user.role === 'admin';
      const payload = {
        full_name: user.full_name || (isAdmin ? `Administrador ${user.username}` : `Cliente ${user.username}`),
        email: user.email || `${user.username}@correo.test`,
        fiscal_address: user.fiscal_address || (isAdmin ? 'Oficina Central Admin, Zona Empresarial' : 'Av. Ficticia 123, Zona Centro'),
        phone: user.phone || '+59170000000',
        document_id: user.document_id || `${isAdmin ? 'ADM' : 'DOC'}-${String(user.id).padStart(5, '0')}`,
        tax_id: user.tax_id || ''
      };

      await user.update(payload);
      updated += 1;
    }

    console.log(`Usuarios customer/admin actualizados con datos de facturacion ficticios: ${updated}`);
    if (skipped > 0) {
      console.log(`Usuarios omitidos por rol no soportado: ${skipped}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error cargando datos ficticios de usuarios:', error.message || error);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch (_e) {
      // ignore close errors
    }
  }
}

main();
