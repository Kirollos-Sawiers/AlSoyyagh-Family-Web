import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { joinSchema, type JoinFormData } from '../schemas/joinSchema'
import { submitJoinRequest } from '@/services/api'

export function useJoinForm() {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      relation: '',
    },
  })

  const onSubmit = async (data: JoinFormData) => {
    try {
      await submitJoinRequest({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        relation: data.relation || undefined,
      })
      setSubmitted(true)
    } catch (error) {
      form.setError('root', {
        type: 'server',
        message: 'Something went wrong. Please try again.',
      })
    }
  }

  return { form, onSubmit, submitted }
}
