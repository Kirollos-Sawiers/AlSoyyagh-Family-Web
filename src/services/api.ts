import axios, { AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alsoyyagh-family-api-6af9c.containers.snapdeploy.app'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as { error?: { code?: string } } | undefined
    const code = data?.error?.code
    const url = error.config?.url ?? ''

    if (code === 'PASSWORD_CHANGE_REQUIRED') {
      if (!window.location.pathname.startsWith('/change-password')) {
        window.location.href = '/change-password'
      }
    } else if (status === 401 && code !== 'INVALID_CREDENTIALS' && !url.includes('/auth/login')) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    } else if (status === 403 && !url.includes('/auth/me')) {
      refreshCurrentUser().catch(() => {})
    }

    return Promise.reject(error)
  },
)

export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
  trees?: string[]
  [key: string]: any
}

export interface MeResponse {
  user: User
  trees: string[]
}

export async function getMe(): Promise<MeResponse> {
  const response = await apiClient.get<any>('/api/auth/me')
  const data = response.data
  const user: User = data?.user || data?.data?.user || (data?.email ? data : {})
  const rawTrees = data?.trees || data?.data?.trees || user?.trees || []
  const trees: string[] = Array.isArray(rawTrees)
    ? rawTrees.map((t: unknown) => String(t).toUpperCase())
    : []

  const normalizedUser: User = {
    ...user,
    role: user.role ? String(user.role).toUpperCase() : undefined,
    trees,
  }

  return {
    user: normalizedUser,
    trees,
  }
}

export async function refreshCurrentUser(): Promise<MeResponse | null> {
  try {
    const me = await getMe()
    if (me?.user) {
      localStorage.setItem('user_info', JSON.stringify({ ...me.user, trees: me.trees }))
    }
    return me
  } catch {
    return null
  }
}

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}

export interface LoginResponse {
  token: string
  mustChangePassword: boolean
  user: User
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', data)
  return response.data
}

export async function checkHealth(): Promise<void> {
  await apiClient.get('/api/health')
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  token?: string
  [key: string]: any
}

export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const response = await apiClient.post<ChangePasswordResponse>('/api/auth/change-password', data)
  return response.data
}

export interface JoinRequestPayload {
  name: string
  phone: string
  email: string
  relation?: string
}

export async function submitJoinRequest(data: JoinRequestPayload): Promise<any> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('phone', data.phone)
  formData.append('email', data.email)
  if (data.relation) {
    formData.append('relation', data.relation)
  }
  const response = await apiClient.post('/api/join-requests', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export interface JoinRequest {
  id: string
  name?: string
  fullName?: string
  email?: string
  phone?: string
  relation?: string
  status?: string
  [key: string]: any
}

export async function getJoinRequests(status: string = 'PENDING'): Promise<JoinRequest[]> {
  const response = await apiClient.get<any>('/api/join-requests', {
    params: { status },
  })
  const data = response.data
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export interface UserRecord {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  fullName?: string
  email?: string
  role?: string
  status?: string
  trees?: string[]
  [key: string]: unknown
}

export async function getUsers(): Promise<UserRecord[]> {
  const response = await apiClient.get<
    UserRecord[] | { items?: UserRecord[]; results?: UserRecord[] }
  >('/api/users')
  const data = response.data
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export type JoinRequestRole = 'ADMIN' | 'CONTRIBUTOR' | 'USER'

export type JoinRequestTree = 'EGYPT' | 'JORDAN'

export interface ApproveJoinRequestPayload {
  role: JoinRequestRole
  trees: JoinRequestTree[]
  password: string
}

export interface ApproveJoinRequestResponse {
  temporaryPassword?: string
}

export async function approveJoinRequest(
  id: string,
  data: ApproveJoinRequestPayload,
): Promise<ApproveJoinRequestResponse> {
  const response = await apiClient.post<ApproveJoinRequestResponse>(
    `/api/join-requests/${id}/approve`,
    data,
  )
  return response.data
}

export interface RejectJoinRequestPayload {
  reason?: string
}

export async function rejectJoinRequest(
  id: string,
  data: RejectJoinRequestPayload = {},
): Promise<unknown> {
  const response = await apiClient.post<unknown>(`/api/join-requests/${id}/reject`, data)
  return response.data
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>
    const data = axiosError.response?.data
    const details = data?.details ?? data?.error?.details

    if (Array.isArray(details)) {
      const messages = details
        .map((detail: any) => {
          if (typeof detail === 'string') return detail
          const field = detail?.field
          const message = detail?.message
          if (typeof message === 'string') {
            return field && typeof field === 'string' ? `${field}: ${message}` : message
          }
          return null
        })
        .filter((message: string | null): message is string => Boolean(message))
      if (messages.length > 0) return messages.join(', ')
    }

    const message = data?.message || data?.error?.message || data?.error
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(', ')
    if (axiosError.response?.status === 401) return 'Invalid email or password'
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
