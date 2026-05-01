const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

async function checkProjectAccess(projectId, userId, userRole) {
  if (userRole === 'admin') return true;
  const { data } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// POST /tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, status = 'todo', priority = 'medium', assigned_to, project_id, due_date } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const hasAccess = await checkProjectAccess(project_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const finalAssignee = req.user.role === 'admin' ? assigned_to : req.user.id;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,                          // ✅ new
        assigned_to: finalAssignee || null,
        project_id,
        due_date: due_date || null,
        created_by: req.user.id
      })
      .select('*, users!tasks_assigned_to_fkey(id, email, name)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks?project_id=xxx
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id query param is required' });
    }

    const hasAccess = await checkProjectAccess(project_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    let query = supabase
      .from('tasks')
      .select('*, users!tasks_assigned_to_fkey(id, email, name)')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    if (req.user.role === 'member') {
      query = query.eq('assigned_to', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /tasks/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role === 'member') {
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select('*, users!tasks_assigned_to_fkey(id, email, name)')
        .single();

      if (error) throw error;
      return res.json(data);
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;   // ✅ new
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (due_date !== undefined) updates.due_date = due_date || null;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, users!tasks_assigned_to_fkey(id, email, name)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete tasks' });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;