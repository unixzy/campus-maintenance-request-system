const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null, email: '' });
});

router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';
  const selectedRole = req.body.role || '';

  if (!email || !password || !selectedRole) {
    return res.status(400).render('login', { error: 'Role, email and password are required.', email });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];
    console.log('Login check:', {
    found: !!user,
    active: user && user.is_active,
    roleInDb: user && user.role,
    roleSelected: selectedRole,
    passwordOk: user ? await bcrypt.compare(password, user.password_hash) : null
    });
    const valid = user && user.is_active === 1 && user.role === selectedRole
      && (await bcrypt.compare(password, user.password_hash));

    if (!valid) {
      return res.status(401).render('login', { error: 'Invalid email or password.', email });
    }

    req.session.regenerate((err) => {
      if (err) return res.status(500).send('Something went wrong. Please try again.');
      req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      res.redirect('/dashboard');
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

router.get('/register', (req, res) => {
  res.render('register', { error: null, form: { name: '', email: '' } });
});

router.post('/register', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const confirm = req.body.confirm || '';
  const form = { name, email };

  const fail = (msg) => res.status(400).render('register', { error: msg, form });

  if (!name || !email || !password) return fail('All fields are required.');
  if (name.length < 2 || name.length > 100) return fail('Name must be 2 to 100 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
  if (password.length < 8) return fail('Password must be at least 8 characters.');
  if (password !== confirm) return fail('Passwords do not match.');

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return fail('That email is already registered.');

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'requester']
    );
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});



module.exports = router;