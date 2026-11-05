import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useChangePasswordForm } from '../hooks/useChangePasswordForm'

/* ─── design tokens (shared with LoginPage / JoinPage) ─── */
const C = {
  bg: '#d4c9a8',
  card: '#f5f0e8',
  dark: '#1c1a17',
  muted: '#6b6253',
  faint: '#8a7f6e',
  accent: '#a07840',   // warm amber – used for the lock icon
  inputBg: '#ede8de',
  inputBorder: '#ccc4ae',
  font: 'Inter, sans-serif',
} as const

/* ─── tiny reusable password input with show/hide toggle ─── */
function PasswordField({
  id,
  label,
  registration,
  error,
}: {
  id: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
  error?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5"
        style={{ color: C.dark, fontFamily: C.font }}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          {...registration}
          className={`w-full px-3 py-2.5 pr-10 rounded-lg border outline-none transition-all duration-200 text-sm ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'focus:ring-2 focus:ring-amber-300'
          }`}
          style={{
            backgroundColor: C.inputBg,
            borderColor: error ? undefined : C.inputBorder,
            color: C.dark,
            fontFamily: C.font,
          }}
        />

        {/* show / hide toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 transition-opacity hover:opacity-60"
          style={{ color: C.faint }}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            /* eye-off */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* eye */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500" style={{ fontFamily: C.font }}>
          {error}
        </p>
      )}
    </div>
  )
}

/* ─── password strength indicator ─── */
function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i <= score ? colors[score] : C.inputBorder,
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score], fontFamily: C.font }}>
        {labels[score]}
      </p>
    </div>
  )
}

/* ─── main page ─── */
export function ChangePasswordPage() {
  const { form, onSubmit, saved } = useChangePasswordForm()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const newPasswordValue = watch('newPassword')

  /* ── success screen ── */
  if (saved) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: C.bg }}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl px-8 py-10 text-center"
          style={{ backgroundColor: C.card }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: C.dark }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: C.dark, fontFamily: C.font }}
          >
            Password updated!
          </h2>
          <p
            className="text-sm mb-7"
            style={{ color: C.muted, fontFamily: C.font }}
          >
            Your new password has been saved. You can now sign in normally.
          </p>
          <Link
            to="/"
            className="inline-block text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: C.dark, fontFamily: C.font }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: C.bg }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl px-8 py-10"
        style={{ backgroundColor: C.card }}
      >
        {/* ── Lock icon ── */}
        <div className="mb-6">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.accent}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" fill={C.accent} stroke="none" />
          </svg>
        </div>

        {/* ── Heading ── */}
        <h1
          className="text-3xl font-bold mb-2 leading-tight"
          style={{ color: C.dark, fontFamily: C.font }}
        >
          Choose a new<br />password
        </h1>
        <p
          className="text-sm mb-7"
          style={{ color: C.muted, fontFamily: C.font }}
        >
          This one-time step protects your family account.
        </p>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Server error */}
          {errors.root && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontFamily: C.font,
              }}
            >
              {errors.root.message}
            </div>
          )}

          {/* Current password */}
          <PasswordField
            id="cp-current"
            label="Current (temporary) password"
            registration={register('currentPassword')}
            error={errors.currentPassword?.message}
          />

          {/* New password */}
          <div>
            <PasswordField
              id="cp-new"
              label="New password"
              registration={register('newPassword')}
              error={errors.newPassword?.message}
            />
            <StrengthBar password={newPasswordValue ?? ''} />
          </div>

          {/* Confirm password */}
          <PasswordField
            id="cp-confirm"
            label="Confirm password"
            registration={register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          {/* Submit */}
          <button
            id="cp-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{
              backgroundColor: C.dark,
              color: C.card,
              fontFamily: C.font,
            }}
          >
            {isSubmitting ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              'Save password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
