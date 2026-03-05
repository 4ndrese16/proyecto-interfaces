#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcrypt');
const { User, initDB, sequelize } = require('../src/models');

async function main() {
  try {
    // initialize DB (run migrations / sync)
    if (typeof initDB === 'function') await initDB();

    const argv = process.argv.slice(2);
    // allow passing username and password as args: node create_admin.js admin secret
    const username = argv[0] || process.env.ADMIN_USER || 'admin';
    const password = argv[1] || process.env.ADMIN_PASS || 'admin123';

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      console.log(`User '${username}' already exists (id=${existing.id}).`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, role: 'admin' });
    console.log('Admin user created:');
    console.log({ id: user.id, username: user.username, role: user.role });
    console.log('Note: keep the password safe; it is not shown here.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user', err);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch(e) {}
  }
}

main();
