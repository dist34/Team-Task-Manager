import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/ui/TaskCard'
import {
  ArrowLeft, Plus, UserPlus, X, AlertCircle,
  Users, ClipboardList, FolderOpen
} from 'lucide-react'

// ---- Add Member Modal ----
function AddMemberModal({ projectId, onClose, onAdd }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.post(`/projects/${projectId}/add-member`, { email })
      onAdd(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Member</h2>
          <button onClick={onClose} className="text-[#5a5a7a] hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div>
            <label className="label">Member Email</label>
            <input
              type="email"
              className="input"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-[#4a4a6a] mt-1.5">User must have an existing account</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Create Task Modal ----
function CreateTaskModal({ projectId, members, onClose, onCreate }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '', description: '', status: 'todo',
    priority: 'medium', assigned_to: '', due_date: ''  // ✅ priority added
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        project_id: projectId,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
      }
      const res = await api.post('/tasks', payload)
      onCreate(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Create Task</h2>
          <button onClick={onClose} className="text-[#5a5a7a] hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="label">Title *</label>
            <input type="text" className="input" placeholder="Task title"
              value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Optional description..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {user?.role === 'admin' && (
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={form.assigned_to}
                onChange={e => set('assigned_to', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.users?.name || m.users?.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={e => set('priority', e.target.value)}>
                <option value="low">↓ Low</option>
                <option value="medium">→ Medium</option>
                <option value="high">↑ High</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status}
                onChange={e => set('status', e.target.value)}>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.due_date}
              onChange={e => set('due_date', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Main Page ----
export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')
  const [removingMember, setRemovingMember] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks?project_id=${id}`)
        ])
        setProject(projRes.data)
        setTasks(tasksRes.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load project')
      } finally {
        setLoading(false)
        setTasksLoading(false)
      }
    }
    load()
  }, [id])

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return
    setRemovingMember(memberId)
    try {
      await api.delete(`/projects/${id}/remove-member/${memberId}`)
      setProject(p => ({ ...p, members: p.members.filter(m => m.user_id !== memberId) }))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member')
    } finally {
      setRemovingMember(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card p-6 text-center text-red-400">{error}</div>
      </div>
    )
  }

  const members = project?.members || []
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back + header */}
      <div className="mb-6">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm text-[#5a5a7a] hover:text-[#a0a0c0] transition-colors mb-4">
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
              <FolderOpen size={18} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
              <p className="text-sm text-[#4a4a6a]">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <>
                <button onClick={() => setShowAddMember(true)} className="btn-secondary flex items-center gap-2 text-sm">
                  <UserPlus size={14} />
                  Add Member
                </button>
                <button onClick={() => setShowCreateTask(true)} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={14} />
                  New Task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            {overdueTasks.length} task{overdueTasks.length > 1 ? 's are' : ' is'} overdue in this project
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2a2a3d]">
        {[
          { id: 'tasks', label: 'Tasks', icon: ClipboardList, count: tasks.length },
          { id: 'members', label: 'Members', icon: Users, count: members.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-[#5a5a7a] hover:text-[#a0a0c0]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className="bg-[#2a2a3d] text-[#7a7a9a] text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          {tasksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="card p-12 text-center">
              <ClipboardList size={36} className="text-[#3a3a5a] mx-auto mb-3" />
              <p className="text-[#7a7a9a] font-medium">No tasks yet</p>
              {user?.role === 'admin' && (
                <button onClick={() => setShowCreateTask(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Plus size={14} />
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={(updated) => setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))}
                  onDelete={(deletedId) => setTasks(ts => ts.filter(t => t.id !== deletedId))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-2 animate-fade-in">
          {members.length === 0 ? (
            <div className="card p-10 text-center">
              <Users size={36} className="text-[#3a3a5a] mx-auto mb-3" />
              <p className="text-[#7a7a9a]">No members yet</p>
            </div>
          ) : (
            members.map(member => (
              <div key={member.user_id} className="card px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2a2a3d] flex items-center justify-center text-xs font-medium text-[#8080a0] uppercase">
                    {member.users?.email?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-white">{member.users?.email}</p>
                    <p className="text-xs text-[#5a5a7a] capitalize">{member.users?.role || member.role}</p>
                  </div>
                </div>
                {user?.role === 'admin' && member.user_id !== user.id && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={removingMember === member.user_id}
                    className="text-[#3a3a5a] hover:text-red-400 transition-colors p-1"
                  >
                    {removingMember === member.user_id
                      ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
                      : <X size={13} />}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdd={() => {
            api.get(`/projects/${id}`).then(res => {
              setProject(res.data)
            })
          }}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          members={members}
          onClose={() => setShowCreateTask(false)}
          onCreate={() => {
            api.get(`/tasks?project_id=${id}`).then(res => {
              setTasks(res.data)
            })
          }}
        />
      )}
    </div>
  )
}