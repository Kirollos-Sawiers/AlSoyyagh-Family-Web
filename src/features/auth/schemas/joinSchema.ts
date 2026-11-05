import { z } from 'zod'

export const joinSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .min(7, 'Please enter a valid phone number'),
  relation: z.string().optional(),
})

export type JoinFormData = z.infer<typeof joinSchema>
