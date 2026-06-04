'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Lineup } from '@/lib/types'

type FormData = Omit<Lineup, 'id' | 'createdAt' | 'positions'>

const DEFAULTS: FormData = {
  clubName:               '',
  teamName:               '',
  ageGroup:               '',
  logoDataUrl:            '',
  primaryColour:          '#003087',
  backgroundPhotoDataUrl: '',
  opponent:               '',
  venue:                  '',
  date:                   '',
  time:                   '',
  displayMode:            'surname',
}

export default function NewLineupPage() {
  const router = useRouter()
  const createLineup = useStore((s) => s.createLineup)
  const [form, setForm] = useState<FormData>(DEFAULTS)
  const [error, setError] = useState(false)

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.teamName.trim() && !form.clubName.trim()) { setError(true); return }
    const id = createLineup(form)
    router.push(`/lineup/${id}`)
  }

  const inputCls =
    'w-full bg-[#F7F8FA] border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[#0a0a0a] placeholder-[rgba(0,0,0,0.25)] focus:outline-none focus:border-[#0a0a0a] transition-colors text-sm'

  const labelCls =
    'block text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-1.5'

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-10">

      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg text-[rgba(0,0,0,0.4)] hover:text-[#0a0a0a] transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-display font-bold text-lg uppercase tracking-widest text-[#0a0a0a]">
            New Lineup
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        <section className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[rgba(0,0,0,0.35)] mb-4">Team</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Club Name</label>
              <input
                value={form.clubName}
                onChange={(e) => set('clubName', e.target.value)}
                placeholder="Northside FC"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Team Name <span className="text-[rgba(0,0,0,0.25)]">*</span>
              </label>
              <input
                value={form.teamName}
                onChange={(e) => set('teamName', e.target.value)}
                placeholder="The Bears"
                className={`${inputCls} ${error ? 'border-red-400 focus:border-red-500' : ''}`}
              />
              {error && (
                <p className="text-xs text-red-500 mt-1.5">Enter a team name to continue.</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Age Group</label>
              <input
                value={form.ageGroup}
                onChange={(e) => set('ageGroup', e.target.value)}
                placeholder="Under 18s"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="w-full py-4 bg-[#0a0a0a] text-white font-display font-bold text-lg uppercase tracking-widest rounded-2xl hover:bg-[#1a1a1a] active:scale-[0.99] transition-all cursor-pointer shadow-lg"
        >
          Pick the Team →
        </button>

        <p className="text-center text-xs text-[rgba(0,0,0,0.3)] pb-2">
          Club colours, logo, and match details can be added from the lineup board.
        </p>

      </form>
    </div>
  )
}
