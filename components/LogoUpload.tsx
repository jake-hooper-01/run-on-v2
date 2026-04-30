'use client'

import { useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface Props {
  value: string   // base64 data URL
  onChange: (dataUrl: string) => void
}

export default function LogoUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result !== 'string') return
      // Resize to max 400×400 before storing to keep localStorage lean
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        onChange(canvas.toDataURL('image/png'))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-uploaded
    e.target.value = ''
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(10,10,10,0.4)] mb-2">
        Club Logo
      </label>

      {value ? (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-[#F7F8FA] border border-[rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-semibold text-[#0a0a0a] underline underline-offset-2 cursor-pointer hover:opacity-60 transition-opacity text-left"
            >
              Change logo
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1 text-xs text-[rgba(10,10,10,0.4)] hover:text-[#c8102e] transition-colors cursor-pointer"
            >
              <X size={12} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-[rgba(0,0,0,0.15)] bg-[#F7F8FA] hover:bg-[#EEEEF0] hover:border-[rgba(0,0,0,0.25)] transition-all cursor-pointer"
        >
          <Upload size={22} className="text-[rgba(0,0,0,0.3)]" />
          <span className="text-sm font-semibold text-[rgba(0,0,0,0.45)]">
            Upload from device
          </span>
          <span className="text-xs text-[rgba(0,0,0,0.28)]">PNG or JPG</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
