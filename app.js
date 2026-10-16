require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const pool = require('./config/db');
const availabilityRoutes = require('./routes/availability');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

const { requireAuth, requireRole } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
app.use(availabilityRoutes);


app.use(authRoutes);

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('home');
});

app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    let isAvailable = null;
    if (req.session.user.role === 'technician') {
      const [rows] = await pool.query(
        'SELECT is_available FROM users WHERE id = ?',
        [req.session.user.id]
      );
      isAvailable = rows[0].is_available === 1;
    }
    res.render('dashboard', { user: req.session.user, isAvailable });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

// Temporary route to test role restriction
app.get('/admin/users', requireRole('admin'), (req, res) => {
  res.send('Admin only page');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});