'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Lineup } from '@/lib/types'
import ColourPicker from '@/components/ColourPicker'
import LogoUpload from '@/components/LogoUpload'
import BackgroundPhotoUpload from '@/components/BackgroundPhotoUpload'

type FormData = Omit<Lineup, 'id' | 'createdAt' | 'positions'>

const EMPTY: FormData = {
  clubName:                '',
  teamName:                '',
  ageGroup:                '',
  logoDataUrl:             '',
  primaryColour:           '#003087',
  backgroundPhotoDataUrl:  '',
  opponent:                '',
  venue:                   '',
  date:                    '',
  time:                    '',
  displayMode:             'surname',
}

export default function NewLineupPage() {
  const router = useRouter()
  const createLineup = useStore((s) => s.createLineup)
  const [form, setForm] = useState<FormData>(EMPTY)

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.teamName.trim() && !form.clubName.trim()) return
    const id = createLineup(form)
    router.push(`/lineup/${id}`)
  }

  const inputCls =
    'w-full bg-[#F7F8FA] border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[#0a0a0a] placeholder-[rgba(0,0,0,0.25)] focus:outline-none focus:border-[#0a0a0a] transition-colors text-sm'

  const labelCls =
    'block text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-1.5'

  const sectionCls =
    'bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]'

  const sectionTitle =
    'font-display font-bold text-xs uppercase tracking-widest text-[rgba(0,0,0,0.35)] mb-4'

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-10">

      {/* Sticky header */}
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

        {/* ── Team details ── */}
        <section className={sectionCls}>
          <h2 className={sectionTitle}>Team</h2>
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
              <label className={labelCls}>Team Name *</label>
              <input
                value={form.teamName}
                onChange={(e) => set('teamName', e.target.value)}
                placeholder="The Bears"
                required
                className={inputCls}
              />
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

        {/* ── Club branding ── */}
        <section className={sectionCls}>
          <h2 className={sectionTitle}>Club Branding</h2>
          <div className="space-y-5">
            <LogoUpload
              value={form.logoDataUrl}
              onChange={(v) => set('logoDataUrl', v)}
            />
            <ColourPicker
              label="Primary Colour"
              value={form.primaryColour}
              onChange={(v) => set('primaryColour', v)}
            />
            <BackgroundPhotoUpload
              value={form.backgroundPhotoDataUrl}
              onChange={(v) => set('backgroundPhotoDataUrl', v)}
              primaryColour={form.primaryColour}
            />
          </div>
        </section>

        {/* ── Match details ── */}
        <section className={sectionCls}>
          <h2 className={sectionTitle}>Match Details</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Opponent</label>
              <input
                value={form.opponent}
                onChange={(e) => set('opponent', e.target.value)}
                placeholder="Eastside FC"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Location / Ground</label>
              <input
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
                placeholder="Central Oval, Smith St"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={`${inputCls} [color-scheme:light]`}
                />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  className={`${inputCls} [color-scheme:light]`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Display ── */}
        <section className={sectionCls}>
          <h2 className={sectionTitle}>Player Display</h2>
          <p className="text-xs text-[rgba(0,0,0,0.38)] mb-3">
            How names appear on player cards. Can be changed at any time on the lineup board.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['surname', 'nickname'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => set('displayMode', mode)}
                className="py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all cursor-pointer border"
                style={{
                  background: form.displayMode === mode ? '#0a0a0a' : 'transparent',
                  color:      form.displayMode === mode ? '#ffffff' : 'rgba(0,0,0,0.45)',
                  borderColor: form.displayMode === mode ? '#0a0a0a' : 'rgba(0,0,0,0.1)',
                }}
              >
                {mode === 'surname' ? 'Surnames' : 'Nicknames'}
              </button>
            ))}
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 bg-[#0a0a0a] text-white font-display font-bold text-lg uppercase tracking-widest rounded-2xl hover:bg-[#1a1a1a] active:scale-[0.99] transition-all cursor-pointer shadow-lg"
        >
          Pick the Team →
        </button>
      </form>
    </div>
  )
}
