'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Trash2, ChevronRight, Calendar, MapPin, Copy, HelpCircle, MessageSquare } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Lineup, isLightColour, formatTime, formatMatchDate } from '@/lib/types'
import WelcomeScreen from '@/components/WelcomeScreen'
import Walkthrough from '@/components/Walkthrough'
import FeedbackModal from '@/components/FeedbackModal'

function LineupCard({
  lineup, onDelete, onDuplicate, highlight,
}: {
  lineup: Lineup; onDelete: () => void; onDuplicate: () => void; highlight: boolean
}) {
  const [confirm, setConfirm] = useState(false)
  const filled = Object.keys(lineup.positions).length
  const primary = lineup.primaryColour || '#003087'
  const onPrimary = isLightColour(primary) ? '#000000' : '#ffffff'
  const dateStr = formatMatchDate(lineup.date)

  return (
    <div className={`group relative rounded-2xl bg-white overflow-hidden transition-all ${
      highlight
        ? 'shadow-[0_0_0_2px_rgba(30,136,229,0.45),0_4px_20px_rgba(0,0,0,0.1)] border border-[rgba(30,136,229,0.3)]'
        : 'border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
    }`}>

      {/* Progress stripe — filled proportion shown in club colour */}
      <div className="relative h-1.5 w-full overflow-hidden" style={{ background: `${primary}25` }}>
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{ width: `${Math.round((filled / 25) * 100)}%`, background: primary }}
        />
      </div>

      <Link href={`/lineup/${lineup.id}`} className="flex items-center gap-4 px-4 py-4">

        {lineup.logoDataUrl ? (
          <div
            className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5"
            style={{ background: `${primary}18`, border: `1.5px solid ${primary}30` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lineup.logoDataUrl} alt="" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div
            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-display font-bold text-2xl"
            style={{ background: primary, color: onPrimary }}
          >
            {(lineup.teamName || lineup.clubName || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-display font-bold text-base uppercase tracking-wide text-[#0a0a0a] truncate leading-tight">
              {lineup.teamName || lineup.clubName}
            </span>
            {lineup.ageGroup && (
              <span className="text-xs font-semibold shrink-0" style={{ color: primary }}>
                {lineup.ageGroup}
              </span>
            )}
          </div>

          {lineup.opponent && (
            <p className="text-sm text-[rgba(0,0,0,0.45)] font-medium truncate">
              vs {lineup.opponent}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {dateStr && (
              <span className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.3)]">
                <Calendar size={10} />
                {dateStr}{lineup.time ? ` · ${formatTime(lineup.time)}` : ''}
              </span>
            )}
            {lineup.venue && (
              <span className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.3)] truncate max-w-[140px]">
                <MapPin size={10} />
                {lineup.venue}
              </span>
            )}
            <span
              className="text-xs font-semibold"
              style={{ color: filled === 25 ? primary : 'rgba(0,0,0,0.25)' }}
            >
              {filled}/25
            </span>
          </div>
        </div>

        <ChevronRight size={16} className="text-[rgba(0,0,0,0.2)] group-hover:text-[rgba(0,0,0,0.5)] transition-colors shrink-0" />
      </Link>

      <div className="flex items-center justify-end gap-1 px-3 pb-2.5">
        {confirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[rgba(0,0,0,0.4)]">Delete lineup?</span>
            <button
              onClick={onDelete}
              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold cursor-pointer border border-red-200"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="text-xs text-[rgba(0,0,0,0.4)] font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={(e) => { e.preventDefault(); onDuplicate() }}
              title="Duplicate lineup"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[rgba(0,0,0,0.35)] hover:text-[#0a0a0a] hover:bg-[rgba(0,0,0,0.05)] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Copy size={12} />
              Copy
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setConfirm(true) }}
              title="Delete lineup"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[rgba(0,0,0,0.25)] hover:text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { lineups, deleteLineup, duplicateLineup } = useStore()
  const [walkthroughOpen, setWalkthroughOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [recentId, setRecentId] = useState<string | null>(null)

  const now = Date.now()
  const sorted = [...lineups].sort((a, b) => {
    const aMs = a.date ? new Date(a.date + 'T12:00:00').getTime() : null
    const bMs = b.date ? new Date(b.date + 'T12:00:00').getTime() : null
    // A lineup is "upcoming" if its date is today or in the future (24h grace)
    const aUp = aMs !== null && aMs >= now - 86_400_000
    const bUp = bMs !== null && bMs >= now - 86_400_000
    if (aUp && bUp) return (aMs as number) - (bMs as number) // soonest first
    if (aUp) return -1
    if (bUp) return 1
    return b.createdAt - a.createdAt // past / no date: newest first
  })

  function handleDuplicate(id: string) {
    const newId = duplicateLineup(id)
    setRecentId(newId)
    setTimeout(() => setRecentId(null), 2500)
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <WelcomeScreen onShowWalkthrough={() => setWalkthroughOpen(true)} />
      {walkthroughOpen && <Walkthrough onClose={() => setWalkthroughOpen(false)} />}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="20" height="26" viewBox="0 0 64 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M4 10 L26 41 L4 72" stroke="#1565C0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"/>
                <path d="M20 10 L42 41 L20 72" stroke="#1565C0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.68"/>
                <path d="M36 10 L58 41 L36 72" stroke="#1E88E5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-xl uppercase tracking-widest text-[#0a0a0a]">RUN</span>
                <span className="font-display font-bold text-xl uppercase tracking-widest" style={{ color: '#1E88E5' }}>ON</span>
              </div>
            </div>
            <p className="text-xs text-[rgba(0,0,0,0.38)] mt-0.5 font-medium">Team Management</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWalkthroughOpen(true)}
              title="How it works"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-[rgba(0,0,0,0.12)] text-[rgba(0,0,0,0.4)] hover:text-[#0a0a0a] hover:border-[rgba(0,0,0,0.25)] transition-colors cursor-pointer"
            >
              <HelpCircle size={16} />
            </button>
            <Link
              href="/squad"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgba(0,0,0,0.12)] text-[rgba(0,0,0,0.55)] hover:text-[#0a0a0a] hover:border-[rgba(0,0,0,0.25)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Users size={13} />
              Squad
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16 gap-6">
            <div className="w-32 opacity-20">
              <svg viewBox="0 0 100 115" className="w-full">
                <ellipse cx="50" cy="57" rx="46" ry="52" fill="#1B5E20" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
                <circle cx="50" cy="57" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
                <line x1="18" y1="25" x2="82" y2="25" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35" />
                <line x1="18" y1="89" x2="82" y2="89" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35" />
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-xl uppercase tracking-wide text-[rgba(0,0,0,0.6)]">
                No lineups yet
              </p>
              <p className="text-sm text-[rgba(0,0,0,0.38)] mt-1.5 max-w-xs">
                Build your first team sheet and share it with the group
              </p>
            </div>
            <Link
              href="/lineup/new"
              className="flex items-center gap-2 px-6 py-3.5 bg-[#0a0a0a] text-white font-display font-bold text-base uppercase tracking-widest rounded-2xl hover:bg-[#1a1a1a] active:scale-[0.99] transition-all cursor-pointer shadow-lg"
            >
              <Plus size={18} />
              New Lineup
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[rgba(0,0,0,0.38)]">
                Lineups
              </h2>
              <Link
                href="/lineup/new"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a] text-white font-display font-bold text-xs uppercase tracking-widest hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <Plus size={13} />
                New
              </Link>
            </div>

            <div className="space-y-3">
              {sorted.map((lineup) => (
                <LineupCard
                  key={lineup.id}
                  lineup={lineup}
                  highlight={recentId === lineup.id}
                  onDelete={() => deleteLineup(lineup.id)}
                  onDuplicate={() => handleDuplicate(lineup.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 space-y-2">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="flex items-center gap-1.5 mx-auto text-xs text-[rgba(0,0,0,0.32)] hover:text-[rgba(0,0,0,0.6)] transition-colors cursor-pointer"
        >
          <MessageSquare size={11} />
          Send feedback
        </button>
        <p className="text-xs text-[rgba(0,0,0,0.18)]">
          Run-On by{' '}
          <a href="https://hotboxdesign.com.au" className="hover:text-[rgba(0,0,0,0.45)] transition-colors">
            Hotbox Design
          </a>
        </p>
      </div>
    </div>
  )
}
