import { useState } from 'react'
import { ChevronDown, ChevronRight, Heart, Info } from 'lucide-react'
import { Person, BranchType } from '../types'

interface TreeListViewProps {
  people: Person[]
  activeBranch: BranchType
  onSelectPerson: (person: Person) => void
  onShowInfo?: (person: Person) => void
}

export function TreeListView({ people, activeBranch, onSelectPerson, onShowInfo }: TreeListViewProps) {
  const [expandedGenerations, setExpandedGenerations] = useState<Record<number, boolean>>({
    4: true,
    5: true,
    6: true,
  })

  const toggleGen = (gen: number) => {
    setExpandedGenerations((prev) => ({ ...prev, [gen]: !prev[gen] }))
  }

  const generations = [1, 2, 3, 4, 5, 6, 7]

  // Filter people
  const filtered = people.filter((p) => {
    if (activeBranch === 'Both') return true
    if (p.branch === 'Both') return true
    return p.branch === activeBranch
  })

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-[#f5ede1] space-y-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <h2
            className="text-xl sm:text-2xl font-bold text-[#1c1a17]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Family Registry & Lineage
          </h2>
          <p className="text-xs sm:text-sm text-[#7d705d] mt-0.5">
            Structured records of the {activeBranch} branch across 7 generations.
          </p>
        </div>

        <div className="space-y-3">
          {generations.map((gen) => {
            const genPeople = filtered.filter((p) => p.generation === gen)
            if (genPeople.length === 0) return null
            const isExpanded = !!expandedGenerations[gen]

            return (
              <div
                key={`gen-list-${gen}`}
                className="bg-white/85 border border-[#dfd4c1] rounded-2xl overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => toggleGen(gen)}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-[#ebdcc7]/60 to-transparent flex items-center justify-between text-left hover:bg-[#ebdcc7]/90 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#8a7a65]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8a7a65]" />
                    )}
                    <span className="text-sm font-bold text-[#1c1a17]">
                      Generation {gen}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#dfd0be] text-[#4d3e2c]">
                      {genPeople.length} members
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 divide-y-0">
                    {genPeople.map((person) => {
                      const spouse = person.spouseId
                        ? people.find((p) => p.id === person.spouseId)
                        : null

                      return (
                        <div
                          key={person.id}
                          onClick={() => onSelectPerson(person)}
                          dir="rtl"
                          className="p-3 rounded-xl bg-white/90 border border-[#e5d9c7] hover:border-[#a48148] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#f2e7d7] text-[#2c2214] font-bold text-xs flex items-center justify-center shrink-0 border border-[#dbcabb]">
                              {person.initial}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-right text-xs sm:text-sm font-semibold text-[#1c1a17] truncate">
                                {person.fullName}
                              </h4>
                              <div className="text-[11px] text-[#7d705d] truncate flex items-center gap-1.5 mt-0.5">
                                <span>{person.birthYear || '—'}</span>
                                {person.currentPlace && (
                                  <>
                                    <span>·</span>
                                    <span>{person.currentPlace}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onShowInfo?.(person)
                              }}
                              className="shrink-0 p-1 rounded-full text-[#8a7a65] hover:text-[#1c1a17] hover:bg-[#ede3d0] transition-colors"
                              title="Full information"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {spouse && (
                            <div className="flex items-center gap-1 text-[11px] text-[#8a7a65] shrink-0 bg-[#f7f0e6] px-2 py-1 rounded-lg">
                              <Heart className="w-3 h-3 text-[#c75d50]" />
                              <span className="truncate max-w-[80px]">{spouse.firstName}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
