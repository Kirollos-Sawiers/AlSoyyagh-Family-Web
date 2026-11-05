import { useEffect, useState } from 'react'
import { Lock, Send } from 'lucide-react'
import { getApiErrorMessage } from '../../../services/api'
import { requestTreeAccess, type Tree } from '../../../services/treeApi'

interface AccessRequestPanelProps {
  tree: Tree
  onRequested?: () => void
}

export function AccessRequestPanel({ tree, onRequested }: AccessRequestPanelProps) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const treeLabel = tree === 'EGYPT' ? 'Egypt' : 'Jordan'

  useEffect(() => {
    setReason('')
    setStatus('idle')
    setError(null)
  }, [tree])

  const handleRequest = async () => {
    setStatus('sending')
    setError(null)
    try {
      await requestTreeAccess(tree, reason.trim() || undefined)
      setStatus('sent')
      onRequested?.()
    } catch (err) {
      setStatus('idle')
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center p-6"
      style={{
        background:
          'radial-gradient(ellipse at 45% 40%, #f6eee2 0%, #ede1cb 45%, #e2d2b5 85%, #d8c39e 100%)',
      }}
    >
      <div className="w-full max-w-md bg-[#faf6f0] border border-[#ded3be] rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1c1a17] text-[#f7f2ea] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-5 h-5" />
        </div>
        <h2
          className="text-xl sm:text-2xl font-bold text-[#1c1a17]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {treeLabel} tree is private
        </h2>
        <p className="text-sm text-[#6b6253] mt-2">
          You need approval to view the {treeLabel} tree. Send a request and a super admin
          will review it.
        </p>

        {status === 'sent' ? (
          <div className="mt-5 p-3 rounded-xl bg-[#e6efdb] border border-[#bcd2a4] text-[#3e5623] text-xs font-medium">
            Request sent. You will be notified once a super admin approves it.
          </div>
        ) : (
          <>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Why do you need access? (optional)"
              className="mt-5 w-full px-3 py-2 rounded-lg border outline-none text-xs resize-y focus:ring-2 focus:ring-amber-200 transition-all"
              style={{
                backgroundColor: '#ede8de',
                borderColor: '#ccc4ae',
                color: '#1c1a17',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {error && <p className="mt-2 text-xs text-[#8a2f22]">{error}</p>}
            <button
              type="button"
              onClick={handleRequest}
              disabled={status === 'sending'}
              className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Send className="w-3.5 h-3.5" />
              {status === 'sending' ? 'Sending…' : 'Request access'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
