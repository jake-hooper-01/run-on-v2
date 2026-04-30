'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Player } from '@/lib/types'
import PlayerModal from '@/components/PlayerModal'

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  available:  { label: 'Available',  bg: '#dcfce7', text: '#16a34a' },
  injured:    { label: 'Injured',    bg: '#fee2e2', text: '#dc2626' },
  suspended:  { label: 'Suspended',  bg: '#fef3c7', text: '#d97706' },
}

export default function SquadPage() {
  const { squad, addPlayer, updatePlayer, deletePlayer } = useStore()
  const [modal, setModal] = useState<'add' | Player | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const sorted = [...squad].sort((a, b) => a.number - b.number)
  const existingGroups = [...new Set(squad.map((p) => p.group).filter(Boolean))]

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg text-[rgba(0,0,0,0.4)] hover:text-[#0a0a0a] transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </Link>
            <h1 className="font-display font-bold text-lg uppercase tracking-widest text-[#0a0a0a]">
              Squad
            </h1>
            {squad.length > 0 && (
              <span className="ml-1 text-xs text-[rgba(0,0,0,0.35)] font-semibold">
                {squad.length} player{squad.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a0a0a] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer hover:bg-[#1a1a1a]"
          >
            <Plus size={13} />
            Add Player
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16 gap-5">
            <p className="text-[rgba(0,0,0,0.38)] text-sm">
              Your squad is empty. Add players to start building lineups.
            </p>
            <button
              onClick={() => setModal('add')}
              className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] text-white font-display font-bold text-sm uppercase tracking-widest rounded-xl cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            >
              <Plus size={16} />
              Add First Player
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.05)] divide-y divide-[rgba(0,0,0,0.06)]">
            {sorted.map((player) => {
              const badge = STATUS_BADGE[player.status]
              const isConfirming = deleteConfirm === player.id

              return (
                <div key={player.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                  {/* Number */}
                  <div className="w-9 h-9 rounded-lg bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)] flex items-center justify-center font-display font-bold text-base text-[#0a0a0a] shrink-0">
                    {player.number}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm uppercase tracking-wide text-[#0a0a0a]">
                        {player.lastName}
                        {player.firstName && (
                          <span className="font-normal normal-case tracking-normal text-[rgba(0,0,0,0.45)]">
                            {' '}{player.firstName}
                          </span>
                        )}
                      </span>
                      {player.nickname && (
                        <span className="text-xs text-[rgba(0,0,0,0.38)] italic">
                          &ldquo;{player.nickname}&rdquo;
                        </span>
                      )}
                    </div>
                    <span
                      className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isConfirming ? (
                      <>
                        <button
                          onClick={() => { deletePlayer(player.id); setDeleteConfirm(null) }}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold cursor-pointer border border-red-200 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs text-[rgba(0,0,0,0.4)] font-semibold cursor-pointer px-2"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setModal(player)}
                          className="p-1.5 rounded-lg text-[rgba(0,0,0,0.3)] hover:text-[#0a0a0a] hover:bg-[rgba(0,0,0,0.05)] transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(player.id)}
                          className="p-1.5 rounded-lg text-[rgba(0,0,0,0.3)] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal === 'add' && (
        <PlayerModal
          existingGroups={existingGroups}
          existingNumbers={squad.map((p) => p.number)}
          onSave={(data) => addPlayer(data)}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== 'add' && (
        <PlayerModal
          player={modal as Player}
          existingGroups={existingGroups}
          existingNumbers={squad.filter((p) => p.id !== (modal as Player).id).map((p) => p.number)}
          onSave={(data) => updatePlayer((modal as Player).id, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
