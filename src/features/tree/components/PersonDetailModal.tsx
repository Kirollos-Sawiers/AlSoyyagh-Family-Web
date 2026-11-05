import { useEffect } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Briefcase,
  Heart,
  Users,
  Edit3,
  ArrowRight,
  Plus,
  Info,
  Gem,
} from 'lucide-react'
import type {
  MemberBrief,
  MemberCard,
  MemberDetails,
  Spouse,
} from '../../../services/treeApi'
import { personFromBrief } from '../data/apiMapping'
import { Person } from '../types'

interface PersonDetailModalProps {
  person: Person | null
  allPeople: Person[]
  card?: MemberCard | null
  details?: MemberDetails | null
  isLoadingCard?: boolean
  isLoadingDetails?: boolean
  error?: string | null
  onClose: () => void
  onSelectPerson: (person: Person) => void
  onLoadDetails: (id: string) => void
  onEdit: (person: Person) => void
  onAddChild: (person: Person) => void
}

function MemberChip({
  name,
  initial,
  onClick,
}: {
  name: string
  initial: string
  onClick?: () => void
}) {
  const className =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0e8dc] text-xs font-medium text-[#2d261b] transition-colors'
  const content = (
    <>
      <span className="w-4 h-4 rounded-full bg-[#dfcaa4] text-[10px] font-bold flex items-center justify-center">
        {initial}
      </span>
      {name}
    </>
  )
  if (!onClick) {
    return <span dir="rtl" className={className}>{content}</span>
  }
  return (
    <button type="button" dir="rtl" onClick={onClick} className={`${className} hover:bg-[#e4d7c5]`}>
      {content}
    </button>
  )
}

const briefInitial = (name: string) => name.trim().charAt(0) || '?'

