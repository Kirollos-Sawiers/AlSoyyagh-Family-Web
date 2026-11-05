import { apiClient } from './api'

export type Tree = 'EGYPT' | 'JORDAN'
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'CONTRIBUTOR' | 'USER'

export interface MemberSummary {
  id: number
  tree: Tree
  serial: string
  name: string
  nickname: string | null
  gender: 'M' | 'F' | 'U'
  carriesFamilyName: boolean
  isDeceased: boolean
  dateOfBirth: string | null
  dateOfDeath: string | null
  photoUrl: string | null
  parentId: number | null
  depth: number
}

export interface Spouse {
  id: number
  name: string
  nickname: string | null
  memberId: number | null
  memberSerial: string | null
  memberTree: Tree | null
}

export interface MemberCard extends MemberSummary {
  spouses: Spouse[]
  childrenCount: number
}

export interface BranchNode extends MemberSummary {
  spouses: string[]
  childrenCount: number
  children: BranchNode[]
}

export interface MemberBrief {
  id: number | null
  serial?: string
  name: string
  gender?: 'M' | 'F' | 'U'
  isDeceased?: boolean
}

export interface MemberDetails extends MemberSummary {
  bio: string | null
  birthPlace: string | null
  residence: string | null
  occupation: string | null
  notes: string | null
  father: MemberBrief | null
  mother: MemberBrief | null
  parent: MemberBrief | null
  spouses: Spouse[]
  children: MemberBrief[]
  siblings: MemberBrief[]
  linkedMember: { id: number; tree: Tree; serial: string; name: string } | null
  needsReview: string[]
}

export interface OverviewNode {
  id: number
  serial?: string
  name: string
  nickname?: string | null
  gender?: 'M' | 'F' | 'U'
  carriesFamilyName?: boolean
  parentId?: number | null
  depth?: number
  spouses?: Array<string | Spouse>
  descendantsCount?: number
  children?: OverviewNode[]
}

export interface TreeOverview {
  tree: Tree
  roots: OverviewNode[]
}

export interface TreeBranch {
  branch: BranchNode
}

export interface TreeAccess {
  tree: Tree
  hasAccess: boolean
}

export interface MemberChanges {
  name?: string
  nickname?: string | null
  gender?: 'M' | 'F' | 'U'
  carriesFamilyName?: boolean
  isDeceased?: boolean
  dateOfBirth?: string | null
  dateOfDeath?: string | null
  bio?: string | null
  birthPlace?: string | null
  residence?: string | null
  occupation?: string | null
  notes?: string | null
  [key: string]: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeTree = (value: unknown): Tree | null => {
  if (typeof value !== 'string') return null
  const upper = value.toUpperCase()
  if (upper.includes('EGYPT')) return 'EGYPT'
  if (upper.includes('JORDAN')) return 'JORDAN'
  return null
}

const unwrapMember = <T>(data: unknown): T => {
  if (isRecord(data)) {
    if ('member' in data) return data.member as T
    if ('data' in data) return unwrapMember<T>(data.data)
  }
  return data as T
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined
  const response = error.response
  if (!isRecord(response)) return undefined
  const data = response.data
  if (!isRecord(data)) return undefined
  const err = data.error
  if (isRecord(err) && typeof err.code === 'string') return err.code
  if (typeof data.code === 'string') return data.code
  return undefined
}

export function parseTreeAccess(data: unknown): TreeAccess[] {
  let items: unknown[] = []

  if (Array.isArray(data)) {
    items = data
  } else if (isRecord(data)) {
    if (Array.isArray(data.trees)) {
      items = data.trees
    } else if (isRecord(data.trees)) {
      items = Object.entries(data.trees).map(([key, value]) => {
        if (isRecord(value)) return { tree: key, ...value }
        return { tree: key, hasAccess: Boolean(value) }
      })
    } else if (Array.isArray(data.data)) {
      items = data.data
    } else {
      items = Object.entries(data)
        .filter(([key]) => normalizeTree(key))
        .map(([key, value]) => {
          if (isRecord(value)) return { tree: key, ...value }
          return { tree: key, hasAccess: Boolean(value) }
        })
    }
  }

  const result: TreeAccess[] = []
  for (const item of items) {
    if (typeof item === 'string') {
      const tree = normalizeTree(item)
      if (tree) result.push({ tree, hasAccess: true })
      continue
    }
    if (!isRecord(item)) continue
    const tree = normalizeTree(item.tree ?? item.country ?? item.name ?? item.key)
    if (!tree) continue
    const hasAccess = Boolean(
      item.hasAccess ?? item.access ?? item.allowed ?? item.has_access ?? true,
    )
    result.push({ tree, hasAccess })
  }
  return result
}

export async function getTreeAccess(): Promise<TreeAccess[]> {
  const response = await apiClient.get<unknown>('/api/trees')
  return parseTreeAccess(response.data)
}

export async function getTreeOverview(tree: Tree): Promise<TreeOverview> {
  const response = await apiClient.get<unknown>(`/api/trees/${tree}/overview`)
  const data = isRecord(response.data) && isRecord(response.data.data)
    ? response.data.data
    : response.data
  const roots =
    isRecord(data) && Array.isArray(data.roots)
      ? (data.roots as OverviewNode[])
      : []
  return { tree, roots }
}

export async function getTreeBranch(
  tree: Tree,
  childId: number | string,
  depth = 3,
): Promise<TreeBranch> {
  const response = await apiClient.get<unknown>(`/api/trees/${tree}/branch/${childId}`, {
    params: { depth },
  })
  const data = isRecord(response.data) && isRecord(response.data.data)
    ? response.data.data
    : response.data
  const branch = isRecord(data) && isRecord(data.branch)
    ? (data.branch as unknown as BranchNode)
    : (data as unknown as BranchNode)
  return { branch }
}

export async function getMemberCard(id: number | string): Promise<MemberCard> {
  const response = await apiClient.get<unknown>(`/api/members/${id}`)
  return unwrapMember<MemberCard>(response.data)
}

export async function getMemberDetails(id: number | string): Promise<MemberDetails> {
  const response = await apiClient.get<unknown>(`/api/members/${id}/details`)
  return unwrapMember<MemberDetails>(response.data)
}

export type ChangeResult = 'saved' | 'sent-for-approval'

export async function updateMember(
  id: number | string,
  changes: MemberChanges,
): Promise<ChangeResult> {
  const response = await apiClient.patch(`/api/members/${id}`, changes)
  return response.status === 202 ? 'sent-for-approval' : 'saved'
}

export async function addChild(
  id: number | string,
  changes: MemberChanges,
): Promise<ChangeResult> {
  const response = await apiClient.post(`/api/members/${id}/children`, changes)
  return response.status === 202 ? 'sent-for-approval' : 'saved'
}

export async function requestTreeAccess(
  tree: Tree,
  reason?: string,
): Promise<void> {
  await apiClient.post('/api/access-requests', reason ? { tree, reason } : { tree })
}
