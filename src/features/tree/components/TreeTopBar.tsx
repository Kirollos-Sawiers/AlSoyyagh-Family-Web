import { Link, useNavigate } from 'react-router-dom'
import { Menu, LogOut, Shield, Layers, ArrowLeft, Lock } from 'lucide-react'
import { BranchType } from '../types'

interface TreeTopBarProps {
  activeBranch: BranchType
  onSelectBranch: (branch: BranchType) => void
  onToggleSidebarMobile: () => void
  onToggleListView?: () => void
  isListView?: boolean
  lockedBranches?: Array<'Egypt' | 'Jordan'>
  onBack?: () => void
  backLabel?: string
}

export function TreeTopBar({
  activeBranch,
  onSelectBranch,
  onToggleSidebarMobile,
  onToggleListView,
  isListView = false,
  lockedBranches = [],
  onBack,
  backLabel = 'All children',
}: TreeTopBarProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem('auth_token')
  const userJson = localStorage.getItem('user_info')

  let userName = ''
  let userRole = ''

  if (userJson) {
    try {
      const parsed = JSON.parse(userJson)
      if (parsed.firstName || parsed.lastName) {
        userName = `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim()
      } else if (parsed.name || parsed.fullName) {
        userName = parsed.name || parsed.fullName
      } else if (parsed.email) {
        userName = parsed.email
      }

      const rawRole = String(parsed.role || '').toUpperCase()
      if (rawRole === 'SUPER_ADMIN') userRole = 'super admin'
      else if (rawRole === 'ADMIN') userRole = 'admin'
      else if (rawRole === 'CONTRIBUTOR') userRole = 'contributor'
      else if (rawRole === 'USER') userRole = 'member'
      else if (rawRole) userRole = rawRole.toLowerCase()
    } catch {
      // ignore
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    navigate('/login')
  }

  return (
    <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#f5ede1] border-b border-[#ded4c1] flex items-center justify-between gap-3 shrink-0 z-20 select-none">
      {/* Left Section: Mobile Menu + Branch Selector + User Info */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebarMobile}
          className="sm:hidden p-2 rounded-xl text-[#3a2f21] hover:bg-[#eae0cf] active:bg-[#dfd3be] transition-colors"
          title="Open Menu & Search"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branch Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#e8ded0] border border-[#d8ccbb]">
          <button
            onClick={() => onSelectBranch('Egypt')}
            className={`inline-flex items-center gap-1 px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
              activeBranch === 'Egypt'
                ? 'bg-[#1c1a17] text-white shadow-xs'
                : 'text-[#4d4233] hover:text-[#1c1a17] hover:bg-[#dfd4c4]'
            }`}
          >
            {lockedBranches.includes('Egypt') && <Lock className="w-3 h-3" />}
            Egypt
          </button>

          <button
            onClick={() => onSelectBranch('Jordan')}
            className={`inline-flex items-center gap-1 px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
              activeBranch === 'Jordan'
                ? 'bg-[#1c1a17] text-white shadow-xs'
                : 'text-[#4d4233] hover:text-[#1c1a17] hover:bg-[#dfd4c4]'
            }`}
          >
            {lockedBranches.includes('Jordan') && <Lock className="w-3 h-3" />}
            Jordan
          </button>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#4d4233] bg-[#e8ded0] hover:bg-[#dfd4c4] transition-colors"
            title={backLabel}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}

        {/* User Identity Display */}
        {token && userName && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#7d705d] truncate">
            <span className="font-semibold text-[#3b3225]">{userName}</span>
            {userRole && (
              <>
                <span className="text-[#a49683]">·</span>
                <span className="font-medium text-[#7d705d] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#9b8054]" />
                  {userRole}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Mobile Search shortcut, Workspace link, Sign in / Sign out */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* View mode toggle for mobile & tablet (Tree Canvas vs Indexed List) */}
        {onToggleListView && (
          <button
            onClick={onToggleListView}
            className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#e8ded0] hover:bg-[#dfd4c4] text-[#3a2f21] transition-colors"
            title="Toggle between Tree View and List View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isListView ? 'Tree' : 'List'}</span>
          </button>
        )}

        {/* Workspace link */}
        <Link
          to="/workspace"
          className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-[#2c2317] hover:bg-[#e8ded0] transition-colors"
        >
          Workspace
        </Link>

        {/* Sign In / Sign Out */}
        {token ? (
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[#746755] hover:text-[#1c1a17] hover:bg-[#e8ded0] transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[#746755] hover:text-[#1c1a17] hover:bg-[#e8ded0] transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
