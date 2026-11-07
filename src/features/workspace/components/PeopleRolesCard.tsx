import { useEffect, useState } from 'react'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, KeyRound, X } from 'lucide-react'
import {
  getApiErrorMessage,
  getUsers,
  isForbiddenError,
  refreshCurrentUser,
  type UserRecord,
} from '../../../services/api'
import {
  resetUserPassword,
  setUserTrees,
  updateUser,
  type WorkspaceTree,
} from '../../../services/workspaceApi'
// import {
//   createAccountSchema,
//   type CreateAccountFormData,
// } from '../schemas/workspaceSchemas'

type UserRole = 'User' | 'Contributor' | 'Admin' | 'Super Admin'

export interface UserRoleItem {
  id: string
  name: string
  email: string
  note?: string
  status?: string
  trees?: WorkspaceTree[]
  role: UserRole
}

const ROLE_LABELS: Record<string, UserRole> = {
  USER: 'User',
  CONTRIBUTOR: 'Contributor',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
}

const ROLE_VALUES: Record<UserRole, 'USER' | 'CONTRIBUTOR' | 'ADMIN' | 'SUPER_ADMIN'> = {
  User: 'USER',
  Contributor: 'CONTRIBUTOR',
  Admin: 'ADMIN',
  'Super Admin': 'SUPER_ADMIN',
}

const normalizeRole = (role?: string): UserRole => {
  if (!role) return 'User'
  return ROLE_LABELS[role.toUpperCase()] || ROLE_LABELS[role] || 'User'
}

const mapUser = (user: UserRecord): UserRoleItem => {
  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.name ||
    user.email ||
    ''
  return {
    id: user.id,
    name: fullName,
    email: user.email || '',
    status: user.status || undefined,
    trees: Array.isArray(user.trees)
      ? (user.trees.filter(
          (tree): tree is WorkspaceTree => tree === 'EGYPT' || tree === 'JORDAN',
        ))
      : undefined,
    role: normalizeRole(user.role),
  }
}

const formatTree = (tree: string) =>
  tree ? tree.charAt(0).toUpperCase() + tree.slice(1).toLowerCase() : tree

