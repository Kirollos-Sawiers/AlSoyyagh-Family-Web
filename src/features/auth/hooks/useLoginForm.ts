import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginSchema, type LoginFormData } from '../schemas/loginSchema'
import { login, getApiErrorMessage, refreshCurrentUser } from '../../../services/api'

export function useLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data)
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
      }
      if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user))
      }
      if (response.mustChangePassword) {
        navigate('/change-password')
        return
      }
      await refreshCurrentUser()
      const from = (location.state as { from?: string } | null)?.from
      navigate(from || '/')
    } catch (error) {
      const message = getApiErrorMessage(error)
      form.setError('root', { type: 'server', message })
    }
  }

  return { form, onSubmit }
}
