import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { GoldLogoCard } from './GoldLogoCard'
import { Person, TreeStats } from '../types'

interface TreeSidebarProps {
  stats: TreeStats
  people: Person[]
  selectedGeneration: number | null
  onSelectGeneration: (gen: number | null) => void
  onSelectPerson: (person: Person) => void
  onCloseMobileDrawer?: () => void
  generations?: number[]
}

export function TreeSidebar({
  stats,
  people,
  selectedGeneration,
  onSelectGeneration,
  onSelectPerson,
  onCloseMobileDrawer,
  generations: generationsProp,
}: TreeSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Filter people matching search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return people
      .filter((p) => {
        return (
          p.fullName.toLowerCase().includes(q) ||
          (p.birthYear && p.birthYear.toString().includes(q)) ||
          (p.currentPlace && p.currentPlace.toLowerCase().includes(q)) ||
          (p.birthPlace && p.birthPlace.toLowerCase().includes(q)) ||
          (p.profession && p.profession.toLowerCase().includes(q))
        )
      })
      .slice(0, 8)
  }, [searchQuery, people])

  const generations =
    generationsProp && generationsProp.length > 0
      ? generationsProp
      : [1, 2, 3, 4, 5, 6, 7]

  return (
    <aside className="w-full sm:w-[320px] md:w-83.75 h-full flex flex-col justify-between p-4 sm:p-5 bg-[#f5ede1] border-r border-[#ded4c1] overflow-y-auto select-none shrink-0 shadow-[4px_0_16px_rgba(40,30,10,0.03)] z-30">
      <div className="space-y-6">
        {/* Mobile Header with Close button if inside mobile drawer */}
        <div className="flex items-center justify-between sm:hidden pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#796c59]">
            Archive Navigation
          </span>
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-md text-[#796c59] hover:bg-[#eae0cf]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 1. Gold Emblem Brand Card */}
        <GoldLogoCard />

        {/* 2. FIND A PERSON */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="person-search"
              className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase"
            >
              Find a person
            </label>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#857762] hover:text-[#231b12] underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#9c8e7a] absolute left-3 pointer-events-none" />
              <input
                id="person-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Name, year, place..."
                className="w-full pl-9 pr-8 py-2.5 bg-white/90 focus:bg-white text-xs font-medium text-[#1c1a17] placeholder-[#a49784] rounded-xl border border-[#ded3be] focus:border-[#9e7e49] focus:outline-none focus:ring-2 focus:ring-[#c9a76d]/30 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 rounded text-[#9c8e7a] hover:text-[#1c1a17]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 bg-[#fdfbf8] border border-[#dccbb4] rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-[#f0e6d6]"
                onMouseDown={(e) => e.preventDefault()} // Keep focus
              >
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPerson(p)
                      setSearchQuery('')
                      setIsSearchFocused(false)
                      if (onCloseMobileDrawer) onCloseMobileDrawer()
                    }}
                    dir="rtl"
                    className="w-full text-right px-3 py-2.5 hover:bg-[#f3eadc] flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#ebdcc7] text-[#2c2214] text-[11px] font-bold flex items-center justify-center shrink-0">
                        {p.initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#1c1a17] truncate">
                          {p.fullName}
                        </div>
                        <div className="text-[10px] text-[#80725f] truncate">
                          {p.birthYear || '—'} · {p.currentPlace || p.birthPlace || p.branch}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#6d5b41] bg-[#efe3d1] px-1.5 py-0.5 rounded shrink-0">
                      Gen {p.generation}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. AT A GLANCE */}
        <div>
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase mb-2">
            At a glance
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Stat 1: Members */}
            <div className="bg-white/85 backdrop-blur-xs border border-[#ded3be] rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div
                className="text-2xl font-bold text-[#1c1a17] leading-none"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {stats.membersCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-[#7d6f5c] mt-1">Members</div>
            </div>

            {/* Stat 2: Generations */}
            <div className="bg-white/85 backdrop-blur-xs border border-[#ded3be] rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div
                className="text-2xl font-bold text-[#1c1a17] leading-none"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {stats.generationsCount}
              </div>
              <div className="text-[11px] font-medium text-[#7d6f5c] mt-1">Generations</div>
            </div>

            {/* Stat 3: Branches */}
            <div className="bg-white/85 backdrop-blur-xs border border-[#ded3be] rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div
                className="text-2xl font-bold text-[#1c1a17] leading-none"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {stats.branchesCount}
              </div>
              <div className="text-[11px] font-medium text-[#7d6f5c] mt-1">Branches</div>
            </div>

            {/* Stat 4: Countries */}
            <div className="bg-white/85 backdrop-blur-xs border border-[#ded3be] rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div
                className="text-2xl font-bold text-[#1c1a17] leading-none"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {stats.countriesCount}
              </div>
              <div className="text-[11px] font-medium text-[#7d6f5c] mt-1">Countries</div>
            </div>
          </div>
        </div>

        {/* 4. JUMP TO GENERATION */}
        <div className="pt-2 border-t border-[#ded4c1]">
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase mb-2.5">
            Jump to generation
          </h2>

          <div className="flex flex-wrap gap-1.5">
            {generations.map((gen) => {
              const isActive = selectedGeneration === gen
              return (
                <button
                  key={`gen-btn-${gen}`}
                  onClick={() => {
                    // Toggle generation filter/focus
                    onSelectGeneration(isActive ? null : gen)
                    if (onCloseMobileDrawer) onCloseMobileDrawer()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1c1a17] text-white shadow-sm ring-1 ring-[#1c1a17]'
                      : 'bg-white/85 hover:bg-white text-[#382f23] border border-[#ded3be] hover:border-[#b89e74]'
                  }`}
                >
                  Gen {gen}
                </button>
              )
            })}
          </div>

          <p className="text-[11px] text-[#8c7e6c] font-medium mt-3 leading-relaxed">
            {stats.membersCount.toLocaleString()} lives across {stats.generationsCount} generations. Drag to roam.
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="pt-4 border-t border-[#ded4c1] mt-6 flex items-center justify-between text-[11px] text-[#8c7e6c]">
        <span>Al-Soyyagh Lineage</span>
        <span>Est. 1802</span>
      </div>
    </aside>
  )
}
