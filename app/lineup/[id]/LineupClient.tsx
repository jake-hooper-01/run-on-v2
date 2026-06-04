'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, RotateCcw, Users, Share2, Settings, Undo2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Player, Lineup, isLightColour, formatTime, formatMatchDate } from '@/lib/types'
import AflField from '@/components/AflField'
import { FIELD_POSITIONS } from '@/lib/positions'
import SquadDrawer from '@/components/SquadDrawer'
import PlayerModal from '@/components/PlayerModal'
import ShareSheet from '@/components/ShareSheet'
import LineupSettings from '@/components/LineupSettings'

// ── Match header ──────────────────────────────────────────────────────────────
function MatchBanner({ lineup }: { lineup: Lineup }) {
  const primary = lineup.primaryColour || '#003087'
  const onPrimary = isLightColour(primary) ? '#000000' : '#ffffff'

  return (
    <div
      className="w-full px-4 py-3"
      style={{ background: primary }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {/* Logo */}
        {lineup.logoDataUrl && (
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1"
            style={{ background: `${onPrimary === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lineup.logoDataUrl} alt="" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="font-display font-bold text-base uppercase tracking-wide leading-tight"
              style={{ color: onPrimary }}
            >
              {lineup.teamName || lineup.clubName}
            </span>
            {lineup.ageGroup && (
              <span
                className="text-xs font-semibold shrink-0"
                style={{ color: `${onPrimary}99` }}
              >
                {lineup.ageGroup}
              </span>
            )}
          </div>
          <div
            className="text-xs mt-0.5 truncate"
            style={{ color: `${onPrimary}88` }}
          >
            {[
              lineup.opponent ? `vs ${lineup.opponent}` : '',
              lineup.time || '',
              lineup.venue || '',
            ].filter(Boolean).join('  ·  ')}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LineupPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { squad, lineups, addPlayer, updatePlayer, updateLineup, clearAllPositions, assignPosition, clearPosition } =
    useStore()
  const lineup = lineups.find((l) => l.id === id)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingPosition, setPendingPosition] = useState<string | null>(null)
  const [positionHistory, setPositionHistory] = useState<Record<string, string>[]>([])
  const [playerModal, setPlayerModal] = useState<'add' | Player | null>(null)
  const [squadOpen, setSquadOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (lineups.length > 0 && !lineup) router.replace('/')
  }, [lineup, lineups.length, router])

  // Flash "Saved" briefly after every position change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSavedFlash(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSavedFlash(false), 2000)
  }, [lineup?.positions]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!lineup) return null

  const assignedIds = new Set(Object.values(lineup.positions))
  const primary = lineup.primaryColour || '#003087'
  const onPrimary = isLightColour(primary) ? '#000000' : '#ffffff'
  const existingGroups = [...new Set(squad.map((p) => p.group).filter(Boolean))]

  function pushHistory() {
    setPositionHistory((h) => [...h.slice(-20), { ...lineup!.positions }])
  }

  function handlePositionClick(posKey: string) {
    const occupiedId = lineup!.positions[posKey]
    if (selectedId) {
      if (occupiedId === selectedId) { setSelectedId(null); return }
      pushHistory()
      assignPosition(id, posKey, selectedId)
      setSelectedId(null)
    } else if (occupiedId) {
      // Tap occupied card → select that player
      setSelectedId(occupiedId)
    } else {
      // Tap empty position with no selection → open squad targeting this position
      setPendingPosition(posKey)
      setSquadOpen(true)
    }
  }

  function handleUndo() {
    const prev = positionHistory[positionHistory.length - 1]
    if (!prev) return
    setPositionHistory((h) => h.slice(0, -1))
    updateLineup(id, { positions: prev })
  }

  function toggleDisplayMode() {
    updateLineup(id, {
      displayMode: lineup!.displayMode === 'surname' ? 'nickname' : 'surname',
    })
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: '#1B5E20' }}>

      {/* ── Top bar ── */}
      <div
        className="shrink-0 flex items-center justify-between gap-2 px-2 py-2 z-20"
        style={{ background: primary }}
      >
        {/* Back */}
        <Link
          href="/"
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: `${onPrimary}70` }}
        >
          <ChevronLeft size={20} />
        </Link>

        {/* Centre — team name */}
        <div className="flex-1 min-w-0 text-center">
          <p
            className="font-display font-bold text-sm uppercase tracking-widest truncate"
            style={{ color: onPrimary }}
          >
            {lineup.teamName || lineup.clubName}
          </p>
          {(lineup.opponent || lineup.date || lineup.time) && (
            <p className="text-xs truncate" style={{ color: `${onPrimary}70` }}>
              {[
                lineup.opponent ? `vs ${lineup.opponent}` : '',
                formatMatchDate(lineup.date),
                formatTime(lineup.time),
              ].filter(Boolean).join('  ·  ')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Display mode segmented control */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: `${onPrimary}35` }}>
            {(['surname', 'nickname'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { if (lineup.displayMode !== mode) toggleDisplayMode() }}
                className="px-2.5 py-1 font-display font-bold text-xs tracking-widest transition-colors cursor-pointer"
                style={{
                  background: lineup.displayMode === mode
                    ? onPrimary === '#ffffff' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)'
                    : 'transparent',
                  color: lineup.displayMode === mode ? onPrimary : `${onPrimary}45`,
                }}
              >
                {mode === 'surname' ? 'SUR' : 'NICK'}
              </button>
            ))}
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg cursor-pointer transition-colors"
            style={{ color: `${onPrimary}70` }}
          >
            <Settings size={16} />
          </button>

          {/* Share */}
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            style={{
              background: `${onPrimary === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
              color: onPrimary,
            }}
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>

      {/* ── Field ── */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-auto px-1.5 pt-2 pb-1">
        <div className="w-full max-w-sm">
          <AflField
            lineup={lineup}
            squad={squad}
            selectedPlayerId={selectedId}
            onPositionClick={handlePositionClick}
          />
        </div>
      </div>

      {/* ── Bottom toolbar ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-t border-[rgba(0,0,0,0.08)] gap-2">

        {/* Left: hints / undo / reset */}
        {selectedId ? (
          <p className="text-xs font-bold text-[rgba(0,0,0,0.55)] animate-pulse">
            Tap a position to place
          </p>
        ) : savedFlash ? (
          <p className="text-xs text-[rgba(0,0,0,0.35)] font-medium transition-opacity">
            Saved
          </p>
        ) : clearConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[rgba(0,0,0,0.4)]">Clear all?</span>
            <button
              onClick={() => { pushHistory(); clearAllPositions(id); setClearConfirm(false) }}
              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold cursor-pointer border border-red-200"
            >
              Yes
            </button>
            <button
              onClick={() => setClearConfirm(false)}
              className="text-xs text-[rgba(0,0,0,0.4)] font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {positionHistory.length > 0 && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.45)] hover:text-[rgba(0,0,0,0.75)] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Undo2 size={13} />
                Undo{positionHistory.length > 1 ? ` (${positionHistory.length})` : ''}
              </button>
            )}
            {assignedIds.size > 0 && (
              <button
                onClick={() => setClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-[rgba(0,0,0,0.3)] hover:text-[rgba(0,0,0,0.65)] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        )}

        {/* Right: position count + squad button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[rgba(0,0,0,0.28)]">
            {assignedIds.size}/25
          </span>
          <button
            onClick={() => { setSquadOpen(true); setSelectedId(null) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a0a0a] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer hover:bg-[#1a1a1a]"
          >
            <Users size={13} />
            Squad
          </button>
        </div>
      </div>

      {/* ── Squad bottom sheet (mobile) ── */}
      {squadOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSquadOpen(false); setPendingPosition(null) }} />
          <div className="relative z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col" style={{ height: '65vh' }}>
            <div className="flex items-center justify-center pt-3 pb-0.5">
              <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.12)]" />
            </div>
            {pendingPosition && (
              <div className="px-4 py-2 border-b border-[rgba(0,0,0,0.07)] flex items-center gap-2">
                <span className="text-xs text-[rgba(0,0,0,0.4)]">Selecting for</span>
                <span className="font-display font-bold text-xs uppercase tracking-widest text-[#0a0a0a]">
                  {FIELD_POSITIONS.find(p => p.key === pendingPosition)?.label ?? pendingPosition}
                </span>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <SquadDrawer
                squad={squad}
                assignedIds={assignedIds}
                selectedId={selectedId}
                displayMode={lineup.displayMode}
                onSelect={(pid) => {
                  if (pid && pendingPosition) {
                    pushHistory()
                    assignPosition(id, pendingPosition, pid)
                    setPendingPosition(null)
                    setSquadOpen(false)
                  } else {
                    setSelectedId(pid)
                    if (pid) setSquadOpen(false)
                  }
                }}
                onAdd={() => setPlayerModal('add')}
                onEdit={(p) => setPlayerModal(p)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Player modal ── */}
      {playerModal === 'add' && (
        <PlayerModal
          existingGroups={existingGroups}
          existingNumbers={squad.map((p) => p.number)}
          onSave={(data) => addPlayer(data)}
          onClose={() => setPlayerModal(null)}
        />
      )}
      {playerModal && playerModal !== 'add' && (
        <PlayerModal
          player={playerModal as Player}
          existingGroups={existingGroups}
          existingNumbers={squad.filter((p) => p.id !== (playerModal as Player).id).map((p) => p.number)}
          onSave={(data) => updatePlayer((playerModal as Player).id, data)}
          onClose={() => setPlayerModal(null)}
        />
      )}

      {/* ── Share sheet ── */}
      {shareOpen && (
        <ShareSheet
          lineup={lineup}
          squad={squad}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* ── Lineup settings ── */}
      {settingsOpen && (
        <LineupSettings
          lineup={lineup}
          onSave={(updates) => updateLineup(id, updates)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
