import { z } from 'zod'

export const suggestChangeSchema = z.object({
  mode: z.enum(['add', 'edit']),
  memberId: z.string().optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  birthYear: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (/^\d{3,4}$/.test(val) && Number(val) >= 1000 && Number(val) <= 2100),
      'Please enter a valid 4-digit year',
    ),
  deathYear: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (/^\d{3,4}$/.test(val) && Number(val) >= 1000 && Number(val) <= 2100),
      'Please enter a valid 4-digit year',
    ),
  place: z.string().optional().or(z.literal('')),
  parentIds: z.string().optional().or(z.literal('')),
  spouseIds: z.string().optional().or(z.literal('')),
  isMarriedIntoFamily: z.boolean(),
  lifeStory: z.string().optional().or(z.literal('')),
  reviewerNote: z.string().optional().or(z.literal('')),
})

export type SuggestChangeFormData = z.infer<typeof suggestChangeSchema>

export const createAccountSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  email: z.string().min(1, 'Email is required').email('Invalid email address').trim(),
  temporaryPassword: z.string().min(6, 'Temporary password must be at least 6 characters'),
  role: z.enum(['USER', 'CONTRIBUTOR', 'ADMIN', 'SUPER_ADMIN']),
})

export type CreateAccountFormData = z.infer<typeof createAccountSchema>
