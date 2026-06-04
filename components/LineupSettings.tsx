'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Lineup } from '@/lib/types'
import ColourPicker from './ColourPicker'
import LogoUpload from './LogoUpload'
import BackgroundPhotoUpload from './BackgroundPhotoUpload'

type FeedbackState = 'idle' | 'sending' | 'success' | 'error'

interface Props {
  lineup: Lineup
  onSave: (updates: Partial<Lineup>) => void
  onClose: () => void
}

export default function LineupSettings({ lineup, onSave, onClose }: Props) {
  const [opponent, setOpponent] = useState(lineup.opponent || '')
  const [venue, setVenue] = useState(lineup.venue || '')
  const [date, setDate] = useState(lineup.date || '')
  const [time, setTime] = useState(lineup.time || '')
  const [colour, setColour] = useState(lineup.primaryColour || '#003087')
  const [logo, setLogo] = useState(lineup.logoDataUrl || '')
  const [bgPhoto, setBgPhoto] = useState(lineup.backgroundPhotoDataUrl || '')

  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle')

  async function handleFeedbackSend() {
    if (!feedbackText.trim() || feedbackState === 'sending') return
    setFeedbackState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText }),
      })
      setFeedbackState(res.ok ? 'success' : 'error')
    } catch {
      setFeedbackState('error')
    }
  }

  function handleSave() {
    onSave({ opponent, venue, date, time, primaryColour: colour, logoDataUrl: logo, backgroundPhotoDataUrl: bgPhoto })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.12)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="font-display font-bold text-base uppercase tracking-widest text-[#0a0a0a]">
            Lineup Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[rgba(0,0,0,0.35)] hover:text-[#0a0a0a] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Match details */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-3">
              Match Details
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.5)] mb-1">Opponent</label>
                <input
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="e.g. Northside FC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F7F8FA] text-sm text-[#0a0a0a] focus:outline-none focus:border-[rgba(0,0,0,0.3)] placeholder:text-[rgba(0,0,0,0.25)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.5)] mb-1">Venue</label>
                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Oval Park No. 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F7F8FA] text-sm text-[#0a0a0a] focus:outline-none focus:border-[rgba(0,0,0,0.3)] placeholder:text-[rgba(0,0,0,0.25)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[rgba(0,0,0,0.5)] mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F7F8FA] text-sm text-[#0a0a0a] focus:outline-none focus:border-[rgba(0,0,0,0.3)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[rgba(0,0,0,0.5)] mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F7F8FA] text-sm text-[#0a0a0a] focus:outline-none focus:border-[rgba(0,0,0,0.3)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Club branding */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-3">
              Club Branding
            </p>
            <div className="space-y-4">
              <LogoUpload value={logo} onChange={setLogo} />
              <ColourPicker label="Club Colour" value={colour} onChange={setColour} />
              <BackgroundPhotoUpload value={bgPhoto} onChange={setBgPhoto} primaryColour={colour} />
            </div>
          </div>

          {/* Feedback */}
          <div className="pt-1">
            <div className="border-t border-[rgba(0,0,0,0.06)] pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-3">
                Send Feedback
              </p>
              {feedbackState === 'success' ? (
                <p className="text-sm text-[rgba(0,0,0,0.5)] py-2">Thanks — feedback sent.</p>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) setFeedbackText(e.target.value)
                    }}
                    rows={4}
                    placeholder="What's working, what's not, what you'd like to see..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F7F8FA] text-sm text-[#0a0a0a] focus:outline-none focus:border-[rgba(0,0,0,0.3)] placeholder:text-[rgba(0,0,0,0.25)] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgba(0,0,0,0.3)]">
                      {feedbackText.length} / 1000
                    </span>
                    <button
                      onClick={handleFeedbackSend}
                      disabled={feedbackState === 'sending' || !feedbackText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#0a0a0a] text-white font-display font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      {feedbackState === 'sending' ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  {feedbackState === 'error' && (
                    <p className="text-xs text-red-500">Something went wrong. Try again.</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Save button */}
        <div className="shrink-0 px-5 py-4 border-t border-[rgba(0,0,0,0.06)]">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-[#0a0a0a] text-white font-display font-bold text-sm uppercase tracking-widest cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}
