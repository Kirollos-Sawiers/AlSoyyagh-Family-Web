import type { BranchNode, MemberBrief, OverviewNode, Tree } from '../../../services/treeApi'
import type { BranchType, Person, TreeStats } from '../types'

export interface MappedTree {
  people: Person[]
  stats: TreeStats
}

export const treeToBranch = (tree: Tree): BranchType =>
  tree === 'EGYPT' ? 'Egypt' : 'Jordan'

const initialOf = (name: string) => name.trim().charAt(0) || '?'

const mapGender = (gender?: string): Person['gender'] => {
  if (gender === 'F') return 'F'
  if (gender === 'U') return 'U'
  return 'M'
}

const baseStats = (people: Person[], branchesCount: number): TreeStats => ({
  membersCount: people.length,
  generationsCount: people.reduce((max, person) => Math.max(max, person.generation), 0),
  branchesCount,
  countriesCount: 0,
  livingCount: people.filter((person) => person.deathYear == null).length,
})

const countOverviewMembers = (nodes: OverviewNode[]): number => {
  let count = 0
  for (const node of nodes) {
    count += 1
    const children = Array.isArray(node.children) ? node.children : []
    if (children.length > 0) {
      count += countOverviewMembers(children)
    }
    for (const child of children) {
      const grandchildren = Array.isArray(child.children) ? child.children : []
      if (grandchildren.length === 0) {
        count += child.descendantsCount ?? 0
      }
    }
  }
  return count
}

export function mapOverviewToPeople(
  tree: Tree,
  roots: OverviewNode[],
  branchesCount = 1,
): MappedTree {
  const people: Person[] = []

  const walk = (node: OverviewNode, generation: number, parentId?: number) => {
    const id = String(node.id)
    const name = node.name || ''
    const children = Array.isArray(node.children) ? node.children : []
    people.push({
      id,
      firstName: name,
      lastName: '',
      fullName: name,
      initial: initialOf(name),
      gender: mapGender(node.gender),
      generation,
      branch: treeToBranch(tree),
      parentIds: parentId != null ? [String(parentId)] : [],
      childrenIds: children.map((child) => String(child.id)),
      childrenCount: node.descendantsCount ?? children.length,
      carriesFamilyName: node.carriesFamilyName,
    })
    children.forEach((child) => walk(child, generation + 1, node.id))
  }

  roots.forEach((root) => walk(root, 1))

  const stats = baseStats(people, branchesCount)
  stats.membersCount = Math.max(people.length, countOverviewMembers(roots))
  return { people, stats }
}

export function mapBranchToPeople(
  tree: Tree,
  branch: BranchNode,
  branchesCount = 1,
  startGeneration = 1,
): MappedTree {
  const people: Person[] = []

  const walk = (node: BranchNode, generation: number, parentId?: number) => {
    const id = String(node.id)
    const name = node.name || ''
    const children = Array.isArray(node.children) ? node.children : []
    people.push({
      id,
      firstName: name,
      lastName: '',
      fullName: name,
      initial: initialOf(name),
      gender: mapGender(node.gender),
      generation,
      branch: treeToBranch(tree),
      parentIds: parentId != null ? [String(parentId)] : [],
      childrenIds: children.map((child) => String(child.id)),
      childrenCount: node.childrenCount ?? children.length,
      carriesFamilyName: node.carriesFamilyName,
    })
    children.forEach((child) => walk(child, generation + 1, node.id))
  }

  walk(branch, startGeneration)

  return { people, stats: baseStats(people, branchesCount) }
}

export function personFromBrief(
  brief: MemberBrief,
  generation: number,
  branch: BranchType,
): Person {
  const name = brief.name || ''
  return {
    id: String(brief.id ?? ''),
    firstName: name,
    lastName: '',
    fullName: name,
    initial: initialOf(name),
    gender: mapGender(brief.gender),
    generation,
    branch,
  }
}
