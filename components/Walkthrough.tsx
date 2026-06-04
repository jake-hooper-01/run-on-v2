'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

const STEPS = [
  {
    title: 'Your Squad',
    body: 'Start by adding your players in the Squad screen. Name, number, and status — that\'s all you need. You only do this once.',
    note: null,
  },
  {
    title: 'Build Your Lineup',
    body: 'Create a lineup for each match. Tap any position on the field to assign a player. Tap an occupied position to move them.',
    note: null,
  },
  {
    title: 'Swap & Adjust',
    body: 'Selected a player? Tap another occupied position to swap them instantly. Tap the same player again to deselect.',
    note: null,
  },
  {
    title: 'Share It',
    body: 'When your team is set, hit Share to generate a 1080×1350 image — field view or team list. Send it straight to your group chat.',
    note: 'Got thoughts on Run-On? Use the feedback button in lineup settings — we read everything.',
  },
]

export default function Walkthrough({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-sm bg-[#111111] rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[rgba(255,255,255,0.35)] hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Skip walkthrough"
        >
          <X size={18} />
        </button>

        {/* Step counter */}
        <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-4">
          {step + 1} / {STEPS.length}
        </p>

        {/* Content */}
        <h2 className="font-display font-bold text-xl uppercase tracking-wide text-white mb-3">
          {current.title}
        </h2>
        <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed">
          {current.body}
        </p>

        {/* Task 4: feedback nudge on final step */}
        {current.note && (
          <p className="text-xs text-[rgba(255,255,255,0.3)] leading-relaxed mt-4 pt-4 border-t border-[rgba(255,255,255,0.07)]">
            {current.note}
          </p>
        )}

        {/* Step dots */}
        <div className="flex items-center gap-1.5 mt-6 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 16 : 6,
                height: 6,
                background: i === step ? '#1E88E5' : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.55)] font-display font-bold text-sm uppercase tracking-widest cursor-pointer hover:border-[rgba(255,255,255,0.25)] hover:text-white transition-colors min-h-[44px]"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? onClose : () => setStep(step + 1)}
            className="flex-1 py-3 rounded-xl bg-[#1E88E5] text-white font-display font-bold text-sm uppercase tracking-widest cursor-pointer hover:bg-[#1976D2] active:scale-[0.98] transition-all min-h-[44px]"
          >
            {isLast ? "Let's Go" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
