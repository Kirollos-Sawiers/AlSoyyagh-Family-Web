import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getApiErrorMessage } from '../../../services/api'
import { addChild, updateMember, type MemberChanges } from '../../../services/treeApi'
import {
  suggestChangeSchema,
  type SuggestChangeFormData,
} from '../schemas/workspaceSchemas'

interface SuggestChangeCardProps {
  onSuccess?: (suggestion: {
    type: string
    name: string
    requester: string
  }) => void
}

export function SuggestChangeCard({ onSuccess }: SuggestChangeCardProps) {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SuggestChangeFormData>({
    resolver: zodResolver(suggestChangeSchema),
    defaultValues: {
      mode: 'add',
      memberId: '',
      firstName: '',
      lastName: 'Al-Soyyagh',
      birthYear: '',
      deathYear: '',
      place: '',
      parentIds: '',
      spouseIds: '',
      isMarriedIntoFamily: false,
      lifeStory: '',
      reviewerNote: '',
    },
  })

  useEffect(() => {
    const suggestPerson = searchParams.get('suggestPerson')
    if (suggestPerson) {
      setMode('edit')
      setValue('mode', 'edit')
      const parts = suggestPerson.trim().split(' ')
      if (parts.length > 1) {
        setValue('firstName', parts[0])
        setValue('lastName', parts.slice(1).join(' '))
      } else {
        setValue('firstName', suggestPerson)
      }
    }
  }, [searchParams, setValue])

  const handleModeChange = (newMode: 'add' | 'edit') => {
    setMode(newMode)
    setValue('mode', newMode)
  }

  const onSubmit = async (data: SuggestChangeFormData) => {
    setSubmitError(null)
    const fullName = `${data.firstName} ${data.lastName}`.trim()
    const firstId = (value?: string) =>
      value
        ?.split(',')
        .map((part) => part.trim())
        .find((part) => /^\d+$/.test(part))

    const changes: MemberChanges = {
      name: fullName,
      dateOfBirth: data.birthYear || null,
      dateOfDeath: data.deathYear || null,
      isDeceased: Boolean(data.deathYear),
      birthPlace: data.place || null,
      bio: data.lifeStory || null,
      notes: data.reviewerNote || null,
    }

    try {
      let result: 'saved' | 'sent-for-approval'

      if (data.mode === 'add') {
        const parentId = firstId(data.parentIds)
        if (!parentId) {
          setSubmitError('A numeric parent member ID is required to add a relative.')
          return
        }
        const otherParent = firstId(data.spouseIds)
        result = await addChild(parentId, {
          ...changes,
          ...(otherParent ? { otherParentSpouseId: Number(otherParent) } : {}),
        })
      } else {
        const memberId = data.memberId?.trim()
        if (!memberId) {
          setSubmitError('Member ID is required to suggest an edit.')
          return
        }
        result = await updateMember(memberId, changes)
      }

      setSuccessMessage(
        result === 'saved'
          ? `Changes to "${fullName}" were saved.`
          : `Suggestion to ${data.mode === 'add' ? 'add' : 'edit'} "${fullName}" has been submitted for review.`,
      )

      if (onSuccess) {
        let requester = 'you'
        try {
          const info = JSON.parse(localStorage.getItem('user_info') || '{}')
          requester = info.email || info.name || info.fullName || 'you'
        } catch {
          // ignore
        }
        onSuccess({
          type: data.mode === 'add' ? 'Add' : 'Edit',
          name: fullName,
          requester,
        })
      }

      reset({
        mode,
        memberId: '',
        firstName: '',
        lastName: 'Al-Soyyagh',
        birthYear: '',
        deathYear: '',
        place: '',
        parentIds: '',
        spouseIds: '',
        isMarriedIntoFamily: false,
        lifeStory: '',
        reviewerNote: '',
      })
      setTimeout(() => setSuccessMessage(null), 6000)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    }
  }

  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <h2
        className="text-xl sm:text-2xl font-bold mb-4 text-[#1c1a17]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        Suggest a change
      </h2>

      {/* Mode Toggle Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => handleModeChange('add')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            mode === 'add'
              ? 'bg-[#1c1a17] text-[#f5f0e8] shadow-sm'
              : 'bg-[#ede8de] text-[#554e42] border border-[#ccc4ae] hover:bg-[#e4ddcf]'
          }`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Add a relative
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('edit')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            mode === 'edit'
              ? 'bg-[#1c1a17] text-[#f5f0e8] shadow-sm'
              : 'bg-[#ede8de] text-[#554e42] border border-[#ccc4ae] hover:bg-[#e4ddcf]'
          }`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Edit a relative
        </button>
      </div>

      {successMessage && (
        <div className="mb-5 p-3 rounded-xl bg-[#e6efdb] border border-[#bcd2a4] text-[#3e5623] text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[#3e5623] hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {submitError && (
        <div className="mb-5 p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium flex items-center justify-between">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="hover:opacity-70 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mode === 'edit' && (
            <div>
              <label
                htmlFor="field-memberId"
                className="block text-xs font-medium mb-1.5 text-[#3b3429]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Member ID
              </label>
              <input
                id="field-memberId"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 42"
                {...register('memberId')}
                className="w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]"
                style={{
                  backgroundColor: '#ede8de',
                  borderColor: '#ccc4ae',
                  color: '#1c1a17',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          )}

          {/* First name */}
          <div>
            <label
              htmlFor="field-firstName"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              First name
            </label>
            <input
              id="field-firstName"
              type="text"
              {...register('firstName')}
              className={`w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 ${
                errors.firstName
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.firstName ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.firstName && (
              <p className="mt-1 text-[11px] text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last name */}
          <div>
            <label
              htmlFor="field-lastName"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Last name
            </label>
            <input
              id="field-lastName"
              type="text"
              {...register('lastName')}
              className={`w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 ${
                errors.lastName
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.lastName ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.lastName && (
              <p className="mt-1 text-[11px] text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Birth year */}
          <div>
            <label
              htmlFor="field-birthYear"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Birth year
            </label>
            <input
              id="field-birthYear"
              type="text"
              inputMode="numeric"
              placeholder=""
              {...register('birthYear')}
              className={`w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 ${
                errors.birthYear
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.birthYear ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.birthYear && (
              <p className="mt-1 text-[11px] text-red-600">
                {errors.birthYear.message}
              </p>
            )}
          </div>

          {/* Death year (optional) */}
          <div>
            <label
              htmlFor="field-deathYear"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Death year (optional)
            </label>
            <input
              id="field-deathYear"
              type="text"
              inputMode="numeric"
              placeholder=""
              {...register('deathYear')}
              className={`w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 ${
                errors.deathYear
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]'
              }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.deathYear ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {errors.deathYear && (
              <p className="mt-1 text-[11px] text-red-600">
                {errors.deathYear.message}
              </p>
            )}
          </div>

          {/* Place */}
          <div>
            <label
              htmlFor="field-place"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Place
            </label>
            <input
              id="field-place"
              type="text"
              placeholder=""
              {...register('place')}
              className="w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]"
              style={{
                backgroundColor: '#ede8de',
                borderColor: '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Parent IDs (comma separated) */}
          <div>
            <label
              htmlFor="field-parentIds"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Parent IDs (comma separated)
            </label>
            <input
              id="field-parentIds"
              type="text"
              placeholder=""
              {...register('parentIds')}
              className="w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]"
              style={{
                backgroundColor: '#ede8de',
                borderColor: '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Spouse IDs (comma separated) */}
          <div>
            <label
              htmlFor="field-spouseIds"
              className="block text-xs font-medium mb-1.5 text-[#3b3429]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Spouse IDs (comma separated)
            </label>
            <input
              id="field-spouseIds"
              type="text"
              placeholder=""
              {...register('spouseIds')}
              className="w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]"
              style={{
                backgroundColor: '#ede8de',
                borderColor: '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Married into the family (Checkbox) */}
          <div className="flex items-center md:pt-5 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('isMarriedIntoFamily')}
                className="w-4 h-4 rounded border border-[#ccc4ae] text-[#1c1a17] focus:ring-0 focus:ring-offset-0 bg-[#ede8de] cursor-pointer"
                style={{ accentColor: '#1c1a17' }}
              />
              <span
                className="text-xs text-[#3b3429] font-normal"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Married into the family
              </span>
            </label>
          </div>
        </div>

        {/* Life story */}
        <div>
          <label
            htmlFor="field-lifeStory"
            className="block text-xs font-medium mb-1.5 text-[#3b3429]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Life story
          </label>
          <textarea
            id="field-lifeStory"
            rows={4}
            {...register('lifeStory')}
            className="w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64] resize-y"
            style={{
              backgroundColor: '#ede8de',
              borderColor: '#ccc4ae',
              color: '#1c1a17',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Note for the reviewer */}
        <div>
          <label
            htmlFor="field-reviewerNote"
            className="block text-xs font-medium mb-1.5 text-[#3b3429]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Note for the reviewer
          </label>
          <input
            id="field-reviewerNote"
            type="text"
            placeholder=""
            {...register('reviewerNote')}
            className="w-full px-3 py-2 rounded-lg border outline-none text-xs transition-colors duration-150 focus:border-[#8c7b64] focus:ring-1 focus:ring-[#8c7b64]"
            style={{
              backgroundColor: '#ede8de',
              borderColor: '#ccc4ae',
              color: '#1c1a17',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Send for approval button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {isSubmitting ? 'Sending...' : 'Send for approval'}
          </button>
        </div>
      </form>
    </section>
  )
}
