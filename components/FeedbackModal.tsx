'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

const MAX = 1000

interface Props {
  onClose: () => void
}

export default function FeedbackModal({ onClose }: Props) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSend() {
    if (!message.trim() || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-5">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">

        <div className="flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.12)]" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="font-display font-bold text-base uppercase tracking-widest text-[#0a0a0a]">
            Send Feedback
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[rgba(0,0,0,0.35)] hover:text-[#0a0a0a] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {status === 'sent' ? (
            <p className="text-sm text-[rgba(0,0,0,0.5)] text-center py-4">
              Thanks — feedback sent.
            </p>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                rows={5}
                placeholder="What's working, what's not, what you'd like to see..."
                className="w-full px-3.5 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F7F8FA] text-sm text-[#0a0a0a] focus:outline-none focus:border-[rgba(0,0,0,0.3)] placeholder:text-[rgba(0,0,0,0.25)] resize-none"
              />
              <div className="flex items-center justify-between mt-2 mb-4">
                <span className="text-xs text-[rgba(0,0,0,0.28)]">{message.length} / {MAX}</span>
                {status === 'error' && (
                  <span className="text-xs text-red-500">Something went wrong. Try again.</span>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || status === 'sending'}
                className="w-full py-3 rounded-xl bg-[#0a0a0a] text-white font-display font-bold text-sm uppercase tracking-widest cursor-pointer hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
