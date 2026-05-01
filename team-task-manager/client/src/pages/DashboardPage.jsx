import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  CheckCircle2, Clock, AlertTriangle,
  ListTodo, ArrowRight, User
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-[#5a5a7a] text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function UserTaskRow({ u }) {
  const pct = u.total > 0 ? Math.round((u.completed / u.total) * 100) : 0
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1e1e2e] last:border-0">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-brand-200 uppercase">
          {u.name?.[0] || '?'}
        </span>
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-white truncate">{u.name}</p>
          <span className="text-xs text-[#5a5a7a] ml-2 flex-shrink-0">{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#2a2a3d] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs flex-shrink-0">
        <span className="text-[#5a5a7a]">{u.total} task</span>
        <span className="text-emerald-400">{u.completed} done</span>
        {u.inProgress > 0 && <span className="text-amber-400">{u.inProgress} active</span>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard')
        setStats(res.data)
      } catch (err) {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good morning, {user?.name || 'there'} 👋
        </h1>
        <p className="text-[#5a5a7a] mt-1 text-sm capitalize">
          {user?.role} dashboard
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ListTodo}
              label="Total Tasks"
              value={stats?.total ?? 0}
              color="text-brand-400"
              bgColor="bg-brand-600/15"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={stats?.completed ?? 0}
              color="text-emerald-400"
              bgColor="bg-emerald-500/15"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={stats?.inProgress ?? 0}
              color="text-amber-400"
              bgColor="bg-amber-500/15"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={stats?.overdue ?? 0}
              color="text-red-400"
              bgColor="bg-red-500/15"
            />
          </div>

          {/* Progress bar */}
          {stats?.total > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-[#a0a0c0]">Overall Progress</h2>
                <span className="text-sm font-medium text-white">
                  {Math.round((stats.completed / stats.total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[#2a2a3d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#5a5a7a]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {stats.completed} done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {stats.inProgress} in progress
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  {stats.pending} todo
                </span>
                {stats.overdue > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {stats.overdue} overdue
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ✅ Tasks per user - admin only */}
          {user?.role === 'admin' && stats?.tasksByUser?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-[#5a5a7a]" />
                <h2 className="text-sm font-medium text-[#a0a0c0]">Tasks by Team Member</h2>
              </div>
              <div>
                {stats.tasksByUser.map(u => (
                  <UserTaskRow key={u.userId} u={u} />
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/projects"
              className="card p-5 flex items-center justify-between group hover:border-brand-600/30 transition-colors"
            >
              <div>
                <h3 className="font-medium text-white">View Projects</h3>
                <p className="text-sm text-[#5a5a7a] mt-0.5">Manage your team projects</p>
              </div>
              <ArrowRight size={18} className="text-[#3a3a5a] group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
            </Link>

            {stats?.overdue > 0 && (
              <div className="card p-5 border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-400" />
                  <h3 className="font-medium text-red-300">Attention Needed</h3>
                </div>
                <p className="text-sm text-red-400/70">
                  You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''} that need attention.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}