import { useEffect, useState } from 'react'
import {
  approveJoinRequest,
  getApiErrorMessage,
  getJoinRequests,
  isForbiddenError,
  refreshCurrentUser,
  rejectJoinRequest,
  type JoinRequest,
  type JoinRequestRole,
  type JoinRequestTree,
} from '../../../services/api'

export interface MembershipRequestItem {
  id: string
  name: string
  email: string
  phone: string
  relation?: string
}

interface MembershipRequestForm {
  tempPassword: string
  role: JoinRequestRole
  trees: JoinRequestTree[]
  reason: string
}

const DEFAULT_ROLE: JoinRequestRole = 'USER'
const DEFAULT_TREES: JoinRequestTree[] = ['EGYPT', 'JORDAN']

interface MembershipRequestsCardProps {
  requests?: JoinRequest[] | MembershipRequestItem[]
  onResolved?: (id: string) => void
}

const createInitialForm = (): MembershipRequestForm => ({
  tempPassword: '',
  role: DEFAULT_ROLE,
  trees: [...DEFAULT_TREES],
  reason: '',
})

const mapRequest = (
  request: JoinRequest | MembershipRequestItem,
): MembershipRequestItem => {
  const record = request as JoinRequest
  return {
    id: String(request.id),
    name: record.name || record.fullName || request.email || '',
    email: request.email || '',
    phone: request.phone || '',
    relation: request.relation || undefined,
  }
}

