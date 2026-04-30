'use client'

import { Check } from 'lucide-react'

// 36 swatches — covers all AFL club primaries + generics
const SWATCHES = [
  // Blacks + greys
  '#0A0A0A', '#2C2C2C', '#4A4A4A', '#767676', '#B0B0B0', '#FFFFFF',
  // Blues (Carlton, North, West Coast, Adelaide, Brisbane, generic)
  '#003087', '#002B5C', '#003B79', '#014896', '#1565C0', '#42A5F5',
  // Reds + maroons (Essendon, Melbourne, Adelaide, Brisbane, SWFC, generic)
  '#7B0D22', '#B71C1C', '#C8102E', '#D32F2F', '#880E4F', '#E91E63',
  // Golds + oranges (Richmond, Eagles, Lions, Hawthorn, GWS, generic)
  '#4D2004', '#FED102', '#F2A900', '#F47920', '#E65100', '#FFAB40',
  // Greens + teals (Port Adelaide, Geelong accent, generic)
  '#006064', '#008AAB', '#00796B', '#2E7D32', '#388E3C', '#66BB6A',
  // Purples (Fremantle, generic)
  '#2C1654', '#4A148C', '#6A1B9A', '#AB47BC', '#CE93D8', '#F3E5F5',
]

interface Props {
  label: string
  value: string
  onChange: (hex: string) => void
}

export default function ColourPicker({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-2">
        {label}
      </label>

      {/* Swatch grid */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {SWATCHES.map((swatch) => {
          const active = value.toLowerCase() === swatch.toLowerCase()
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => onChange(swatch)}
              className="relative w-full aspect-square rounded-lg cursor-pointer transition-transform active:scale-90"
              style={{
                background: swatch,
                border: active ? '3px solid #0A0A0A' : '1.5px solid rgba(0,0,0,0.12)',
                boxShadow: swatch === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined,
              }}
              aria-label={swatch}
            >
              {active && (
                <Check
                  size={12}
                  strokeWidth={3}
                  className="absolute inset-0 m-auto"
                  style={{ color: swatch === '#FFFFFF' || swatch === '#FFFF00' ? '#000' : '#fff' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-lg shrink-0 border border-[rgba(0,0,0,0.12)]"
          style={{ background: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          placeholder="#000000"
          className="flex-1 bg-[#F7F8FA] border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 text-sm font-mono text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
        />
      </div>
    </div>
  )
}
