import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Plus, FolderOpen, ArrowRight, X, AlertCircle } from 'lucide-react'

function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Project name is required'); return }
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/projects', { name })
      onCreate(res.data) // ✅ instantly adds to list
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">New Project</h2>
          <button onClick={onClose} className="text-[#5a5a7a] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div>
            <label className="label">Project Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading
                ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                : null
              }
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects')
        setProjects(res.data)
      } catch (err) {
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ✅ Instantly adds new project to list without refresh
  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev])
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-[#5a5a7a] mt-1 text-sm">
            {user?.role === 'admin'
              ? 'Create and manage your team projects'
              : "Projects you're a member of"
            }
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-red-400">{error}</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen size={40} className="text-[#3a3a5a] mx-auto mb-3" />
          <h3 className="font-medium text-[#7a7a9a]">No projects yet</h3>
          <p className="text-sm text-[#4a4a6a] mt-1">
            {user?.role === 'admin'
              ? 'Create your first project to get started'
              : 'Ask an admin to add you to a project'
            }
          </p>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus size={14} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card p-5 hover:border-brand-600/30 transition-colors group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
                  <FolderOpen size={16} className="text-brand-400" />
                </div>
                <ArrowRight size={15} className="text-[#3a3a5a] group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <h3 className="font-semibold text-white text-sm">{project.name}</h3>
              <p className="text-xs text-[#4a4a6a] mt-1.5">
                by {project.users?.name || project.users?.email || 'You'}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleProjectCreated}
        />
      )}
    </div>
  )
}