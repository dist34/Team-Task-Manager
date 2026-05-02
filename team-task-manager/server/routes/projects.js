const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// POST /projects - Admin only
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), created_by: req.user.id })
      .select('*, users!projects_created_by_fkey(email, name)')
      .single();

    if (error) throw error;

    // Auto-add creator as project member
    await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: req.user.id,
      role: 'admin'
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', req.user.id);

      // ✅ Filter out any null/invalid UUIDs
      const projectIds = (memberProjects || [])
        .map(m => m.project_id)
        .filter(id => id && id !== 'null' && id !== null)

      if (projectIds.length === 0) return res.json([]);

      const { data, error } = await supabase
        .from('projects')
        .select('*, users!projects_created_by_fkey(email, name)')
        .in('id', projectIds);

      if (error) throw error;
      return res.json(data);
    } else {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, projects(*, users!projects_created_by_fkey(email, name))')
        .eq('user_id', req.user.id);

      if (error) throw error;
      const projects = data
        .map(m => m.projects)
        .filter(Boolean) // ✅ Filter out null projects
      return res.json(projects);
    }
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', req.user.id)
      .single();

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.created_by !== req.user.id && !membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: members } = await supabase
      .from('project_members')
      .select('*, users(id, email, name, role)')
      .eq('project_id', id);

    res.json({ ...project, members: members || [] });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /projects/:id/add-member - Admin only
router.post('/:id/add-member', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found. They must sign up first.' });
    }

    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const { data, error } = await supabase
      .from('project_members')
      .insert({ project_id: id, user_id: user.id, role })
      .select('*, users(id, email, name, role)')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /projects/:id/remove-member/:userId - Admin only
router.delete('/:id/remove-member/:userId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id, userId } = req.params;

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;