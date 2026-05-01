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
      .select()
      .single();

    if (error) throw error;

    // Auto-add creator as project member with admin role
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

// GET /projects - user-specific (admin sees all they created, members see their projects)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query;

    if (req.user.role === 'admin') {
      // Admins see projects they created OR are members of
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', req.user.id);

      const projectIds = (memberProjects || []).map(m => m.project_id);

      const { data, error } = await supabase
        .from('projects')
        .select('*, users!projects_created_by_fkey(email)')
        .or(`created_by.eq.${req.user.id},id.in.(${projectIds.length ? projectIds.join(',') : 'null'})`);

      if (error) throw error;
      return res.json(data);
    } else {
      // Members see only projects they're added to
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, projects(*, users!projects_created_by_fkey(email))')
        .eq('user_id', req.user.id);

      if (error) throw error;
      const projects = data.map(m => m.projects).filter(Boolean);
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

    // Check access
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

    // Allow if creator, member, or admin
    if (project.created_by !== req.user.id && !membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get members
    const { data: members } = await supabase
      .from('project_members')
      .select('*, users(id, email, role)')
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

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found. They must sign up first.' });
    }

    // Check if already a member
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
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ ...data, user });
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