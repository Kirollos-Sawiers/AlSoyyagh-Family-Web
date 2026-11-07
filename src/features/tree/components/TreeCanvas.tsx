import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Plus, Minus, RotateCcw, Info, Gem } from 'lucide-react'
import { Person } from '../types'
import { computeTreeLayout, VisualNode, TreeConnection, GenerationGuide } from '../data/treeLayout'

interface TreeCanvasProps {
  people: Person[]
  activeBranch: 'Egypt' | 'Jordan' | 'Both'
  selectedGeneration: number | null
  selectedPersonId: string | null
  onSelectPerson: (person: Person) => void
  onShowInfo?: (person: Person) => void
}

export function TreeCanvas({
  people,
  activeBranch,
  selectedGeneration,
  selectedPersonId,
  onSelectPerson,
  onShowInfo,
}: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Layout data
  const [layout, setLayout] = useState<{
    nodes: VisualNode[]
    connections: TreeConnection[]
    guides: GenerationGuide[]
  }>({ nodes: [], connections: [], guides: [] })

  // Pan & Zoom state
  // Default centered roughly around Gen 4-6 (X ~ 1400, Y ~ 900)
  const [transform, setTransform] = useState({
    x: -700,
    y: -580,
    scale: 0.95,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const lastTouchDistRef = useRef<number | null>(null)

  const contentWidth = Math.max(
    3600,
    ...layout.nodes.map((node) => node.x + node.width + 400),
  )
  const contentHeight = Math.max(
    1800,
    ...layout.nodes.map((node) => node.y + node.height + 400),
  )

  const fitView = useCallback(() => {
    const el = containerRef.current
    if (!el || layout.nodes.length === 0) return
    const viewportWidth = el.clientWidth
    const viewportHeight = el.clientHeight
    const minX = Math.min(...layout.nodes.map((node) => node.x))
    const minY = Math.min(...layout.nodes.map((node) => node.y))
    const maxX = Math.max(...layout.nodes.map((node) => node.x + node.width))
    const maxY = Math.max(...layout.nodes.map((node) => node.y + node.height))
    const padding = 130
    const scale = Math.min(
      1.35,
      Math.max(
        0.35,
        Math.min(
          (viewportWidth - padding * 2) / Math.max(1, maxX - minX),
          (viewportHeight - padding * 2) / Math.max(1, maxY - minY),
        ),
      ),
    )
    setTransform({
      x: viewportWidth / 2 - ((minX + maxX) / 2) * scale,
      y: viewportHeight / 2 - ((minY + maxY) / 2) * scale,
      scale,
    })
  }, [layout.nodes])

  // Recompute layout when people or branch changes
  useEffect(() => {
    const computed = computeTreeLayout(people, activeBranch)
    setLayout(computed)
  }, [people, activeBranch])

  // Fit the tree whenever a new layout is available
  useEffect(() => {
    fitView()
  }, [fitView])

  // Center on generation when selected
  useEffect(() => {
    if (selectedGeneration && containerRef.current) {
      const generationNodes = layout.nodes.filter(
        (node) => node.person.generation === selectedGeneration,
      )
      const guide = layout.guides.find((g) => g.generation === selectedGeneration)
      if (guide || generationNodes.length > 0) {
        const viewportHeight = containerRef.current.clientHeight
        const viewportWidth = containerRef.current.clientWidth
        const targetX =
          generationNodes.length > 0
            ? generationNodes.reduce((sum, node) => sum + node.x + node.width / 2, 0) /
              generationNodes.length
            : 1600
        const targetY =
          generationNodes.length > 0
            ? generationNodes.reduce((sum, node) => sum + node.y + node.height / 2, 0) /
              generationNodes.length
            : guide?.y ?? 120

        setTransform((prev) => ({
          ...prev,
          x: viewportWidth / 2 - targetX * prev.scale,
          y: viewportHeight / 2 - targetY * prev.scale,
        }))
      }
    }
  }, [selectedGeneration, layout.guides, layout.nodes, activeBranch])

  // Center on selected person if requested
  useEffect(() => {
    if (selectedPersonId && containerRef.current) {
      const node = layout.nodes.find((n) => n.person.id === selectedPersonId)
      if (node) {
        const viewportHeight = containerRef.current.clientHeight
        const viewportWidth = containerRef.current.clientWidth
        setTransform((prev) => ({
          ...prev,
          x: viewportWidth / 2 - (node.x + node.width / 2) * prev.scale,
          y: viewportHeight / 2 - (node.y + node.height / 2) * prev.scale,
        }))
      }
    }
  }, [selectedPersonId, layout.nodes])

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button on canvas background
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }))
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.35), 2.2)

    // Zoom centered at mouse position
    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale)
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale)

    setTransform({
      x: newX,
      y: newY,
      scale: newScale,
    })
  }

  // Touch handlers for mobile and tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      })
    } else if (e.touches.length === 2) {
      setIsDragging(false)
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      lastTouchDistRef.current = dist
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      }))
    } else if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const factor = dist / lastTouchDistRef.current
      lastTouchDistRef.current = dist

      setTransform((prev) => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * factor, 0.35), 2.2),
      }))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    lastTouchDistRef.current = null
  }

  // Zoom buttons
  const zoomIn = () => {
    if (!containerRef.current) return
    const vw = containerRef.current.clientWidth / 2
    const vh = containerRef.current.clientHeight / 2
    const newScale = Math.min(transform.scale * 1.2, 2.2)
    const newX = vw - (vw - transform.x) * (newScale / transform.scale)
    const newY = vh - (vh - transform.y) * (newScale / transform.scale)
    setTransform({ x: newX, y: newY, scale: newScale })
  }

  const zoomOut = () => {
    if (!containerRef.current) return
    const vw = containerRef.current.clientWidth / 2
    const vh = containerRef.current.clientHeight / 2
    const newScale = Math.max(transform.scale / 1.2, 0.35)
    const newX = vw - (vw - transform.x) * (newScale / transform.scale)
    const newY = vh - (vh - transform.y) * (newScale / transform.scale)
    setTransform({ x: newX, y: newY, scale: newScale })
  }

  const resetView = () => {
    fitView()
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden select-none cursor-${
        isDragging ? 'grabbing' : 'grab'
      }`}
      style={{
        // Parchment / sand luxury radial gradient matching screenshot
        background:
          'radial-gradient(ellipse at 45% 40%, #f6eee2 0%, #ede1cb 45%, #e2d2b5 85%, #d8c39e 100%)',
      }}
    >
      {/* Dynamic Transform Layer */}
      <div
        className="absolute top-0 left-0 origin-top-left transition-transform duration-75 ease-out pointer-events-none"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
        }}
      >
        {/* Generation Guides (Dotted horizontal lanes) */}
        {layout.guides.map((guide) => {
          const isSelected = selectedGeneration === guide.generation
          return (
            <div
              key={`guide-${guide.generation}`}
              className="absolute left-0 right-0 flex items-center pointer-events-none"
              style={{
                top: `${guide.y + 19}px`,
                height: '1px',
              }}
            >
              <div
                className={`w-full border-b transition-colors duration-200 ${
                  isSelected
                    ? 'border-solid border-[#826738] opacity-70'
                    : 'border-dashed border-[#cbba9d] opacity-50'
                }`}
              />
              <span
                className={`absolute left-8 text-[11px] font-semibold tracking-wider uppercase transition-colors px-2 py-0.5 rounded ${
                  isSelected
                    ? 'text-[#473413] bg-[#e4d4b8]/70 font-bold'
                    : 'text-[#9c8b73] bg-[#ede1cb]/50'
                }`}
              >
                {guide.label}
              </span>
            </div>
          )
        })}

        {/* SVG Connector Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: `${contentWidth}px`, height: `${contentHeight}px` }}
        >
          {layout.connections.map((conn) => {
            if (conn.type === 'spouse') {
              // Direct horizontal link between partners
              return (
                <line
                  key={conn.id}
                  x1={conn.fromX}
                  y1={conn.fromY}
                  x2={conn.toX}
                  y2={conn.toY}
                  stroke="#ba9f7b"
                  strokeWidth="1.8"
                  strokeDasharray="2 3"
                />
              )
            }

            // Smooth rounded lineage paths with curved sibling turns.
            if (conn.path) {
              return (
                <path
                  key={conn.id}
                  d={conn.path}
                  fill="none"
                  stroke="#a68b63"
                  strokeWidth={conn.type === 'lineage' ? 1.9 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )
            }

            // Fallback for simple straight drops.
            return (
              <line
                key={conn.id}
                x1={conn.fromX}
                y1={conn.fromY}
                x2={conn.toX}
                y2={conn.toY}
                stroke="#a68b63"
                strokeWidth={1.7}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Person Nodes */}
        {layout.nodes.map((node) => {
          const isSelected = selectedPersonId === node.person.id
          const isHighlightedGen = selectedGeneration === node.person.generation

          return (
            <div
              key={node.person.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectPerson(node.person)
              }}
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-150 group rounded-full`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
                height: `${node.height}px`,
              }}
            >
              {/* Card Body matching screenshot */}
              <div
                dir="rtl"
                className={`w-full h-full rounded-full flex items-center px-2.5 gap-2 transition-all ${
                  isSelected
                    ? 'bg-[#ffffff] shadow-[0_4px_16px_rgba(40,25,5,0.22)] ring-2 ring-[#a48148]'
                    : isHighlightedGen
                    ? 'bg-white/95 shadow-[0_2px_10px_rgba(45,30,10,0.12)] border border-[#d6be9a] hover:shadow-lg hover:border-[#a48148]'
                    : 'bg-white/90 hover:bg-white shadow-[0_2px_8px_rgba(45,30,10,0.08)] border border-[#dec5a3]/90 hover:border-[#a48148] hover:shadow-md'
                }`}
              >
                {/* Initial Avatar Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 uppercase transition-colors ${
                    isSelected
                      ? 'bg-[#1c1a17] text-white'
                      : 'bg-[#f4ebe0] text-[#2c2419] border border-[#d8c5ad]'
                  }`}
                >
                  {node.person.initial}
                </div>

                {/* Full Name */}
                <span
                  dir="rtl"
                  className={`flex-1 min-w-0 text-right text-[12.5px] font-semibold truncate tracking-[-0.01em] ${
                    isSelected ? 'text-[#1c1a17] font-bold' : 'text-[#1f1a14]'
                  }`}
                >
                  {node.person.fullName}
                </span>

                {node.person.carriesFamilyName && (
                  <span
                    className="shrink-0 flex items-center text-[#a48148]"
                    title="Carries the family name"
                    aria-label="Carries the family name"
                  >
                    <Gem className="w-3 h-3 fill-[#e3c98a]/70 drop-shadow-[0_1px_1px_rgba(80,55,15,0.35)]" />
                  </span>
                )}

                {/* Info Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowInfo?.(node.person)
                  }}
                  className="shrink-0 p-0.5 rounded-full text-[#8a7a65] hover:text-[#1c1a17] hover:bg-[#ede3d0] transition-colors"
                  title="Full information"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Zoom & Center Controls (Bottom-Right, matching screenshot) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col items-center bg-white/90 backdrop-blur-md border border-[#dfd2be] rounded-xl shadow-[0_4px_14px_rgba(30,20,10,0.12)] p-1 gap-1">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3a3022] hover:bg-[#ede3d0] active:bg-[#e4d6be] transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-5 h-[1px] bg-[#e6dac7]" />

        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3a3022] hover:bg-[#ede3d0] active:bg-[#e4d6be] transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-5 h-[1px] bg-[#e6dac7]" />

        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#73634f] hover:text-[#1c1a17] hover:bg-[#ede3d0] transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

