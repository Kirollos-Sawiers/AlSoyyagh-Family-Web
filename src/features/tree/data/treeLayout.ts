import { Person } from '../types'

export interface VisualNode {
  person: Person
  x: number
  y: number
  width: number
  height: number
  coupleWithId?: string
}

export interface TreeConnection {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  type: 'parent-child' | 'spouse' | 'sibling' | 'lineage'
  path?: string
}

export interface GenerationGuide {
  generation: number
  label: string
  y: number
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 38
const COLUMN_WIDTH = 230
const ROW_HEIGHT = 66
const MAX_PER_ROW = 8
const CENTER_X = 1600
const START_Y = 120

export const GENERATION_GUIDES: GenerationGuide[] = []

export function computeTreeLayout(
  people: Person[],
  activeBranch: 'Egypt' | 'Jordan' | 'Both',
): {
  nodes: VisualNode[]
  connections: TreeConnection[]
  guides: GenerationGuide[]
} {
  const filteredPeople = people.filter((p) => {
    if (activeBranch === 'Both') return true
    if (p.branch === 'Both') return true
    return p.branch === activeBranch
  })

  const groups = new Map<number, Person[]>()
  for (const person of filteredPeople) {
    const group = groups.get(person.generation) ?? []
    group.push(person)
    groups.set(person.generation, group)
  }

  const generations = Array.from(groups.keys()).sort((a, b) => a - b)
  const nodes: VisualNode[] = []
  const nodeMap = new Map<string, VisualNode>()
  const guides: GenerationGuide[] = []

  let cursorY = START_Y
  for (const generation of generations) {
    const group = groups.get(generation) ?? []
    const rows = Math.ceil(group.length / MAX_PER_ROW) || 1
    guides.push({
      generation,
      label: `Generation ${generation}`,
      y: cursorY,
    })

    group.forEach((person, index) => {
      const row = Math.floor(index / MAX_PER_ROW)
      const column = index % MAX_PER_ROW
      const rowCount = Math.min(MAX_PER_ROW, group.length - row * MAX_PER_ROW)
      const rowWidth = rowCount * COLUMN_WIDTH
      const startX = CENTER_X - rowWidth / 2
      const x = startX + column * COLUMN_WIDTH + (COLUMN_WIDTH - NODE_WIDTH) / 2
      const y = cursorY + row * ROW_HEIGHT

      const node: VisualNode = {
        person,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        coupleWithId: person.spouseId || undefined,
      }
      nodeMap.set(person.id, node)
      nodes.push(node)
    })

    cursorY += rows * ROW_HEIGHT + 100
  }

  const connections: TreeConnection[] = []

  const processedCouples = new Set<string>()
  for (const node of nodes) {
    if (node.coupleWithId && !processedCouples.has(node.person.id)) {
      const spouseNode = nodeMap.get(node.coupleWithId)
      if (spouseNode) {
        processedCouples.add(node.person.id)
        processedCouples.add(spouseNode.person.id)
        connections.push({
          id: `couple-${node.person.id}-${spouseNode.person.id}`,
          fromX: node.x + node.width,
          fromY: node.y + node.height / 2,
          toX: spouseNode.x,
          toY: spouseNode.y + spouseNode.height / 2,
          type: 'spouse',
        })
      }
    }
  }

  // Each child is linked to its father (or parent couple) with its own smooth
  // S-curve, so every sibling branch flows independently out of the parent.
  for (const node of nodes) {
    const parentIds = node.person.parentIds || []
    if (parentIds.length === 0) continue

    const parentNodes = parentIds
      .map((pid) => nodeMap.get(pid))
      .filter((p): p is VisualNode => Boolean(p))

    if (parentNodes.length === 0) continue

    let parentCenterX = 0
    let parentCenterY = 0

    if (parentNodes.length === 1) {
      parentCenterX = parentNodes[0].x + parentNodes[0].width / 2
      parentCenterY = parentNodes[0].y + parentNodes[0].height
    } else {
      const minX = Math.min(...parentNodes.map((p) => p.x))
      const maxX = Math.max(...parentNodes.map((p) => p.x + p.width))
      parentCenterX = (minX + maxX) / 2
      parentCenterY = Math.max(...parentNodes.map((p) => p.y + p.height))
    }

    const childCenterX = node.x + node.width / 2
    const midY = (parentCenterY + node.y) / 2

    connections.push({
      id: `child-${node.person.id}`,
      fromX: parentCenterX,
      fromY: parentCenterY,
      toX: childCenterX,
      toY: node.y,
      type: 'parent-child',
      path: `M ${parentCenterX} ${parentCenterY} C ${parentCenterX} ${midY}, ${childCenterX} ${midY}, ${childCenterX} ${node.y}`,
    })
  }

  return { nodes, connections, guides }
}
