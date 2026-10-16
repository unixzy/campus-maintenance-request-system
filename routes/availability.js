const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/technician/availability', requireRole('technician'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_available = NOT is_available WHERE id = ?',
      [req.session.user.id]
    );
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

module.exports = router;