import { Link } from 'react-router-dom'
import logo from '../../../assets/alsoyyagh.jpg'
import { useJoinForm } from '../hooks/useJoinForm'

export function JoinPage() {
  const { form, onSubmit, submitted } = useJoinForm()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  /* ── shared style tokens ── */
  const bg = '#d4c9a8'
  const card = '#f5f0e8'
  const dark = '#1c1a17'
  const muted = '#6b6253'
  const faint = '#8a7f6e'
  const inputBg = '#ede8de'
  const inputBorder = '#ccc4ae'
  const font = 'Inter, sans-serif'

  const inputBase = `w-full px-3 py-2.5 rounded-lg border outline-none transition-all duration-200 text-sm`

  /* ── success screen ── */
  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: bg }}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl px-8 py-10 text-center"
          style={{ backgroundColor: card }}
        >
          {/* tick icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: dark }}
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
            style={{ color: dark, fontFamily: font }}
          >
            Request sent!
          </h2>
          <p className="text-sm mb-7" style={{ color: muted, fontFamily: font }}>
            We've received your request. Once approved, you'll receive your sign-in
            details by email.
          </p>
          <Link
            to="/"
            className="inline-block text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: dark, fontFamily: font }}
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
      style={{ backgroundColor: bg }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl px-8 py-10"
        style={{ backgroundColor: card }}
      >
        {/* ── Logo + Brand ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-[#c9b790] shadow-sm">
            <img
              src={logo}
              alt="Al-Soyyagh logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p
              className="text-base font-bold leading-none"
              style={{ color: dark, fontFamily: font }}
            >
              Al-Soyyagh
            </p>
            <p
              className="text-[10px] tracking-[0.15em] uppercase mt-0.5"
              style={{ color: faint, fontFamily: font }}
            >
              Private Family Archive
            </p>
          </div>
        </div>

        {/* ── Heading ── */}
        <h1
          className="text-3xl font-bold mb-2 leading-tight"
          style={{ color: dark, fontFamily: font }}
        >
          Join the family<br />archive
        </h1>
        <p className="text-sm mb-7" style={{ color: muted, fontFamily: font }}>
          Tell us who you are. Once approved, you'll receive your sign-in details.
        </p>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Server-level error */}
          {errors.root && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontFamily: font }}
            >
              {errors.root.message}
            </div>
          )}

          {/* Full name */}
          <div>
            <label
              htmlFor="join-fullname"
              className="block text-sm font-medium mb-1.5"
              style={{ color: dark, fontFamily: font }}
            >
              Full name
            </label>
            <input
              id="join-fullname"
              type="text"
              autoComplete="name"
              placeholder=""
              {...register('fullName')}
              className={`${inputBase} ${errors.fullName
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'focus:ring-2 focus:ring-amber-300'
                }`}
              style={{
                backgroundColor: inputBg,
                borderColor: errors.fullName ? undefined : inputBorder,
                color: dark,
                fontFamily: font,
              }}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: font }}>
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="join-email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: dark, fontFamily: font }}
            >
              Email
            </label>
            <input
              id="join-email"
              type="email"
              autoComplete="email"
              placeholder=""
              {...register('email')}
              className={`${inputBase} ${errors.email
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'focus:ring-2 focus:ring-amber-300'
                }`}
              style={{
                backgroundColor: inputBg,
                borderColor: errors.email ? undefined : inputBorder,
                color: dark,
                fontFamily: font,
              }}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: font }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="join-phone"
              className="block text-sm font-medium mb-1.5"
              style={{ color: dark, fontFamily: font }}
            >
              Phone number
            </label>
            <input
              id="join-phone"
              type="tel"
              autoComplete="tel"
              placeholder=""
              {...register('phone')}
              className={`${inputBase} ${errors.phone
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'focus:ring-2 focus:ring-amber-300'
                }`}
              style={{
                backgroundColor: inputBg,
                borderColor: errors.phone ? undefined : inputBorder,
                color: dark,
                fontFamily: font,
              }}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: font }}>
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Relation (optional) */}
          <div>
            <label
              htmlFor="join-relation"
              className="block text-sm font-medium mb-1.5"
              style={{ color: dark, fontFamily: font }}
            >
              How are you related?{' '}
              <span style={{ color: faint, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="join-relation"
              type="text"
              placeholder="e.g. grandson of Ahmed Al-Soyyagh"
              {...register('relation')}
              className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all duration-200 text-sm focus:ring-2 focus:ring-amber-300"
              style={{
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: dark,
                fontFamily: font,
              }}
            />
          </div>

          {/* Submit */}
          <button
            id="join-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{
              backgroundColor: dark,
              color: card,
              fontFamily: font,
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
              <>
                {/* send / paper-plane icon */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send request
              </>
            )}
          </button>
        </form>

        {/* ── Footer ── */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: faint, fontFamily: font }}
        >
          Already a member?{' '}
          <Link
            to="/"
            id="join-signin-link"
            className="font-semibold underline underline-offset-2 transition-colors duration-150"
            style={{ color: dark }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
