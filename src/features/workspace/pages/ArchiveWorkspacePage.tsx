import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WaitingApprovalCard } from '../components/WaitingApprovalCard'
import { RecentSuggestionsCard, type SuggestionItem } from '../components/RecentSuggestionsCard'
import { MembershipRequestsCard } from '../components/MembershipRequestsCard'
import { AccessRequestsCard } from '../components/AccessRequestsCard'
import { PeopleRolesCard } from '../components/PeopleRolesCard'
import { ExportMembersCard } from '../components/ExportMembersCard'
import { getJoinRequests, refreshCurrentUser, type JoinRequest } from '../../../services/api'
import {
  getChangeRequests,
  type ChangeRequestRecord,
} from '../../../services/workspaceApi'

const toSuggestion = (request: ChangeRequestRecord): SuggestionItem => {
  const payloadName =
    request.payload && typeof request.payload.name === 'string'
      ? request.payload.name
      : ''
  const status = request.status || 'PENDING'
  return {
    id: String(request.id),
    type: request.type === 'ADD_CHILD' ? 'Add' : 'Edit',
    name: request.memberName || payloadName || 'Unknown member',
    requester: request.requestedBy?.name || 'Unknown',
    status: status.charAt(0) + status.slice(1).toLowerCase(),
  }
}

export function ArchiveWorkspacePage() {
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([])
  const [pendingChanges, setPendingChanges] = useState<ChangeRequestRecord[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const [roleLabel, setRoleLabel] = useState('ADMIN')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    let isMounted = true
    const updateRole = (role?: string) => {
      const normalized = String(role || '').toUpperCase()
      setIsSuperAdmin(normalized === 'SUPER_ADMIN')
      if (normalized === 'SUPER_ADMIN') setRoleLabel('SUPER ADMIN')
      else if (normalized === 'ADMIN') setRoleLabel('ADMIN')
      else if (normalized) setRoleLabel(normalized)
    }

    try {
      const info = JSON.parse(localStorage.getItem('user_info') || '{}')
      updateRole(info.role)
    } catch {
      // ignore
    }

    refreshCurrentUser().then((me) => {
      if (!isMounted || !me) return
      updateRole(me.user.role)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      const [joinResult, pendingResult, allResult] = await Promise.allSettled([
        getJoinRequests('PENDING'),
        getChangeRequests('PENDING'),
        getChangeRequests(),
      ])
      if (!isMounted) return

      if (joinResult.status === 'fulfilled') {
        const list = Array.isArray(joinResult.value) ? joinResult.value : []
        setPendingRequests(list)
      } else {
        setPendingRequests([])
      }

      if (pendingResult.status === 'fulfilled') {
        setPendingChanges(pendingResult.value)
      } else {
        setPendingChanges([])
      }

      if (allResult.status === 'fulfilled') {
        setSuggestions(allResult.value.slice(0, 8).map(toSuggestion))
      } else {
        setSuggestions([])
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [reloadKey])

  const handleChangeResolved = (id: string) => {
    setPendingChanges((prev) => prev.filter((item) => String(item.id) !== id))
    setReloadKey((value) => value + 1)
  }

  return (
    <div
      className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center"
      style={{
        backgroundColor: '#d4c9a8',
      }}
    >
      <div className="max-w-4xl w-full space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8c7b64] mb-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {roleLabel}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#1c1a17] tracking-tight leading-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Archive workspace
            </h1>
          </div>

          <Link
            to="/"
            className="text-xs sm:text-sm font-semibold text-[#1c1a17] underline underline-offset-4 hover:opacity-75 transition-opacity self-start sm:self-auto mb-1 inline-flex items-center gap-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            ← Back to the tree
          </Link>
        </header>

        {/* Section 1: Waiting for approval */}
        <WaitingApprovalCard
          count={pendingChanges.length}
          items={pendingChanges}
          onResolved={handleChangeResolved}
        />

        {/* Section 2: Recent suggestions */}
        <RecentSuggestionsCard items={suggestions} />

        {/* Section 3: Membership requests */}
        <MembershipRequestsCard
          requests={pendingRequests}
          onResolved={(id) => {
            setPendingRequests((prev) => prev.filter((r) => r.id !== id))
          }}
        />

        {/* Section 4: Country access requests */}
        <AccessRequestsCard />

        {/* Section 5: People & roles */}
        <PeopleRolesCard />

        {/* Section 6: Export members (Super Admin only) */}
        {isSuperAdmin && <ExportMembersCard />}
      </div>
    </div>
  )
}