export function PersonDetailModal({
  person,
  allPeople,
  card,
  details,
  isLoadingCard = false,
  isLoadingDetails = false,
  error,
  onClose,
  onSelectPerson,
  onLoadDetails,
  onEdit,
  onAddChild,
}: PersonDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!person) return null

  const displayName = details?.name || card?.name || person.fullName
  const displayInitial = details?.name
    ? briefInitial(details.name)
    : card?.name
      ? briefInitial(card.name)
      : person.initial
  const serial = details?.serial || card?.serial
  const carriesFamilyName =
    details?.carriesFamilyName ??
    card?.carriesFamilyName ??
    person.carriesFamilyName ??
    false
  const isDeceased = details?.isDeceased ?? card?.isDeceased ?? person.deathYear != null
  const dateOfBirth = details?.dateOfBirth || card?.dateOfBirth
  const dateOfDeath = details?.dateOfDeath || card?.dateOfDeath
  const detailSpouses = details?.spouses ?? []
  const detailChildren = details?.children ?? []
  const detailSiblings = details?.siblings ?? []
  const needsReview = details?.needsReview ?? []
  const location =
    details?.residence ||
    details?.birthPlace ||
    person.currentPlace ||
    person.birthPlace ||
    '—'
  const occupation = details?.occupation || person.profession
  const bio = details?.bio || person.bio

  const spouse = person.spouseId
    ? allPeople.find((item) => item.id === person.spouseId)
    : null
  const parents = (person.parentIds || [])
    .map((id) => allPeople.find((item) => item.id === id))
    .filter((item): item is Person => Boolean(item))
  const children = (person.childrenIds || [])
    .map((id) => allPeople.find((item) => item.id === id))
    .filter((item): item is Person => Boolean(item))
  const siblings = allPeople.filter(
    (item) =>
      item.id !== person.id &&
      item.parentIds &&
      person.parentIds &&
      item.parentIds.length > 0 &&
      item.parentIds.some((parentId) => person.parentIds?.includes(parentId)),
  )

  const openBrief = (brief: MemberBrief, generation: number) => {
    if (brief.id == null) return
    onSelectPerson(personFromBrief(brief, generation, person.branch))
  }

  const openSpouse = (item: Spouse) => {
    if (item.memberId == null) return
    onSelectPerson(
      personFromBrief(
        { id: item.memberId, name: item.name, gender: undefined },
        person.generation,
        person.branch,
      ),
    )
  }

  const timeline =
    dateOfBirth || dateOfDeath || person.birthYear || person.deathYear
      ? `${dateOfBirth || person.birthYear || 'Unknown'} — ${
          isDeceased
            ? dateOfDeath || person.deathYear || 'Deceased'
            : 'Present (Living)'
        }`
      : isDeceased
        ? 'Deceased'
        : 'Present (Living)'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto bg-[#faf6f0] border-l sm:border border-[#ded3be] sm:rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 text-[#1c1a17] z-10"
        style={{ boxShadow: '0 20px 40px -15px rgba(45,35,20,0.3)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebdcc7] pb-4">
          <div dir="rtl" className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#dfcaa4] to-[#b8955c] p-[2px] shadow-sm shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#f7f2eb] flex items-center justify-center font-bold text-lg text-[#2e261a]">
                {displayInitial}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[#1c1a17] text-[#f7f2ea]">
                  Gen {person.generation}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ebdcc7] text-[#544733]">
                  {person.branch} Branch
                </span>
                {serial && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0e8dc] text-[#6b5a41]">
                    #{serial}
                  </span>
                )}
                {carriesFamilyName && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f3e6c9] text-[#6b5120] border border-[#dcc28a]"
                    title="Carries the family name"
                  >
                    <Gem className="w-2.5 h-2.5 text-[#a48148] fill-[#e3c98a]/70" />
                    Carries family name
                  </span>
                )}
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold mt-1 text-[#1c1a17] leading-tight flex items-center gap-2"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {displayName}
                {carriesFamilyName && (
                  <Gem
                    className="shrink-0 w-3.5 h-3.5 text-[#a48148] fill-[#e3c98a]/70 drop-shadow-[0_1px_1px_rgba(80,55,15,0.35)]"
                    aria-label="Carries the family name"
                  />
                )}
              </h2>
              {(details?.nickname || card?.nickname) && (
                <p className="text-xs text-[#7e7362] mt-0.5">
                  {details?.nickname || card?.nickname}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c705e] hover:text-[#1c1a17] hover:bg-[#ebdcc7]/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {carriesFamilyName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f3e6c9]/70 border border-[#e2cfa6] text-[11px] font-medium text-[#6b5120]">
            <Gem className="w-3 h-3 shrink-0 text-[#a48148] fill-[#e3c98a]/70" />
            <span>This member carries the family name.</span>
          </div>
        )}

        {isLoadingCard && (
          <p className="text-xs text-[#8a7f6e]">Loading member card…</p>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 rounded-xl p-3 border border-[#e5d9c5]">
            <div className="flex items-center gap-1.5 text-xs text-[#7e7362] font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#a88d61]" />
              <span>Timeline</span>
            </div>
            <p className="text-sm font-semibold text-[#1c1a17]">{timeline}</p>
          </div>

          <div className="bg-white/80 rounded-xl p-3 border border-[#e5d9c5]">
            <div className="flex items-center gap-1.5 text-xs text-[#7e7362] font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#a88d61]" />
              <span>Location</span>
            </div>
            <p className="text-sm font-semibold text-[#1c1a17] truncate">{location}</p>
          </div>
        </div>

        {occupation && (
          <div className="bg-white/80 rounded-xl p-3 border border-[#e5d9c5] flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-[#a88d61] shrink-0" />
            <div className="text-xs">
              <span className="text-[#7e7362] block">Profession & Calling</span>
              <span className="font-semibold text-[#1c1a17]">{occupation}</span>
            </div>
          </div>
        )}

        {bio && (
          <div className="bg-white/60 rounded-xl p-3.5 border border-[#e5d9c5]/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7e7362] mb-1.5">
              Archive Note
            </h3>
            <p className="text-xs sm:text-sm text-[#3b3429] leading-relaxed">{bio}</p>
          </div>
        )}

        {!details && (
          <button
            type="button"
            onClick={() => onLoadDetails(person.id)}
            disabled={isLoadingDetails}
            className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#ccc4ae] text-xs font-semibold text-[#554e42] hover:bg-[#ece3d2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Info className="w-3.5 h-3.5" />
            {isLoadingDetails ? 'Loading more details…' : 'More details'}
          </button>
        )}

        {details && (
          <>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7e7362] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#a88d61]" />
                Direct Relations
              </h3>

              {(details.father || details.mother || details.parent) && (
                <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                  <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                    Parents
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {details.father && (
                      <MemberChip
                        name={details.father.name}
                        initial={briefInitial(details.father.name)}
                        onClick={() =>
                          openBrief(details.father as MemberBrief, person.generation - 1)
                        }
                      />
                    )}
                    {details.mother && (
                      <MemberChip
                        name={details.mother.name}
                        initial={briefInitial(details.mother.name)}
                        onClick={() =>
                          openBrief(details.mother as MemberBrief, person.generation - 1)
                        }
                      />
                    )}
                    {!details.father &&
                      !details.mother &&
                      details.parent && (
                        <MemberChip
                          name={details.parent.name}
                          initial={briefInitial(details.parent.name)}
                          onClick={() =>
                            openBrief(details.parent as MemberBrief, person.generation - 1)
                          }
                        />
                      )}
                  </div>
                </div>
              )}

              {detailSpouses.length > 0 && (
                <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                  <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                    Spouses
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detailSpouses.map((item) => (
                      <MemberChip
                        key={item.id}
                        name={item.name}
                        initial={briefInitial(item.name)}
                        onClick={item.memberId != null ? () => openSpouse(item) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {detailChildren.length > 0 && (
                <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                  <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                    Children ({detailChildren.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detailChildren.map((child) => (
                      <MemberChip
                        key={`${child.id}-${child.name}`}
                        name={child.name}
                        initial={briefInitial(child.name)}
                        onClick={() => openBrief(child, person.generation + 1)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {detailSiblings.length > 0 && (
                <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                  <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                    Siblings ({detailSiblings.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detailSiblings.map((sibling) => (
                      <MemberChip
                        key={`${sibling.id}-${sibling.name}`}
                        name={sibling.name}
                        initial={briefInitial(sibling.name)}
                        onClick={() => openBrief(sibling, person.generation)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {details.linkedMember && (
                <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7e7362] uppercase block font-bold">
                      Linked member · {details.linkedMember.tree}
                    </span>
                    <span className="text-sm font-semibold text-[#1c1a17]">
                      {details.linkedMember.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPerson(
                        personFromBrief(
                          {
                            id: details.linkedMember?.id ?? null,
                            name: details.linkedMember?.name ?? '',
                          },
                          person.generation,
                          person.branch,
                        ),
                      )
                    }
                    className="text-xs font-semibold text-[#87652e] hover:text-[#523d18] flex items-center gap-1 hover:underline"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {needsReview.length > 0 && (
                <div className="bg-white/60 rounded-xl p-3 border border-[#e5d9c5]/80">
                  <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1">
                    Needs review
                  </span>
                  <ul className="text-xs text-[#6b5a41] list-disc list-inside space-y-0.5">
                    {needsReview.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {!details && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7e7362] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#a88d61]" />
              Direct Relations
            </h3>

            {spouse && (
              <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-[#c75d50] fill-[#c75d50]/20 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#7e7362] uppercase block font-bold">
                      Spouse
                    </span>
                    <span className="text-sm font-semibold text-[#1c1a17]">
                      {spouse.fullName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectPerson(spouse)}
                  className="text-xs font-semibold text-[#87652e] hover:text-[#523d18] flex items-center gap-1 hover:underline"
                >
                  View <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {parents.length > 0 && (
              <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                  Parents ({parents.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {parents.map((item) => (
                    <MemberChip
                      key={item.id}
                      name={item.fullName}
                      initial={item.initial}
                      onClick={() => onSelectPerson(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {children.length > 0 && (
              <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                  Children ({children.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {children.map((item) => (
                    <MemberChip
                      key={item.id}
                      name={item.fullName}
                      initial={item.initial}
                      onClick={() => onSelectPerson(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {siblings.length > 0 && (
              <div className="bg-white/85 rounded-xl p-3 border border-[#e5d9c5]">
                <span className="text-[10px] text-[#7e7362] uppercase block font-bold mb-1.5">
                  Siblings ({siblings.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {siblings.map((item) => (
                    <MemberChip
                      key={item.id}
                      name={item.fullName}
                      initial={item.initial}
                      onClick={() => onSelectPerson(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-[#ebdcc7] mt-auto flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => onEdit(person)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1c1a17] hover:bg-[#312d28] text-[#f7f2ea] text-xs sm:text-sm font-semibold shadow-md transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit member
          </button>
          <button
            type="button"
            onClick={() => onAddChild(person)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#ccc4ae] text-[#3b3429] hover:bg-[#ece3d2] text-xs sm:text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add child
          </button>
        </div>
      </div>
    </div>
  )
}
