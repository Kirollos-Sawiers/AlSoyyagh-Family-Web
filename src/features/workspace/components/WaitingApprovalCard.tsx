import { useState } from 'react'
import { getApiErrorMessage } from '../../../services/api'
import {
  approveChangeRequest,
  rejectChangeRequest,
  type ChangeRequestRecord,
} from '../../../services/workspaceApi'

interface WaitingApprovalCardProps {
  count?: number
  items?: ChangeRequestRecord[]
  onResolved?: (id: string) => void
}

type FieldEntry = readonly [string, unknown]

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  nickname: 'Nickname',
  gender: 'Gender',
  carriesFamilyName: 'Carries family name',
  dateOfBirth: 'Date of birth',
  dateOfDeath: 'Date of death',
  isDeceased: 'Deceased',
  birthPlace: 'Birth place',
  residence: 'Residence',
  occupation: 'Occupation',
  bio: 'Bio',
  notes: 'Notes',
  photoUrl: 'Photo URL',
  spouses: 'Spouses',
}

const FIELD_ORDER = [
  'name',
  'nickname',
  'gender',
  'dateOfBirth',
  'dateOfDeath',
  'isDeceased',
  'carriesFamilyName',
  'birthPlace',
  'residence',
  'occupation',
  'bio',
  'notes',
  'photoUrl',
  'spouses',
]

const fieldLabel = (key: string) => FIELD_LABELS[key] || key

const typeLabel = (type: string) =>
  type === 'ADD_CHILD' ? 'Add relative' : 'Edit member'

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()
}

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key === 'gender') {
    if (value === 'M') return 'Male'
    if (value === 'F') return 'Female'
    return 'Unknown'
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : '—'
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const valuesEqual = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

const payloadKeys = (payload: Record<string, unknown>) => [
  ...FIELD_ORDER.filter((key) => key in payload),
  ...Object.keys(payload).filter((key) => !FIELD_ORDER.includes(key)),
]

const requestedEntries = (request: ChangeRequestRecord): FieldEntry[] => {
  const payload = request.payload || {}
  return payloadKeys(payload).map((key) => [key, payload[key]] as const)
}

const changedEntries = (request: ChangeRequestRecord): FieldEntry[] => {
  const payload = request.payload || {}
  const before = (request.before || {}) as Record<string, unknown>
  return payloadKeys(payload)
    .filter((key) => !valuesEqual(payload[key], before[key]))
    .map((key) => [key, payload[key]] as const)
}

function DetailGrid({ entries }: { entries: FieldEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-[#8a7f6e]">
        No details were provided.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#8a7f6e]">
            {fieldLabel(key)}
          </div>
          <div className="text-xs font-medium text-[#2e261a] break-words">
            {formatValue(key, value)}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChangeList({
  entries,
  before,
}: {
  entries: FieldEntry[]
  before: Record<string, unknown>
}) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-[#8a7f6e]">
        No field changes detected.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-1 sm:gap-3 text-xs"
        >
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#8a7f6e] sm:pt-0.5">
            {fieldLabel(key)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[#a5493d]/80 line-through break-words">
              {formatValue(key, before[key])}
            </span>
            <span className="text-[#8a7f6e]">→</span>
            <span className="font-medium text-[#2e261a] break-words">
              {formatValue(key, value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function WaitingApprovalCard({
  count = 0,
  items = [],
  onResolved,
}: WaitingApprovalCardProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const total = items.length > 0 ? items.length : count

  let role = ''
  try {
    const info = JSON.parse(localStorage.getItem('user_info') || '{}')
    role = String(info.role || '').toUpperCase()
  } catch {
    // ignore
  }
  const canReview = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    setError(null)
    try {
      if (action === 'approve') {
        await approveChangeRequest(id)
      } else {
        await rejectChangeRequest(id)
      }
      onResolved?.(id)
    } catch (reviewError) {
      setError(getApiErrorMessage(reviewError))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <h2
        className="text-xl sm:text-2xl font-bold mb-3 text-[#1c1a17]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Waiting for approval ({total})
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p
          className="text-xs text-[#8a7f6e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Nothing to review.
        </p>
      ) : (
        <div className="divide-y divide-[#e6ded0]">
          {items.map((item) => {
            const before = (item.before || {}) as Record<string, unknown>
            const isAdd = item.type === 'ADD_CHILD'
            return (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div
                    className="text-xs text-[#1c1a17] min-w-0"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#ece3d2] text-[#554e42] text-[10px] font-bold uppercase tracking-wide">
                        {typeLabel(item.type)}
                      </span>
                      <span className="font-semibold text-sm text-[#1c1a17]">
                        {item.memberName}
                      </span>
                      {item.memberSerial && (
                        <span className="text-[10px] font-semibold text-[#736a5b]">
                          #{item.memberSerial}
                        </span>
                      )}
                    </div>
                    <div className="text-[#8a7f6e] mt-1">
                      {item.tree} · {isAdd ? 'new child of' : 'member'} · by{' '}
                      {item.requestedBy?.name || 'Unknown'}
                      {formatDate(item.createdAt)
                        ? ` · ${formatDate(item.createdAt)}`
                        : ''}
                    </div>
                  </div>

                  {canReview ? (
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleReview(item.id, 'approve')}
                        disabled={processingId === item.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {processingId === item.id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(item.id, 'reject')}
                        disabled={processingId === item.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#ccc4ae] text-[#554e42] hover:bg-[#ece3d2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className="text-[11px] font-medium text-[#8a7f6e] italic shrink-0"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Pending review
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-[#e2d9c8] bg-white/70 px-3.5 py-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7f6e]">
                    {isAdd ? 'Proposed new person' : 'Proposed changes'}
                  </div>
                  {isAdd ? (
                    <DetailGrid entries={requestedEntries(item)} />
                  ) : (
                    <ChangeList entries={changedEntries(item)} before={before} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
