'use client'

import { useState, useEffect } from 'react'
import { Download, Share2, X, Loader2, LayoutGrid, List } from 'lucide-react'
import { Lineup, Player } from '@/lib/types'
import { generateShareImage } from '@/lib/exportCanvas'

type Format = 'field' | 'list'

interface Props {
  lineup: Lineup
  squad:  Player[]
  onClose: () => void
}

export default function ShareSheet({ lineup, squad, onClose }: Props) {
  const [format, setFormat]   = useState<Format>('field')
  const [genKey, setGenKey]   = useState(0)
  const [state, setState]     = useState<'loading' | 'done' | 'error'>('loading')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  // Re-generate whenever format or genKey changes
  useEffect(() => {
    let cancelled = false

    async function run() {
      setState('loading')
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      try {
        const blob = await generateShareImage(lineup, squad, format)
        if (cancelled) return
        if (!blob) throw new Error('no blob')
        setBlobUrl(URL.createObjectURL(blob))
        setState('done')
      } catch {
        if (!cancelled) setState('error')
      }
    }

    run()
    return () => { cancelled = true }
    // lineup and squad are stable refs — intentionally excluded to avoid looping
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, genKey])

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleShare() {
    if (state !== 'done' || !blobUrl) return
    try {
      const res  = await fetch(blobUrl)
      const blob = await res.blob()
      const file = new File([blob], `${lineup.teamName || 'lineup'}-runon.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: lineup.teamName || 'Run-On Lineup' })
      } else {
        triggerDownload(blobUrl, file.name)
      }
    } catch {
      // User cancelled — ignore
    }
  }

  function handleDownload() {
    if (!blobUrl) return
    triggerDownload(blobUrl, `${lineup.teamName || 'lineup'}-runon.png`)
  }

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const formatOpts: { value: Format; label: string; icon: React.ReactNode }[] = [
    { value: 'field', label: 'Field View',  icon: <LayoutGrid size={13} /> },
    { value: 'list',  label: 'Team List',   icon: <List size={13} /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.12)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <h2 className="font-display font-bold text-base uppercase tracking-wide text-[#0a0a0a]">
            Share Lineup
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[rgba(0,0,0,0.4)] hover:text-[#0a0a0a] hover:bg-[rgba(0,0,0,0.05)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Format toggle */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.35)] mb-2">
              Graphic Style
            </p>
            <div className="flex gap-2">
              {formatOpts.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer"
                  style={{
                    background:  format === opt.value ? '#0a0a0a' : 'transparent',
                    color:       format === opt.value ? '#ffffff' : 'rgba(0,0,0,0.45)',
                    borderColor: format === opt.value ? '#0a0a0a' : 'rgba(0,0,0,0.12)',
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="w-full rounded-xl overflow-hidden bg-[#0a0a0a] flex items-center justify-center border border-[rgba(0,0,0,0.1)]"
            style={{ aspectRatio: '4/5' }}
          >
            {state === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-[rgba(255,255,255,0.3)]" />
                <p className="text-sm text-[rgba(255,255,255,0.4)] font-medium">Generating…</p>
              </div>
            )}
            {state === 'done' && blobUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blobUrl}
                alt="Lineup graphic"
                className="w-full h-full object-contain"
              />
            )}
            {state === 'error' && (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <p className="text-sm text-[rgba(255,255,255,0.5)]">
                  Could not generate image. Try again.
                </p>
                <button
                  onClick={() => setGenKey((k) => k + 1)}
                  className="text-sm font-bold text-white underline underline-offset-2 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={state !== 'done'}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#0a0a0a] text-white font-display font-bold text-sm uppercase tracking-widest hover:bg-[#1a1a1a] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Share2 size={16} />
              Share
            </button>
            <button
              onClick={handleDownload}
              disabled={state !== 'done'}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[rgba(0,0,0,0.12)] text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.04)] font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
            </button>
          </div>

          <p className="text-xs text-center text-[rgba(0,0,0,0.3)]">
            1080 × 1350px · saves to camera roll or shares to chat
          </p>
        </div>
      </div>
    </div>
  )
}