export function MembershipRequestsCard({
  requests: initialRequests,
  onResolved,
}: MembershipRequestsCardProps = {}) {
  const [requests, setRequests] = useState<MembershipRequestItem[]>([])
  const [formData, setFormData] = useState<Record<string, MembershipRequestForm>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [notification, setNotification] = useState<{
    id: string
    type: 'success' | 'info' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    let isMounted = true
    try {
      const info = JSON.parse(localStorage.getItem('user_info') || '{}')
      setIsSuperAdmin(String(info.role || '').toUpperCase() === 'SUPER_ADMIN')
    } catch {
      // ignore
    }

    refreshCurrentUser().then((me) => {
      if (!isMounted || !me) return
      setIsSuperAdmin(String(me.user.role || '').toUpperCase() === 'SUPER_ADMIN')
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (Array.isArray(initialRequests)) {
      const mapped = initialRequests.map(mapRequest)
      setRequests(mapped)
      const initialForm: Record<string, MembershipRequestForm> = {}
      mapped.forEach((m) => {
        initialForm[m.id] = createInitialForm()
      })
      setFormData(initialForm)
      return
    }

    let isMounted = true
    const fetch = async () => {
      try {
        const data = await getJoinRequests('PENDING')
        if (!isMounted) return
        if (Array.isArray(data)) {
          const mapped = data.map(mapRequest)
          setRequests(mapped)
          const initialForm: Record<string, MembershipRequestForm> = {}
          mapped.forEach((m) => {
            initialForm[m.id] = createInitialForm()
          })
          setFormData(initialForm)
        }
      } catch {
        // ignore
      }
    }
    fetch()
    return () => {
      isMounted = false
    }
  }, [initialRequests])

  const handleInputChange = (id: string, field: 'tempPassword' | 'role' | 'reason', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || createInitialForm()),
        [field]: value,
      },
    }))
  }

  const handleTreeToggle = (id: string, tree: JoinRequestTree) => {
    setFormData((prev) => {
      const current = prev[id] || createInitialForm()
      const trees = current.trees.includes(tree)
        ? current.trees.filter((t) => t !== tree)
        : [...current.trees, tree]
      return {
        ...prev,
        [id]: { ...current, trees },
      }
    })
  }

  const showNotification = (id: string, type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ id, type, message })
    setTimeout(() => setNotification(null), 6000)
  }

  const handleApprove = async (item: MembershipRequestItem) => {
    if (!isSuperAdmin) {
      showNotification(item.id, 'error', 'Only Super Admins can approve membership requests.')
      return
    }

    const form = formData[item.id] || createInitialForm()
    if (!form.tempPassword.trim()) {
      showNotification(item.id, 'error', 'Temporary password is required.')
      return
    }
    if (!/[a-zA-Z]/.test(form.tempPassword) || !/\d/.test(form.tempPassword)) {
      showNotification(item.id, 'error', 'Password must contain letters and numbers.')
      return
    }
    if (form.trees.length === 0) {
      showNotification(item.id, 'error', 'Select at least one tree before approving.')
      return
    }

    setProcessingId(item.id)
    try {
      const result = await approveJoinRequest(item.id, {
        role: form.role,
        trees: form.trees,
        password: form.tempPassword,
      })
      setRequests((prev) => prev.filter((r) => r.id !== item.id))
      onResolved?.(item.id)
      const temporaryPassword = result?.temporaryPassword
      showNotification(
        item.id,
        'success',
        temporaryPassword
          ? `Approved ${item.name} as ${form.role}. Temporary password: ${temporaryPassword}`
          : `Approved ${item.name} as ${form.role}.`,
      )
    } catch (error) {
      if (isForbiddenError(error)) {
        await refreshCurrentUser()
        setIsSuperAdmin(false)
        showNotification(
          item.id,
          'error',
          '403 Forbidden: Only Super Admins can approve membership requests. Permissions refreshed.',
        )
      } else {
        showNotification(item.id, 'error', getApiErrorMessage(error))
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (item: MembershipRequestItem) => {
    const form = formData[item.id] || createInitialForm()
    setProcessingId(item.id)
    try {
      await rejectJoinRequest(item.id, {
        reason: form.reason ? form.reason : undefined,
      })
      setRequests((prev) => prev.filter((r) => r.id !== item.id))
      onResolved?.(item.id)
      showNotification(item.id, 'info', `Declined request from ${item.name}`)
    } catch (error) {
      if (isForbiddenError(error)) {
        await refreshCurrentUser()
      }
      showNotification(item.id, 'error', getApiErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <h2
        className="text-xl sm:text-2xl font-bold mb-4 text-[#1c1a17]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Membership requests ({requests.length})
      </h2>

      {notification && (
        <div
          className={`mb-4 p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            notification.type === 'error'
              ? 'bg-[#f7e3e0] border-[#e0b4ac] text-[#8a2f22]'
              : 'bg-[#e6efdb] border-[#bcd2a4] text-[#3e5623]'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <p
          className="text-xs text-[#8a7f6e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          No pending membership requests.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#e2d9c8] bg-[#f8f4ec] px-4 sm:px-5 py-4 sm:py-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex flex-col">
                  <span
                    className="text-[11px] uppercase tracking-[0.12em] text-[#8a7f6e]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Name
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#8a7f6e]"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span
                      className="text-sm font-semibold text-[#1c1a17] break-words"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[11px] uppercase tracking-[0.12em] text-[#8a7f6e]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Email
                  </span>
                  {item.email ? (
                    <a
                      href={`mailto:${item.email}`}
                      className="flex items-center gap-1.5 text-sm text-[#1c1a17] mt-0.5 break-words hover:underline"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      title="Send email"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#8a7f6e]"
                      >
                        <path d="M4 4h16v16H4z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {item.email}
                    </a>
                  ) : (
                    <span
                      className="text-sm text-[#1c1a17] mt-0.5 break-words"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      -
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[11px] uppercase tracking-[0.12em] text-[#8a7f6e]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Phone
                  </span>
                  {item.phone ? (
                    <a
                      href={`tel:${item.phone}`}
                      className="flex items-center gap-1.5 text-sm text-[#1c1a17] mt-0.5 hover:underline"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      title="Call"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#8a7f6e]"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {item.phone}
                    </a>
                  ) : (
                    <span
                      className="text-sm text-[#1c1a17] mt-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      -
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[11px] uppercase tracking-[0.12em] text-[#8a7f6e]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Relation
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#8a7f6e]"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span
                      className="text-sm text-[#1c1a17] break-words"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item.relation || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {isSuperAdmin ? (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="Temporary password"
                    value={formData[item.id]?.tempPassword || ''}
                    onChange={(e) =>
                      handleInputChange(item.id, 'tempPassword', e.target.value)
                    }
                    className="px-3 py-2 rounded-lg border outline-none text-xs w-full sm:w-52 focus:ring-2 focus:ring-amber-200 transition-all"
                    style={{
                      backgroundColor: '#ede8de',
                      borderColor: '#ccc4ae',
                      color: '#1c1a17',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />

                  <div className="relative">
                    <select
                      value={formData[item.id]?.role || DEFAULT_ROLE}
                      onChange={(e) =>
                        handleInputChange(item.id, 'role', e.target.value)
                      }
                      className="appearance-none px-3 py-2 pr-8 rounded-lg border outline-none text-xs font-medium cursor-pointer focus:ring-2 focus:ring-amber-200 transition-all"
                      style={{
                        backgroundColor: '#ede8de',
                        borderColor: '#ccc4ae',
                        color: '#1c1a17',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <option value="USER">User</option>
                      <option value="CONTRIBUTOR">Contributor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#6b6253]">
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="1 1 5 5 9 1" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-1">
                    <span
                      className="text-[11px] uppercase tracking-[0.12em] text-[#8a7f6e]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Trees
                    </span>
                    {(['EGYPT', 'JORDAN'] as JoinRequestTree[]).map((tree) => {
                      const checked = formData[item.id]?.trees?.includes(tree) ?? false
                      return (
                        <label
                          key={tree}
                          className="flex items-center gap-1.5 text-xs text-[#1c1a17] cursor-pointer"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleTreeToggle(item.id, tree)}
                            className="accent-[#1c1a17]"
                          />
                          {tree === 'EGYPT' ? 'Egypt' : 'Jordan'}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <span
                    className="text-[11px] font-medium text-[#8a7f6e] italic"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Super admin approval required to grant trees and activate membership.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <input
                  type="text"
                  placeholder="Rejection reason (optional)"
                  value={formData[item.id]?.reason || ''}
                  onChange={(e) => handleInputChange(item.id, 'reason', e.target.value)}
                  className="px-3 py-2 rounded-lg border outline-none text-xs w-full sm:w-52 focus:ring-2 focus:ring-amber-200 transition-all"
                  style={{
                    backgroundColor: '#ede8de',
                    borderColor: '#ccc4ae',
                    color: '#1c1a17',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.id}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {processingId === item.id ? 'Approving…' : 'Approve'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDecline(item)}
                  disabled={processingId === item.id}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-transparent text-[#554e42] border border-[#ccc4ae] hover:bg-[#ece3d2] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {processingId === item.id ? 'Declining…' : 'Decline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
