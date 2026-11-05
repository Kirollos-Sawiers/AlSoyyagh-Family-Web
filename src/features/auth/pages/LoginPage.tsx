import { Link } from 'react-router-dom'
import logo from '../../../assets/alsoyyagh.jpg'
import { useLoginForm } from '../hooks/useLoginForm'

export function LoginPage() {
  const { form, onSubmit } = useLoginForm()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#d4c9a8' }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl px-10 py-10"
        style={{ backgroundColor: '#f5f0e8' }}
      >
        {/* Logo + Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-[#c9b790] shadow-sm">
            <img
              src={logo}
              alt="Al-Soyyagh logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-base font-bold leading-none" style={{ color: '#1c1a17', fontFamily: 'Inter, sans-serif' }}>
              Al-Soyyagh
            </p>
            <p
              className="text-[10px] tracking-[0.15em] uppercase mt-0.5"
              style={{ color: '#8a7f6e', fontFamily: 'Inter, sans-serif' }}
            >
              Private Family Archive
            </p>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: '#1c1a17', fontFamily: 'Inter, sans-serif' }}
        >
          Welcome back
        </h1>
        <p className="text-sm mb-8" style={{ color: '#6b6253', fontFamily: 'Inter, sans-serif' }}>
          Sign in with the credentials provided by your Super Admin.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {form.formState.errors.root && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
              {form.formState.errors.root.message}
            </div>
          )}
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#1c1a17', fontFamily: 'Inter, sans-serif' }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all duration-200 text-sm ${errors.email
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'focus:ring-2 focus:ring-amber-300'
                }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.email ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#1c1a17', fontFamily: 'Inter, sans-serif' }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all duration-200 text-sm ${errors.password
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'focus:ring-2 focus:ring-amber-300'
                }`}
              style={{
                backgroundColor: '#ede8de',
                borderColor: errors.password ? undefined : '#ccc4ae',
                color: '#1c1a17',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{
              backgroundColor: '#1c1a17',
              color: '#f5f0e8',
              fontFamily: 'Inter, sans-serif',
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="7.5" cy="15.5" r="5.5" />
                  <path d="M21 2l-9.6 9.6" />
                  <path d="M15.5 7.5l3 3L22 7l-3-3" />
                </svg>
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: '#8a7f6e', fontFamily: 'Inter, sans-serif' }}
        >
          New relative?{' '}
          <Link
            to="/join"
            id="request-to-join-link"
            className="font-semibold underline underline-offset-2 transition-colors duration-150"
            style={{ color: '#1c1a17' }}
          >
            Request to join
          </Link>
        </p>
      </div>
    </div>
  )
}
