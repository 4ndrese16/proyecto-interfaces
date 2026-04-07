#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/../.env' });

const { CompanyProfile, PrinterProfile, initDB, sequelize } = require('../src/models');

async function main() {
  try {
    if (typeof initDB === 'function') await initDB();

    const companyPayload = {
      legal_name: 'Interfaces Mobile Store C.A.',
      fiscal_address: 'Av. Principal Las Delicias, Torre Norte, Piso 2, Caracas, Distrito Capital',
      rif: 'J-50321987-4'
    };

    const printerPayload = {
      company_name: 'Impresos Digitales Andinos, C.A.',
      rif: 'J-41234567-8',
      providence_code: 'GAT-DI-2026-0119',
      providence_date: '12/02/2026',
      control_number: '00-DC0101-00002001',
      control_range_start: '00-DC0101-00002001',
      control_range_end: '00-DC0101-00003000',
      control_assignment_date: '15/03/2026'
    };

    const company = await CompanyProfile.findOne({ order: [['id', 'DESC']] });
    if (company) {
      await company.update(companyPayload);
      console.log(`Datos fiscales de empresa actualizados (id=${company.id})`);
    } else {
      const createdCompany = await CompanyProfile.create(companyPayload);
      console.log(`Datos fiscales de empresa creados (id=${createdCompany.id})`);
    }

    const printer = await PrinterProfile.findOne({ order: [['id', 'DESC']] });
    if (printer) {
      await printer.update(printerPayload);
      console.log(`Datos de imprenta actualizados (id=${printer.id})`);
    } else {
      const createdPrinter = await PrinterProfile.create(printerPayload);
      console.log(`Datos de imprenta creados (id=${createdPrinter.id})`);
    }

    console.log('Listo. Ya puedes emitir facturas con datos fiscales ficticios de admin.');
    process.exit(0);
  } catch (error) {
    console.error('Error cargando datos fiscales ficticios:', error.message || error);
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
