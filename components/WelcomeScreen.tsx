'use client'
import { useStore } from '@/lib/store'

interface Props {
  onShowWalkthrough: () => void
}

export default function WelcomeScreen({ onShowWalkthrough }: Props) {
  const hydrated = useStore((s) => s._hasHydrated)
  const hasSeenWelcome = useStore((s) => s.hasSeenWelcome)
  const setHasSeenWelcome = useStore((s) => s.setHasSeenWelcome)

  if (!hydrated || hasSeenWelcome) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] px-8">

      {/* Wordmark */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <svg width="48" height="62" viewBox="0 0 64 82" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10 L26 41 L4 72" stroke="#1565C0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"/>
          <path d="M20 10 L42 41 L20 72" stroke="#1565C0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.68"/>
          <path d="M36 10 L58 41 L36 72" stroke="#1E88E5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold text-4xl uppercase tracking-widest text-white">RUN</span>
          <span className="font-display font-bold text-4xl uppercase tracking-widest" style={{ color: '#1E88E5' }}>ON</span>
        </div>
      </div>

      {/* Copy */}
      <div className="text-center mb-10 max-w-xs">
        <h1 className="font-display font-bold text-2xl uppercase tracking-wide text-white mb-3">
          Team selection, sorted.
        </h1>
        <p className="text-base text-[rgba(255,255,255,0.5)] leading-relaxed">
          Build your lineup, share it with the group. Takes about two minutes.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={setHasSeenWelcome}
        className="w-full max-w-xs py-4 rounded-2xl bg-[#1E88E5] text-white font-display font-bold text-base uppercase tracking-widest cursor-pointer hover:bg-[#1976D2] active:scale-[0.98] transition-all shadow-lg mb-4"
      >
        Get Started
      </button>

      {/* Walkthrough link */}
      <button
        onClick={() => { setHasSeenWelcome(); onShowWalkthrough() }}
        className="text-sm text-[rgba(255,255,255,0.38)] hover:text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer py-2"
      >
        See how it works
      </button>

    </div>
  )
}
