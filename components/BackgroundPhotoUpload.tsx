'use client'

import { useRef } from 'react'
import { ImagePlus, X, Camera } from 'lucide-react'

interface Props {
  value: string          // base64 data URL
  primaryColour?: string // for live preview overlay tint
  onChange: (dataUrl: string) => void
}

export default function BackgroundPhotoUpload({ value, primaryColour, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result !== 'string') return
      const img = new Image()
      img.onload = () => {
        // Resize to max 1080px on longest side, store as JPEG 0.75 for storage efficiency
        // Background photos are heavily darkened — JPEG 0.75 is more than sufficient
        const MAX = 1080
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        onChange(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Hex → rgba helper for preview overlay
  function hexToRgba(hex: string, alpha: number): string {
    const h = (hex || '#000000').replace('#', '')
    const r = parseInt(h.slice(0, 2), 16) || 0
    const g = parseInt(h.slice(2, 4), 16) || 0
    const b = parseInt(h.slice(4, 6), 16) || 0
    return `rgba(${r},${g},${b},${alpha})`
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-1.5">
        Background Photo
      </label>
      <p className="text-xs text-[rgba(0,0,0,0.35)] mb-3">
        Team huddle, training ground, match action — shown behind the share graphic, darkened automatically.
      </p>

      {value ? (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/5' }}>
          {/* Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark overlay — matches what the graphic will apply */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.68)' }}
          />

          {/* Club colour gradient — matches canvas drawBackground */}
          {primaryColour && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${hexToRgba(primaryColour, 0.60)} 0%, transparent 55%)`,
              }}
            />
          )}

          {/* Preview label */}
          <div className="absolute top-3 left-3">
            <span
              className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
            >
              Preview
            </span>
          </div>

          {/* Actions */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
            >
              <ImagePlus size={13} />
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition-colors"
              style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.65)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2.5 py-8 rounded-2xl border-2 border-dashed border-[rgba(0,0,0,0.15)] bg-[#F7F8FA] hover:bg-[#EEEEF0] hover:border-[rgba(0,0,0,0.25)] transition-all cursor-pointer"
        >
          <Camera size={26} className="text-[rgba(0,0,0,0.3)]" />
          <div className="text-center">
            <span className="block text-sm font-semibold text-[rgba(0,0,0,0.5)]">
              Upload from device
            </span>
            <span className="block text-xs text-[rgba(0,0,0,0.3)] mt-0.5">
              Photo or camera · JPG, PNG, WebP
            </span>
          </div>
        </button>
      )}

      {/* Hidden file input — no capture attribute so iOS shows both camera + photo library */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
