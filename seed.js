const bcrypt = require('bcrypt');
const db = require('./config/db');

async function seed() {
  const password = await bcrypt.hash('password123', 10);

  const users = [
    ['Admin User', 'admin@campus.edu', password, 'admin'],
    ['Supervisor User', 'supervisor@campus.edu', password, 'supervisor'],
    ['Technician User', 'technician@campus.edu', password, 'technician'],
    ['Requester User', 'requester@campus.edu', password, 'requester']
  ];

  for (const [name, email, password_hash, role] of users) {
    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    console.log(`Created ${role}: ${email}`);
  }

  process.exit();
}

seed();