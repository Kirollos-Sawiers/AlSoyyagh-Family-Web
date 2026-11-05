import { apiClient } from './api'

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ChangeRequestType = 'EDIT_MEMBER' | 'ADD_CHILD'
export type WorkspaceTree = 'EGYPT' | 'JORDAN'

export interface ChangeRequestUser {
  id: string
  name?: string | null
}

export interface ChangeRequestRecord {
  id: string
  type: ChangeRequestType | string
  tree: WorkspaceTree | string
  memberId: number
  memberName: string
  memberSerial?: string | null
  payload?: Record<string, unknown>
  before?: Record<string, unknown> | null
  status: ChangeRequestStatus | string
  requestedBy?: ChangeRequestUser | null
  reviewedBy?: ChangeRequestUser | null
  reviewedAt?: string | null
  reviewNote?: string | null
  resultMemberId?: number | null
  createdAt?: string | null
}

export interface AdminSummary {
  pendingJoinRequests: number
  pendingChangeRequests: number
  pendingAccessRequests: number
  users: number
  members: { EGYPT: number; JORDAN: number }
}

export interface AccessRequestRecord {
  id: string
  tree: WorkspaceTree | string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  createdAt?: string | null
  reviewedAt?: string | null
  user?: ChangeRequestUser & { email?: string | null }
}

const parseItems = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[]
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.results)) return record.results as T[]
  }
  return []
}

export async function getChangeRequests(
  status?: ChangeRequestStatus,
): Promise<ChangeRequestRecord[]> {
  const response = await apiClient.get<unknown>('/api/change-requests', {
    params: status ? { status } : undefined,
  })
  return parseItems<ChangeRequestRecord>(response.data)
}

export async function approveChangeRequest(
  id: string,
  note?: string,
): Promise<{ ok?: boolean; memberId?: number }> {
  const response = await apiClient.post<{ ok?: boolean; memberId?: number }>(
    `/api/change-requests/${id}/approve`,
    note ? { note } : {},
  )
  return response.data
}

export async function rejectChangeRequest(
  id: string,
  note?: string,
): Promise<{ ok?: boolean }> {
  const response = await apiClient.post<{ ok?: boolean }>(
    `/api/change-requests/${id}/reject`,
    note ? { note } : {},
  )
  return response.data
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const response = await apiClient.get<AdminSummary>('/api/admin/summary')
  return response.data
}

export async function getAccessRequests(
  status?: 'PENDING' | 'APPROVED' | 'REJECTED',
): Promise<AccessRequestRecord[]> {
  const response = await apiClient.get<unknown>('/api/access-requests', {
    params: status ? { status } : undefined,
  })
  return parseItems<AccessRequestRecord>(response.data)
}

export async function approveAccessRequest(id: string): Promise<void> {
  await apiClient.post(`/api/access-requests/${id}/approve`, {})
}

export async function rejectAccessRequest(id: string): Promise<void> {
  await apiClient.post(`/api/access-requests/${id}/reject`, {})
}

export interface UpdateUserPayload {
  role?: 'USER' | 'CONTRIBUTOR' | 'ADMIN' | 'SUPER_ADMIN'
  status?: 'ACTIVE' | 'DISABLED'
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<void> {
  await apiClient.patch(`/api/users/${id}`, payload)
}

export async function setUserTrees(
  id: string,
  trees: WorkspaceTree[],
): Promise<void> {
  await apiClient.put(`/api/users/${id}/trees`, { trees })
}

export async function resetUserPassword(
  id: string,
  password?: string,
): Promise<{ temporaryPassword?: string }> {
  const response = await apiClient.post<{ temporaryPassword?: string }>(
    `/api/users/${id}/reset-password`,
    password ? { password } : {},
  )
  return response.data
}
