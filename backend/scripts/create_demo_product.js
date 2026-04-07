#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/../.env' });

const fs = require('fs');
const path = require('path');
const { Product, initDB, sequelize } = require('../src/models');

const PRODUCT_NAME = 'Xiaomi 15 Ultra (Demo)';
const SOURCE_IMAGE = path.join(
  __dirname,
  '..',
  '..',
  'frontend',
  'proyecto-interfaces',
  'src',
  'assets',
  'images',
  'interfaces',
  'xiaomi_15_ultra_product.png'
);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');
const TARGET_IMAGE_FILE = 'seed-xiaomi_15_ultra_product.png';
const TARGET_IMAGE_PATH = path.join(UPLOADS_DIR, TARGET_IMAGE_FILE);
const PUBLIC_IMAGE_PATH = `/uploads/products/${TARGET_IMAGE_FILE}`;

async function main() {
  try {
    if (typeof initDB === 'function') await initDB();

    if (!fs.existsSync(SOURCE_IMAGE)) {
      throw new Error(`No se encontro la imagen fuente: ${SOURCE_IMAGE}`);
    }

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    if (!fs.existsSync(TARGET_IMAGE_PATH)) {
      fs.copyFileSync(SOURCE_IMAGE, TARGET_IMAGE_PATH);
      console.log('Imagen copiada a uploads/products');
    } else {
      console.log('La imagen ya existe en uploads/products, se reutiliza');
    }

    const existing = await Product.findOne({ where: { name: PRODUCT_NAME } });

    const payload = {
      product_code: 'XIAOMI-15-ULTRA-DEMO',
      name: PRODUCT_NAME,
      description: 'Smartphone insignia de Xiaomi con camaras Leica y bateria de gran capacidad.',
      price: 9999.99,
      category: 'telefono',
      brand: 'Xiaomi',
      is_new: true,
      has_discount: true,
      discount_percentage: 10,
      is_active: true,
      main_image_path: PUBLIC_IMAGE_PATH,
      variants: [
        {
          color_name: 'Negro',
          color_hex: '#1f1f1f',
          image_path: PUBLIC_IMAGE_PATH
        },
        {
          color_name: 'Blanco',
          color_hex: '#f2f2f2',
          image_path: PUBLIC_IMAGE_PATH
        },
        {
          color_name: 'Verde',
          color_hex: '#5f7d69',
          image_path: PUBLIC_IMAGE_PATH
        }
      ]
    };

    if (existing) {
      await existing.update(payload);
      console.log(`Producto demo actualizado (id=${existing.id}).`);
    } else {
      const created = await Product.create(payload);
      console.log(`Producto demo creado (id=${created.id}).`);
    }

    console.log('Listo. Puedes abrir Home para ver el ProductCard con el Xiaomi 15 Ultra.');
    process.exit(0);
  } catch (error) {
    console.error('Error creando producto demo:', error.message || error);
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
