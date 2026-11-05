import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { getApiErrorMessage } from '../../../services/api'
import {
  addChild,
  updateMember,
  type MemberCard,
  type MemberChanges,
  type MemberDetails,
} from '../../../services/treeApi'
import type { Person } from '../types'

type EditorMode = 'edit' | 'add-child'

interface MemberFormModalProps {
  mode: EditorMode
  person: Person
  card?: MemberCard | null
  details?: MemberDetails | null
  onClose: () => void
  onSuccess: (message: string, saved: boolean) => void
}

interface MemberFormState {
  name: string
  nickname: string
  gender: 'M' | 'F' | 'U'
  dateOfBirth: string
  dateOfDeath: string
  birthPlace: string
  residence: string
  occupation: string
  bio: string
  notes: string
  carriesFamilyName: boolean
  isDeceased: boolean
}

const toDateInput = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : ''

const buildInitialState = (
  mode: EditorMode,
  person: Person,
  card?: MemberCard | null,
  details?: MemberDetails | null,
): MemberFormState => {
  if (mode === 'add-child') {
    return {
      name: '',
      nickname: '',
      gender: 'M',
      dateOfBirth: '',
      dateOfDeath: '',
      birthPlace: '',
      residence: '',
      occupation: '',
      bio: '',
      notes: '',
      carriesFamilyName: true,
      isDeceased: false,
    }
  }

  return {
    name: details?.name ?? card?.name ?? person.fullName,
    nickname: details?.nickname ?? card?.nickname ?? '',
    gender: details?.gender ?? card?.gender ?? (person.gender === 'F' ? 'F' : 'M'),
    dateOfBirth: toDateInput(details?.dateOfBirth ?? card?.dateOfBirth),
    dateOfDeath: toDateInput(details?.dateOfDeath ?? card?.dateOfDeath),
    birthPlace: details?.birthPlace ?? '',
    residence: details?.residence ?? '',
    occupation: details?.occupation ?? '',
    bio: details?.bio ?? person.bio ?? '',
    notes: details?.notes ?? '',
    carriesFamilyName: details?.carriesFamilyName ?? card?.carriesFamilyName ?? true,
    isDeceased: details?.isDeceased ?? card?.isDeceased ?? false,
  }
}

export function MemberFormModal({
  mode,
  person,
  card,
  details,
  onClose,
  onSuccess,
}: MemberFormModalProps) {
  const [form, setForm] = useState<MemberFormState>(() =>
    buildInitialState(mode, person, card, details),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof MemberFormState>(
    key: K,
    value: MemberFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    const payload: MemberChanges = {
      name: form.name.trim(),
      nickname: form.nickname.trim() || null,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || null,
      dateOfDeath: form.dateOfDeath || null,
      birthPlace: form.birthPlace.trim() || null,
      residence: form.residence.trim() || null,
      occupation: form.occupation.trim() || null,
      bio: form.bio.trim() || null,
      notes: form.notes.trim() || null,
      carriesFamilyName: form.carriesFamilyName,
      isDeceased: form.isDeceased,
    }

    setIsSaving(true)
    setError(null)
    try {
      const result =
        mode === 'edit'
          ? await updateMember(person.id, payload)
          : await addChild(person.id, payload)

      const saved = result === 'saved'
      onSuccess(
        saved ? 'Saved successfully.' : 'Sent to admins for approval.',
        saved,
      )
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: '#ede8de',
    borderColor: '#ccc4ae',
    color: '#1c1a17',
    fontFamily: "'DM Sans', sans-serif",
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border outline-none text-xs focus:ring-2 focus:ring-amber-200 transition-all'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#faf6f0] border border-[#ded3be] rounded-2xl shadow-2xl p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebdcc7] pb-4 mb-5">
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-[#1c1a17]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {mode === 'edit' ? 'Edit member' : `Add child of ${person.fullName}`}
            </h2>
            <p className="text-xs text-[#7e7362] mt-1">
              Changes may be sent to admins for approval.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c705e] hover:text-[#1c1a17] hover:bg-[#ebdcc7]/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Full name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Nickname
            </label>
            <input
              type="text"
              value={form.nickname}
              onChange={(event) => updateField('nickname', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Gender
            </label>
            <select
              value={form.gender}
              onChange={(event) =>
                updateField('gender', event.target.value as MemberFormState['gender'])
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="U">Unknown</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Date of birth
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => updateField('dateOfBirth', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Date of death
            </label>
            <input
              type="date"
              value={form.dateOfDeath}
              onChange={(event) => updateField('dateOfDeath', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Birth place
            </label>
            <input
              type="text"
              value={form.birthPlace}
              onChange={(event) => updateField('birthPlace', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Residence
            </label>
            <input
              type="text"
              value={form.residence}
              onChange={(event) => updateField('residence', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Occupation
            </label>
            <input
              type="text"
              value={form.occupation}
              onChange={(event) => updateField('occupation', event.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Bio
            </label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(event) => updateField('bio', event.target.value)}
              className={`${inputClass} resize-y`}
              style={inputStyle}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5 text-[#3b3429]">
              Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              className={`${inputClass} resize-y`}
              style={inputStyle}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.carriesFamilyName}
              onChange={(event) =>
                updateField('carriesFamilyName', event.target.checked)
              }
              className="w-4 h-4 accent-[#1c1a17]"
            />
            <span className="text-xs text-[#3b3429]">Carries family name</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isDeceased}
              onChange={(event) => updateField('isDeceased', event.target.checked)}
              className="w-4 h-4 accent-[#1c1a17]"
            />
            <span className="text-xs text-[#3b3429]">Deceased</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-[#ebdcc7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#554e42] border border-[#ccc4ae] hover:bg-[#ece3d2] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? 'Saving…'
              : mode === 'edit'
                ? 'Save changes'
                : 'Add child'}
          </button>
        </div>
      </form>
    </div>
  )
}
