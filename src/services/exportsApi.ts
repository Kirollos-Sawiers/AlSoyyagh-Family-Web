import axios from 'axios'
import { apiClient, getApiErrorMessage } from './api'

export type ExportFormat = 'csv' | 'pdf'
export type ExportLanguage = 'ar' | 'en'
export type ExportTree = 'EGYPT' | 'JORDAN'

export interface ExportColumn {
  key: string
  label: { en: string; ar: string }
  type?: string
  default?: boolean
}

export interface ExportColumnsResponse {
  columns: ExportColumn[]
  trees: string[]
  formats: string[]
  languages: string[]
}

export interface DownloadMembersParams {
  format: ExportFormat
  trees: string[]
  columns: string[] | 'all'
  lang: ExportLanguage
}

export interface DownloadedFile {
  blob: Blob
  filename: string
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}

export async function getExportColumns(): Promise<ExportColumnsResponse> {
  const response = await apiClient.get<unknown>('/api/exports/columns')
  const payload = asRecord(response.data)
  const data =
    !Array.isArray(payload.columns) && payload.data
      ? asRecord(payload.data)
      : payload

  const columns = Array.isArray(data.columns)
    ? (data.columns as ExportColumn[])
    : []
  const trees = Array.isArray(data.trees)
    ? data.trees.map((tree) => String(tree).toUpperCase())
    : ['EGYPT', 'JORDAN']
  const formats = Array.isArray(data.formats)
    ? data.formats.map((format) => String(format).toLowerCase())
    : ['csv', 'pdf']
  const languages = Array.isArray(data.languages)
    ? data.languages.map((language) => String(language).toLowerCase())
    : ['ar', 'en']

  return { columns, trees, formats, languages }
}

export async function downloadMembersExport({
  format,
  trees,
  columns,
  lang,
}: DownloadMembersParams): Promise<DownloadedFile> {
  const response = await apiClient.get('/api/exports/members', {
    params: {
      format,
      trees: trees.join(','),
      columns: columns === 'all' ? 'all' : columns.join(','),
      lang,
    },
    responseType: 'blob',
  })

  const disposition = String(response.headers['content-disposition'] || '')
  const filename =
    disposition.match(/filename="?([^"]+)"?/i)?.[1] ||
    `soyyagh-members.${format}`

  return { blob: response.data as Blob, filename }
}

export async function getExportErrorMessage(error: unknown): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text()
      const parsed = asRecord(JSON.parse(text))
      const nested = asRecord(parsed.error)
      const message =
        (typeof nested.message === 'string' && nested.message) ||
        (typeof parsed.message === 'string' && parsed.message)
      if (message) return message
    } catch {
      // Fall through to the generic message resolver.
    }
  }
  return getApiErrorMessage(error)
}
