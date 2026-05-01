import { useState } from 'react'
import { Calendar, User, Trash2, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function isOverdue(task) {
  return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
}

function StatusBadge({ status }) {
  const map = {
    'todo': 'badge-todo',
    'in-progress': 'badge-in-progress',
    'done': 'badge-done',
  }
  const labels = { 'todo': 'Todo', 'in-progress': 'In Progress', 'done': 'Done' }
  return <span className={map[status] || 'badge-todo'}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const map = {
    'low': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    'medium': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'high': 'bg-red-500/15 text-red-300 border-red-500/30',
  }
  const labels = { 'low': '↓ Low', 'medium': '→ Medium', 'high': '↑ High' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[priority] || map['medium']}`}>
      {labels[priority] || priority}
    </span>
  )
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const { user } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const overdue = isOverdue(task)
  const canChangeStatus = user?.role === 'admin' || task.assigned_to === user?.id

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    setUpdating(true)
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: newStatus })
      onUpdate(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return
    setDeleting(true)
    try {
      await api.delete(`/tasks/${task.id}`)
      onDelete(task.id)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task')
      setDeleting(false)
    }
  }

  return (
    <div className={`card p-4 flex flex-col gap-3 transition-colors ${overdue ? 'border-red-500/30 bg-red-500/5' : 'hover:border-[#3a3a52]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{task.title}</h3>
            {overdue && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle size={11} /> Overdue
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-[#5a5a7a] mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[#3a3a5a] hover:text-red-400 transition-colors flex-shrink-0 p-1"
          >
            {deleting
              ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
              : <Trash2 size={13} />
            }
          </button>
        )}
      </div>

      {/* Priority + Meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <PriorityBadge priority={task.priority || 'medium'} />
        {task.users && (
          <span className="flex items-center gap-1 text-xs text-[#5a5a7a]">
            <User size={11} />
            {task.users.name || task.users.email}
          </span>
        )}
        {task.due_date && (
          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-[#5a5a7a]'}`}>
            <Calendar size={11} />
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <StatusBadge status={task.status} />
        {canChangeStatus && (
          <select
            value={task.status}
            onChange={handleStatusChange}
            disabled={updating}
            className="text-xs bg-[#1e1e2e] border border-[#2a2a3d] text-[#8080a0] rounded-md px-2 py-1 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            {user?.role === 'admin' ? (
              // ✅ Admin sees all 3 options
              <>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </>
            ) : (
              // ✅ Member only sees in-progress and done
              <>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </>
            )}
          </select>
        )}
      </div>
    </div>
  )
}