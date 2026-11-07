import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, Lock } from 'lucide-react'
import { getTreeAccess } from '../../../services/treeApi'
import {
  downloadMembersExport,
  getExportColumns,
  getExportErrorMessage,
  type ExportColumn,
  type ExportFormat,
  type ExportLanguage,
} from '../../../services/exportsApi'

type TreeScope = 'EGYPT' | 'JORDAN' | 'BOTH'

const TREE_LABELS: Record<string, string> = {
  EGYPT: 'Egypt',
  JORDAN: 'Jordan',
}

const treeLabel = (tree: string) =>
  TREE_LABELS[tree] || tree.charAt(0) + tree.slice(1).toLowerCase()

export function ExportMembersCard() {
  const [columns, setColumns] = useState<ExportColumn[]>([])
  const [treeOrder, setTreeOrder] = useState<string[]>(['EGYPT', 'JORDAN'])
  const [treeAccess, setTreeAccess] = useState<Record<string, boolean>>({
    EGYPT: true,
    JORDAN: true,
  })
  const [formatOptions, setFormatOptions] = useState<ExportFormat[]>([
    'csv',
    'pdf',
  ])

  const [scope, setScope] = useState<TreeScope>('BOTH')
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(),
  )
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [lang, setLang] = useState<ExportLanguage>('ar')

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setLoadError(null)

      const [metaResult, accessResult] = await Promise.allSettled([
        getExportColumns(),
        getTreeAccess(),
      ])

      if (!isMounted) return

      if (metaResult.status !== 'fulfilled') {
        setLoadError(
          await getExportErrorMessage(metaResult.reason),
        )
        setIsLoading(false)
        return
      }

      const meta = metaResult.value
      const trees = meta.trees.length > 0 ? meta.trees : ['EGYPT', 'JORDAN']

      setColumns(meta.columns)
      setTreeOrder(trees)

      const defaults = meta.columns
        .filter((column) => column.default)
        .map((column) => column.key)
      setSelectedColumns(
        new Set(
          defaults.length > 0
            ? defaults
            : meta.columns.map((column) => column.key),
        ),
      )

      const formats = meta.formats.filter(
        (item): item is ExportFormat => item === 'csv' || item === 'pdf',
      )
      setFormatOptions(formats.length > 0 ? formats : ['csv', 'pdf'])

      const access: Record<string, boolean> = {}
      trees.forEach((tree) => {
        access[tree] = true
      })
      if (accessResult.status === 'fulfilled') {
        accessResult.value.forEach((item) => {
          access[item.tree] = item.hasAccess
        })
      }
      setTreeAccess(access)
      setScope('BOTH')
      setIsLoading(false)
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const accessibleTrees = useMemo(
    () => treeOrder.filter((tree) => treeAccess[tree] !== false),
    [treeOrder, treeAccess],
  )

  const selectedTrees = useMemo(() => {
    if (scope === 'BOTH') return accessibleTrees
    return accessibleTrees.includes(scope) ? [scope] : []
  }, [scope, accessibleTrees])

  const columnLabel = (column: ExportColumn) =>
    (lang === 'ar' ? column.label?.ar : column.label?.en) || column.key

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllColumns = () => {
    setSelectedColumns(new Set(columns.map((column) => column.key)))
  }

  const resetColumns = () => {
    const defaults = columns
      .filter((column) => column.default)
      .map((column) => column.key)
    setSelectedColumns(
      new Set(defaults.length > 0 ? defaults : columns.map((c) => c.key)),
    )
  }

  const handleDownload = async () => {
    if (selectedTrees.length === 0) {
      setError('Select at least one tree.')
      return
    }
    if (selectedColumns.size === 0) {
      setError('Select at least one column.')
      return
    }

    setError(null)
    setIsDownloading(true)

    try {
      const { blob, filename } = await downloadMembersExport({
        format,
        trees: selectedTrees,
        columns:
          selectedColumns.size === columns.length
            ? 'all'
            : Array.from(selectedColumns),
        lang,
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (downloadError) {
      setError(await getExportErrorMessage(downloadError))
    } finally {
      setIsDownloading(false)
    }
  }

  const allColumnsSelected =
    columns.length > 0 && selectedColumns.size === columns.length
  const canDownload =
    !isDownloading &&
    selectedTrees.length > 0 &&
    selectedColumns.size > 0

  return (
    <section className="bg-[#f5f0e8] rounded-2xl shadow-sm border border-[#e2d9c8] p-6 sm:p-8 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold text-[#1c1a17]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Export members
          </h2>
          <p
            className="text-xs text-[#8a7f6e] mt-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Download the family register as CSV or PDF.
          </p>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#ece3d2] text-[#554e42] text-[10px] font-bold uppercase tracking-wide">
          Super admin
        </span>
      </div>

      {isLoading ? (
        <p
          className="text-xs text-[#8a7f6e] mt-5"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Loading export options…
        </p>
      ) : loadError ? (
        <p
          className="text-xs text-[#8a2f22] mt-5"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {loadError}
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Tree scope */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase mb-2">
              Trees
            </h3>
            <div className="flex flex-wrap gap-2">
              {treeOrder.map((tree) => {
                const accessible = treeAccess[tree] !== false
                const active = scope === tree
                return (
                  <button
                    key={`export-tree-${tree}`}
                    type="button"
                    disabled={!accessible}
                    onClick={() => setScope(tree as TreeScope)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-[#1c1a17] text-[#f5f0e8] border-[#1c1a17]'
                        : 'bg-white/80 text-[#382f23] border-[#ded3be] hover:border-[#b89e74]'
                    } ${!accessible ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={accessible ? undefined : 'No access to this tree'}
                  >
                    {!accessible && <Lock className="w-3 h-3" />}
                    {treeLabel(tree)}
                  </button>
                )
              })}
              <button
                type="button"
                disabled={accessibleTrees.length === 0}
                onClick={() => setScope('BOTH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  scope === 'BOTH'
                    ? 'bg-[#1c1a17] text-[#f5f0e8] border-[#1c1a17]'
                    : 'bg-white/80 text-[#382f23] border-[#ded3be] hover:border-[#b89e74]'
                } ${accessibleTrees.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase">
                Columns ({selectedColumns.size}/{columns.length})
              </h3>
              <div
                className="flex items-center gap-2 text-[11px]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="font-semibold text-[#554e42] underline underline-offset-2 hover:opacity-70"
                >
                  Select all
                </button>
                <span className="text-[#b3a48e]">·</span>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="font-semibold text-[#554e42] underline underline-offset-2 hover:opacity-70"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {columns.map((column) => {
                const checked = selectedColumns.has(column.key)
                return (
                  <label
                    key={`export-col-${column.key}`}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#1c1a17]/5 border-[#b89e74]'
                        : 'bg-white/70 border-[#e2d9c8] hover:border-[#c9b790]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColumn(column.key)}
                      className="w-3.5 h-3.5 rounded accent-[#1c1a17]"
                    />
                    <span
                      dir={lang === 'ar' ? 'rtl' : undefined}
                      className="text-xs text-[#3b3429] truncate"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      title={columnLabel(column)}
                    >
                      {columnLabel(column)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Format + language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase mb-2">
                Format
              </h3>
              <div className="flex gap-2">
                {formatOptions.map((option) => (
                  <button
                    key={`export-format-${option}`}
                    type="button"
                    onClick={() => setFormat(option)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      format === option
                        ? 'bg-[#1c1a17] text-[#f5f0e8] border-[#1c1a17]'
                        : 'bg-white/80 text-[#382f23] border-[#ded3be] hover:border-[#b89e74]'
                    }`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#857762] uppercase mb-2">
                Language
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    lang === 'ar'
                      ? 'bg-[#1c1a17] text-[#f5f0e8] border-[#1c1a17]'
                      : 'bg-white/80 text-[#382f23] border-[#ded3be] hover:border-[#b89e74]'
                  }`}
                >
                  Arabic
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    lang === 'en'
                      ? 'bg-[#1c1a17] text-[#f5f0e8] border-[#1c1a17]'
                      : 'bg-white/80 text-[#382f23] border-[#ded3be] hover:border-[#b89e74]'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#f7e3e0] border border-[#e0b4ac] text-[#8a2f22] text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="hover:opacity-70 ml-2 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={!canDownload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download {allColumnsSelected ? 'all columns' : 'selection'} (
                {format.toUpperCase()})
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}
