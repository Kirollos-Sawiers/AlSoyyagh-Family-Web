export type BranchType = 'Egypt' | 'Jordan' | 'Both'

export interface Person {
  id: string
  firstName: string
  lastName: string
  fullName: string
  initial: string
  gender: 'M' | 'F' | 'U'
  generation: number // 1 to 7
  branch: BranchType
  birthYear?: number
  deathYear?: number | null // null = living
  birthPlace?: string
  currentPlace?: string
  profession?: string
  spouseId?: string | null
  parentIds?: string[] // IDs of parents (mother & father)
  childrenIds?: string[]
  childrenCount?: number
  isContextParent?: boolean
  bio?: string
  photoUrl?: string
  isMarriedIntoFamily?: boolean
  carriesFamilyName?: boolean
}

export interface CoupleNode {
  id: string
  primaryPerson: Person
  spousePerson?: Person | null
  generation: number
  branch: BranchType
  childrenIds: string[]
  // Layout coordinates on canvas
  x: number
  y: number
  width: number
  height: number
}

export interface TreeStats {
  membersCount: number
  generationsCount: number
  branchesCount: number
  countriesCount: number
  livingCount: number
}

