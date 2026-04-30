'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Player, PlayerStatus } from '@/lib/types'

interface Props {
  player?: Player
  existingGroups?: string[]
  existingNumbers?: number[]
  onSave: (data: Omit<Player, 'id'>) => void
  onClose: () => void
}

const STATUS_OPTS: { value: PlayerStatus; label: string; colour: string }[] = [
  { value: 'available',  label: 'Available',  colour: '#16a34a' },
  { value: 'injured',    label: 'Injured',    colour: '#dc2626' },
  { value: 'suspended',  label: 'Suspended',  colour: '#d97706' },
]

export default function PlayerModal({ player, existingGroups = [], existingNumbers = [], onSave, onClose }: Props) {
  const [form, setForm] = useState({
    firstName: player?.firstName ?? '',
    lastName:  player?.lastName  ?? '',
    nickname:  player?.nickname  ?? '',
    number:    player?.number    ?? ('' as number | ''),
    status:    player?.status    ?? ('available' as PlayerStatus),
    group:     player?.group     ?? '',
  })
  const [numberError, setNumberError] = useState('')

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.lastName.trim() && !form.firstName.trim()) return
    if (form.number === '' || Number(form.number) < 1) return
    if (existingNumbers.includes(Number(form.number))) {
      setNumberError(`#${form.number} is already taken`)
      return
    }
    onSave({
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      nickname:  form.nickname.trim(),
      number:    Number(form.number),
      status:    form.status,
      group:     form.group.trim(),
    })
    onClose()
  }

  const inputCls =
    'w-full bg-[#F7F8FA] border border-[rgba(0,0,0,0.12)] rounded-xl px-4 py-3 text-[#0a0a0a] placeholder-[rgba(0,0,0,0.25)] focus:outline-none focus:border-[#0a0a0a] transition-colors text-sm'

  const labelCls =
    'block text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.12)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <h2 className="font-display font-bold text-base uppercase tracking-wide text-[#0a0a0a]">
            {player ? 'Edit Player' : 'Add Player'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[rgba(0,0,0,0.4)] hover:text-[#0a0a0a] hover:bg-[rgba(0,0,0,0.05)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Number + Last name */}
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label className={labelCls}>#</label>
              <input
                type="number"
                value={form.number}
                onChange={(e) => {
                  setNumberError('')
                  setForm((f) => ({ ...f, number: e.target.value === '' ? '' : Number(e.target.value) }))
                }}
                placeholder="7"
                min={1}
                max={99}
                required
                className={`${inputCls}${numberError ? ' border-red-400 focus:border-red-500' : ''}`}
              />
              {numberError && <p className="mt-1 text-xs text-red-500 font-semibold">{numberError}</p>}
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Smith"
                required
                className={inputCls}
              />
            </div>
          </div>

          {/* First name */}
          <div>
            <label className={labelCls}>First Name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="Jake"
              className={inputCls}
            />
          </div>

          {/* Nickname */}
          <div>
            <label className={labelCls}>Nickname <span className="normal-case font-normal">(shows on card when nickname mode is on)</span></label>
            <input
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              placeholder="Boof"
              className={inputCls}
            />
          </div>

          {/* Group */}
          <div>
            <label className={labelCls}>Team / Group <span className="normal-case font-normal">(optional — used to filter squad)</span></label>
            <input
              value={form.group}
              onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              placeholder="e.g. U14s, Seniors"
              list="group-suggestions"
              className={inputCls}
            />
            {existingGroups.length > 0 && (
              <datalist id="group-suggestions">
                {existingGroups.map((g) => <option key={g} value={g} />)}
              </datalist>
            )}
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {STATUS_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  style={{
                    background: form.status === opt.value ? opt.colour : 'transparent',
                    color: form.status === opt.value ? '#ffffff' : 'rgba(0,0,0,0.4)',
                    border: `1.5px solid ${form.status === opt.value ? opt.colour : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#0a0a0a] text-white font-display font-bold text-sm uppercase tracking-widest hover:bg-[#1a1a1a] active:scale-[0.99] transition-all cursor-pointer"
          >
            {player ? 'Save Changes' : 'Add Player'}
          </button>
        </form>
      </div>
    </div>
  )
}
