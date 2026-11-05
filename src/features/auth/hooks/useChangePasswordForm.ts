import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../schemas/changePasswordSchema'
import { changePassword, getApiErrorMessage, refreshCurrentUser } from '../../../services/api'

export function useChangePasswordForm() {
  const [saved, setSaved] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      const response = await changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
      }
      await refreshCurrentUser()
      setSaved(true)
    } catch (error) {
      const message = getApiErrorMessage(error)
      form.setError('root', {
        type: 'server',
        message,
      })
    }
  }

  return { form, onSubmit, saved }
}
