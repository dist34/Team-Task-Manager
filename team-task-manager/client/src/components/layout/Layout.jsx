import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare, Shield, User } from 'lucide-react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f14]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#12121a] border-r border-[#1e1e2e]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <CheckSquare size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm text-white leading-tight" style={{ fontWeight: 700 }}>TaskFlow</h1>
              <p className="text-xs text-[#4a4a6a]">Team Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/20'
                  : 'text-[#7a7a9a] hover:text-[#c0c0e0] hover:bg-[#1e1e2e]'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/20'
                  : 'text-[#7a7a9a] hover:text-[#c0c0e0] hover:bg-[#1e1e2e]'
              }`
            }
          >
            <FolderKanban size={16} />
            Projects
          </NavLink>
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a26]">
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
              {user?.role === 'admin'
                ? <Shield size={13} className="text-brand-300" />
                : <User size={13} className="text-brand-300" />
              }
            </div>
            <div className="flex-1 min-w-0">
              {/* ✅ Show name if available, fallback to email */}
              <p className="text-xs text-[#c0c0e0] truncate font-medium">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-[#5a5a7a] capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[#5a5a7a] hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}