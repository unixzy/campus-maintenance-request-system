const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

const messages = {
  created: 'Technician account created.',
  updated: 'User status updated.'
};

async function renderPage(req, res, { status = 200, error = null, form = null } = {}) {
  const [users] = await pool.query(
    'SELECT id, name, email, role, specialty, is_active FROM users ORDER BY role, name'
  );
  res.status(status).render('admin-users', {
    user: req.session.user,
    users,
    error,
    success: messages[req.query.msg] || null,
    form: form || { name: '', email: '', specialty: '' }
  });
}

router.get('/admin/users', requireRole('admin'), async (req, res) => {
  try {
    await renderPage(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

router.post('/admin/users', requireRole('admin'), async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const specialty = (req.body.specialty || '').trim();
  const password = req.body.password || '';
  const form = { name, email, specialty };

  const fail = (msg) => renderPage(req, res, { status: 400, error: msg, form });

  try {
    if (!name || !email || !password) return await fail('Name, email, and password are required.');
    if (name.length < 2 || name.length > 100) return await fail('Name must be 2 to 100 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return await fail('Enter a valid email address.');
    if (specialty.length > 50) return await fail('Specialty must be 50 characters or fewer.');
    if (password.length < 8) return await fail('Temporary password must be at least 8 characters.');

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return await fail('That email is already registered.');

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, specialty) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, 'technician', specialty || null]
    );
    res.redirect('/admin/users?msg=created');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

router.post('/admin/users/:id/toggle', requireRole('admin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).send('Invalid user.');

  try {
    if (id === req.session.user.id) {
      return await renderPage(req, res, { status: 400, error: 'You cannot deactivate your own account.' });
    }
    await pool.query('UPDATE users SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?', [id]);
    res.redirect('/admin/users?msg=updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

module.exports = router;