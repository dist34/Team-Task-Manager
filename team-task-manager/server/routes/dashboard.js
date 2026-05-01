const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// GET /dashboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tasksQuery;

    if (req.user.role === 'admin') {
      // Admins see all tasks across their projects
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', req.user.id);

      const projectIds = (memberProjects || []).map(m => m.project_id);

      if (projectIds.length === 0) {
        return res.json({
          total: 0, completed: 0, pending: 0,
          inProgress: 0, overdue: 0, tasksByUser: []
        });
      }

      tasksQuery = supabase
        .from('tasks')
        .select('id, status, due_date, assigned_to, users!tasks_assigned_to_fkey(id, name, email)')
        .in('project_id', projectIds);
    } else {
      // Members see only their assigned tasks
      tasksQuery = supabase
        .from('tasks')
        .select('id, status, due_date, assigned_to, users!tasks_assigned_to_fkey(id, name, email)')
        .eq('assigned_to', req.user.id);
    }

    const { data: tasks, error } = await tasksQuery;
    if (error) throw error;

    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'todo').length;
    const overdue = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < now && t.status !== 'done'
    ).length;

    // ✅ Tasks per user
    const userMap = {}
    tasks.forEach(task => {
      if (!task.assigned_to) return;
      const uid = task.assigned_to;
      if (!userMap[uid]) {
        userMap[uid] = {
          userId: uid,
          name: task.users?.name || task.users?.email || 'Unknown',
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
        }
      }
      userMap[uid].total++
      if (task.status === 'done') userMap[uid].completed++
      else if (task.status === 'in-progress') userMap[uid].inProgress++
      else userMap[uid].pending++
    })

    const tasksByUser = Object.values(userMap).sort((a, b) => b.total - a.total)

    res.json({ total, completed, pending, inProgress, overdue, tasksByUser })
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;