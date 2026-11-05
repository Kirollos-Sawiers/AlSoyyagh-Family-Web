import { useEffect, useState } from 'react'
import {
  getApiErrorMessage,
  isForbiddenError,
  refreshCurrentUser,
} from '../../../services/api'
import {
  approveAccessRequest,
  getAccessRequests,
  rejectAccessRequest,
  type AccessRequestRecord,
} from '../../../services/workspaceApi'

interface AccessRequestsCardProps {
  onResolved?: (id: string) => void
}

const formatTree = (tree: string) =>
  tree ? tree.charAt(0).toUpperCase() + tree.slice(1).toLowerCase() : tree

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()
}

export function AccessRequestsCard({ onResolved }: AccessRequestsCardProps) {
  const [requests, setRequests] = useState<AccessRequestRecord[]>([])
  const [role, setRole] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const [me, list] = await Promise.allSettled([
        refreshCurrentUser(),
        getAccessRequests('PENDING'),
      ])
      if (!isMounted) return

      if (me.status === 'fulfilled' && me.value) {
        setRole(String(me.value.user.role || '').toUpperCase())
      }
      if (list.status === 'fulfilled') {
        setRequests(list.value)
      } else {
        setError(getApiErrorMessage(list.reason))
      }
      setIsLoading(false)
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const syncPermissions = async () => {
    const me = await refreshCurrentUser()
    if (me) setRole(String(me.user.role || '').toUpperCase())
  }

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    setError(null)
    try {
      if (action === 'approve') {
        await approveAccessRequest(id)
      } else {
        await rejectAccessRequest(id)
      }
      setRequests((prev) => prev.filter((item) => item.id !== id))
      onResolved?.(id)
    } catch (reviewError) {
      if (isForbiddenError(reviewError)) await syncPermissions()
      setError(getApiErrorMessage(reviewError))
    } finally {
      setProcessingId(null)
    }
  }

  if (!isLoading && !isAdmin) return null

  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <h2
        className="text-xl sm:text-2xl font-bold mb-4 text-[#1c1a17]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Country access requests ({requests.length})
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <p
          className="text-xs text-[#8a7f6e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Loading requests…
        </p>
      ) : requests.length === 0 ? (
        <p
          className="text-xs text-[#8a7f6e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          No pending country access requests.
        </p>
      ) : (
        <div className="divide-y divide-[#e6ded0]">
          {requests.map((item) => {
            const requestedAt = formatDate(item.createdAt)
            return (
              <div
                key={item.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div
                  className="text-xs text-[#1c1a17] min-w-0"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[#1c1a17]">
                      {item.user?.name || 'Unknown user'}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#ece3d2] text-[#554e42] text-[10px] font-bold uppercase tracking-wide">
                      {formatTree(item.tree)}
                    </span>
                  </div>
                  <div className="text-[#8a7f6e] mt-1">
                    {item.user?.email || 'No email'}
                    {requestedAt ? ` · ${requestedAt}` : ''}
                  </div>
                </div>

                {isAdmin ? (
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleReview(item.id, 'approve')}
                        disabled={processingId === item.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {processingId === item.id ? 'Working…' : 'Approve'}
                      </button>
                    ) : (
                      <span
                        className="text-[10px] font-medium text-[#8a7f6e] italic"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Super admin approval required
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReview(item.id, 'reject')}
                      disabled={processingId === item.id}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#ccc4ae] text-[#554e42] hover:bg-[#ece3d2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-[#8a7f6e] italic shrink-0">
                    Pending review
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
