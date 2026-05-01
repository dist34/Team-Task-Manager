const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// POST /auth/sync - kept for safety but trigger handles it now
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', req.user.id)
      .single();

    if (existing) return res.json(existing);

    // Fallback if trigger didn't fire
    const { data, error } = await supabase
      .from('users')
      .insert({ id: req.user.id, email: req.user.email, role: 'member' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json(req.user);
});

// GET /auth/users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .order('email');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;