export function PeopleRolesCard() {
  const [users, setUsers] = useState<UserRoleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [resetTarget, setResetTarget] = useState<UserRoleItem | null>(null)
  const [resetResult, setResetResult] = useState<{
    name: string
    password: string
  } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  useEffect(() => {
    let isMounted = true
    const localRole = () => {
      try {
        const info = JSON.parse(localStorage.getItem('user_info') || '{}')
        return String(info.role || '').toUpperCase()
      } catch {
        return ''
      }
    }

    setIsSuperAdmin(localRole() === 'SUPER_ADMIN')
    refreshCurrentUser().then((me) => {
      if (!isMounted || !me) return
      setIsSuperAdmin(String(me.user.role || '').toUpperCase() === 'SUPER_ADMIN')
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchUsers = async () => {
      try {
        const data = await getUsers()
        if (!isMounted) return
        setUsers(Array.isArray(data) ? data.map(mapUser) : [])
        setLoadError(null)
      } catch (error) {
        if (!isMounted) return
        setLoadError(getApiErrorMessage(error))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchUsers()
    return () => {
      isMounted = false
    }
  }, [])

  // const {
  //   register,
  //   handleSubmit,
  //   reset,
  //   formState: { errors, isSubmitting },
  // } = useForm<CreateAccountFormData>({
  //   resolver: zodResolver(createAccountSchema),
  //   defaultValues: {
  //     fullName: '',
  //     email: '',
  //     temporaryPassword: '',
  //     role: 'USER',
  //   },
  // })

  // const onSubmit = async (data: CreateAccountFormData) => {
  //   setActionError(null)
  //   setSuccessNotice(
  //     `Accounts are created by approving membership requests. Approve the request for "${data.fullName}" in the Membership requests section above.`,
  //   )
  //   reset({
  //     fullName: '',
  //     email: '',
  //     temporaryPassword: '',
  //     role: 'USER',
  //   })
  //   setTimeout(() => setSuccessNotice(null), 8000)
  // }

  const syncPermissions = async () => {
    const me = await refreshCurrentUser()
    if (me) {
      setIsSuperAdmin(String(me.user.role || '').toUpperCase() === 'SUPER_ADMIN')
    }
  }

  const handleRoleChange = async (
    userId: string,
    newRole: UserRoleItem['role'],
  ) => {
    const target = users.find((u) => u.id === userId)
    if (!target || target.role === newRole) return

    if (!isSuperAdmin && newRole === 'Super Admin') {
      setActionError('Only Super Admins can assign the Super Admin role.')
      return
    }

    const previousRole = target.role
    setActionError(null)
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    )
    setProcessingId(userId)

    try {
      await updateUser(userId, { role: ROLE_VALUES[newRole] })
      await syncPermissions()
      setSuccessNotice(`Updated ${target.name}'s role to ${newRole}.`)
      setTimeout(() => setSuccessNotice(null), 4000)
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: previousRole } : u)),
      )
      if (isForbiddenError(error)) {
        await syncPermissions()
        setActionError('403 Forbidden: You do not have permission to assign this role. Permissions refreshed.')
      } else {
        setActionError(getApiErrorMessage(error))
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleTreeToggle = async (user: UserRoleItem, tree: WorkspaceTree) => {
    if (!isSuperAdmin) {
      setActionError('Only Super Admins can manage tree access.')
      return
    }
    if (user.role === 'Super Admin') return

    const previousTrees = user.trees ?? []
    const nextTrees = previousTrees.includes(tree)
      ? previousTrees.filter((item) => item !== tree)
      : [...previousTrees, tree]

    setActionError(null)
    setUsers((prev) =>
      prev.map((item) => (item.id === user.id ? { ...item, trees: nextTrees } : item)),
    )
    setProcessingId(user.id)

    try {
      await setUserTrees(user.id, nextTrees)
      await syncPermissions()
      setSuccessNotice(`Updated ${user.name}'s tree access.`)
      setTimeout(() => setSuccessNotice(null), 4000)
    } catch (error) {
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, trees: previousTrees } : item,
        ),
      )
      if (isForbiddenError(error)) {
        await syncPermissions()
        setActionError('403 Forbidden: Only Super Admins can manage tree access. Permissions refreshed.')
      } else {
        setActionError(getApiErrorMessage(error))
      }
    } finally {
      setProcessingId(null)
    }
  }

  const requestResetPassword = (user: UserRoleItem) => {
    setActionError(null)
    setResetTarget(user)
  }

  const confirmResetPassword = async () => {
    if (!resetTarget) return
    const target = resetTarget
    setActionError(null)
    setProcessingId(target.id)
    try {
      const result = await resetUserPassword(target.id)
      if (result.temporaryPassword) {
        setResetResult({
          name: target.name,
          password: result.temporaryPassword,
        })
        setCopiedPassword(false)
      } else {
        setSuccessNotice(`A temporary password was generated for ${target.name}.`)
        setTimeout(() => setSuccessNotice(null), 10000)
      }
      setResetTarget(null)
    } catch (error) {
      if (isForbiddenError(error)) await syncPermissions()
      setActionError(getApiErrorMessage(error))
      setResetTarget(null)
    } finally {
      setProcessingId(null)
    }
  }

  const copyPassword = async () => {
    if (!resetResult) return
    try {
      await navigator.clipboard.writeText(resetResult.password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch {
      setActionError('Could not copy the password. Please copy it manually.')
    }
  }

  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <h2
        className="text-xl sm:text-2xl font-bold mb-4 text-[#1c1a17]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        People &amp; roles
      </h2>

      {successNotice && (
        <div className="mb-4 p-3 rounded-xl bg-[#e6efdb] border border-[#bcd2a4] text-[#3e5623] text-xs font-medium flex items-center justify-between">
          <span>{successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-[#3e5623] hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {resetResult && (
        <div className="mb-4 p-4 rounded-xl bg-[#e6efdb] border border-[#bcd2a4] text-[#3e5623]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold">
              New temporary password for {resetResult.name}
            </span>
            <button
              type="button"
              onClick={() => setResetResult(null)}
              className="shrink-0 hover:opacity-70"
              aria-label="Dismiss generated password"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
            <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/80 border border-[#bcd2a4] text-sm font-mono tracking-wide text-[#1c1a17] break-all">
              {resetResult.password}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 transition-colors"
            >
              {copiedPassword ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#3e5623]/80">
            Share this password securely. It stays visible here until you close
            this notice.
          </p>
        </div>
      )}

      {/* Add User Form Row */}
      
      {/* <form onSubmit={handleSubmit(onSubmit)} noValidate className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-2"> */}
          {/* Full name */}
          {/* <div className="flex-1 min-w-32.5">
            <input
              type="text"
              placeholder="Full name"
              {...register('fullName')}
              className={`w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs transition-colors ${
                errors.fullName
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.fullName ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.fullName && (
              <p className="mt-1 text-[10px] text-red-600">{errors.fullName.message}</p>
            )}
          </div> */}

          {/* Email */}
          {/* <div className="flex-1 min-w-37.5">
            <input
              type="email"
              placeholder="Email"
              {...register('email')}
              className={`w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs transition-colors ${
                errors.email
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.email ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.email && (
              <p className="mt-1 text-[10px] text-red-600">{errors.email.message}</p>
            )}
          </div> */}

          {/* Temporary password */}
          {/* <div className="w-full md:w-36">
            <input
              type="text"
              placeholder="temporary password"
              {...register('temporaryPassword')}
              className={`w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs transition-colors ${
                errors.temporaryPassword
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.temporaryPassword ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.temporaryPassword && (
              <p className="mt-1 text-[10px] text-red-600">
                {errors.temporaryPassword.message}
              </p>
            )}
          </div> */}

          {/* Role select */}
          {/* <div className="relative w-full md:w-28 shrink-0">
            <select
              {...register('role')}
              className="w-full appearance-none px-3 py-1.5 pr-7 rounded-lg border outline-none text-xs font-medium cursor-pointer focus:border-[#8c7b64] transition-colors"
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
              {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#1c1a17]">
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
          </div> */}

          {/* Create account button */}
          {/* <div className="w-full md:w-auto shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isSubmitting ? 'Creating...' : 'Create account'}
            </button>
          </div> */}
        {/* </div>
      </form> */}
      

      {/* Users List with divider */}
      {isLoading ? (
        <p
          className="text-xs text-[#8a7f6e] pt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Loading people…
        </p>
      ) : loadError ? (
        <p
          className="text-xs text-[#8a2f22] pt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {loadError}
        </p>
      ) : users.length === 0 ? (
        <p
          className="text-xs text-[#8a7f6e] pt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          No users found.
        </p>
      ) : (
        <div className="divide-y divide-[#e6ded0] pt-1">
          {users.map((user) => {
            const statusLabel = user.status
              ? user.status.charAt(0).toUpperCase() + user.status.slice(1).toLowerCase()
              : ''
            const treesLabel =
              user.trees && user.trees.length > 0
                ? user.trees.map(formatTree).join(', ')
                : ''
            return (
              <div
                key={user.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0 last:pb-0"
              >
                <div
                  className="text-xs text-[#1c1a17] leading-tight"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <div>
                    <span className="font-bold text-[#1c1a17]">{user.name}</span>
                    <span className="text-[#736a5b] ml-1.5">{user.email}</span>
                    {user.note && (
                      <span className="text-[#8a7f6e] ml-1.5">- {user.note}</span>
                    )}
                  </div>
                  {(statusLabel || treesLabel) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {statusLabel && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#e6efdb] text-[#3e5623] text-[10px] font-semibold uppercase tracking-wide">
                          {statusLabel}
                        </span>
                      )}
                      {treesLabel && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ece3d2] text-[#554e42] text-[10px] font-medium">
                          {treesLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                  {/* Country tree access control */}
                  {isSuperAdmin && (
                    <div
                      className="flex items-center gap-1 rounded-lg border border-[#ccc4ae] bg-[#ede8de] p-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      title={
                        user.role === 'Super Admin'
                          ? 'Super admins always see both trees'
                          : 'Choose which country trees this person may open'
                      }
                    >
                      {(['EGYPT', 'JORDAN'] as const).map((tree) => {
                        const isActive =
                          user.role === 'Super Admin' ||
                          (user.trees ?? []).includes(tree)
                        const isDisabled =
                          processingId === user.id || user.role === 'Super Admin'
                        return (
                          <button
                            key={tree}
                            type="button"
                            aria-pressed={isActive}
                            disabled={isDisabled}
                            onClick={() => handleTreeToggle(user, tree)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors disabled:cursor-not-allowed ${
                              isActive
                                ? 'bg-[#1c1a17] text-[#f5f0e8]'
                                : 'text-[#736a5b] hover:bg-[#e1d8c7]'
                            } ${isDisabled ? 'opacity-60' : ''}`}
                          >
                            {formatTree(tree)}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Role dropdown pill */}
                  <div className="relative">
                    <select
                      value={user.role}
                      disabled={processingId === user.id}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRoleItem['role'])
                      }
                      className="appearance-none px-3 py-1 pr-7 rounded-lg border outline-none text-xs font-medium cursor-pointer focus:border-[#8c7b64] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: '#ede8de',
                        borderColor: '#ccc4ae',
                        color: '#1c1a17',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <option value="User">User</option>
                      <option value="Contributor">Contributor</option>
                      <option value="Admin">Admin</option>
                      {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#1c1a17]">
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

                  <button
                    type="button"
                    onClick={() => requestResetPassword(user)}
                    disabled={processingId === user.id}
                    className="px-2.5 py-1 rounded-lg border border-[#ccc4ae] text-[11px] font-medium text-[#554e42] hover:bg-[#ece3d2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    title="Reset password"
                  >
                    {processingId === user.id ? '…' : 'Reset password'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (processingId === null) setResetTarget(null)
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            className="relative w-full max-w-sm rounded-2xl bg-[#f5f0e8] border border-[#e2d9c8] shadow-2xl p-6"
          >
            <div className="w-11 h-11 rounded-full bg-[#f3e3c8] text-[#a07840] flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3
              id="reset-password-title"
              className="text-lg font-bold text-[#1c1a17]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Reset password?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#6b6253]">
              Are you sure you want to reset the password for{' '}
              <span className="font-semibold text-[#1c1a17]">
                {resetTarget.name}
              </span>
              ? A new temporary password will be generated and the current one
              will stop working.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                disabled={processingId !== null}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#554e42] bg-[#ede8de] border border-[#ccc4ae] hover:bg-[#e4ddcf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                disabled={processingId !== null}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === resetTarget.id
                  ? 'Resetting…'
                  : 'Yes, reset password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
