'use client'

import { useState } from 'react'
import { Plus, Search, Pencil } from 'lucide-react'
import { Player, getDisplayName } from '@/lib/types'

const STATUS_DOT: Record<string, string> = {
  available:  '#16a34a',
  injured:    '#dc2626',
  suspended:  '#d97706',
}

interface Props {
  squad:            Player[]
  assignedIds:      Set<string>
  selectedId:       string | null
  displayMode:      'surname' | 'nickname'
  onSelect:         (id: string | null) => void
  onAdd:            () => void
  onEdit:           (p: Player) => void
}

export default function SquadDrawer({
  squad, assignedIds, selectedId, displayMode, onSelect, onAdd, onEdit,
}: Props) {
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('')

  const groups = [...new Set(squad.map((p) => p.group).filter(Boolean))]

  const filtered = squad
    .filter((p) => {
      if (groupFilter && p.group !== groupFilter) return false
      const q = query.toLowerCase()
      return (
        p.lastName.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        (p.nickname && p.nickname.toLowerCase().includes(q)) ||
        String(p.number).includes(q)
      )
    })
    .sort((a, b) => a.number - b.number)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.08)]">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#0a0a0a]">
          Squad
          {squad.length > 0 && (
            <span className="ml-2 text-xs font-normal text-[rgba(0,0,0,0.35)] normal-case tracking-normal">
              {assignedIds.size}/{squad.length}
            </span>
          )}
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer hover:bg-[#1a1a1a]"
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {/* Group filter pills */}
      {groups.length > 0 && (
        <div className="px-4 py-2 border-b border-[rgba(0,0,0,0.06)] flex gap-1.5 flex-wrap">
          <button
            onClick={() => setGroupFilter('')}
            className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
            style={{
              background: groupFilter === '' ? '#0a0a0a' : 'rgba(0,0,0,0.06)',
              color: groupFilter === '' ? '#fff' : 'rgba(0,0,0,0.55)',
            }}
          >
            All
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(groupFilter === g ? '' : g)}
              className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
              style={{
                background: groupFilter === g ? '#0a0a0a' : 'rgba(0,0,0,0.06)',
                color: groupFilter === g ? '#fff' : 'rgba(0,0,0,0.55)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {squad.length > 5 && (
        <div className="px-4 py-2 border-b border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 bg-[#F7F8FA] rounded-xl px-3 py-2">
            <Search size={13} className="text-[rgba(0,0,0,0.3)] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players…"
              className="flex-1 bg-transparent text-sm text-[#0a0a0a] placeholder-[rgba(0,0,0,0.3)] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Player list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 px-6 text-center">
            <p className="text-sm text-[rgba(0,0,0,0.35)]">
              {squad.length === 0
                ? 'No players in the squad yet.'
                : 'No players match your search.'}
            </p>
            {squad.length === 0 && (
              <button
                onClick={onAdd}
                className="text-sm font-bold text-[#0a0a0a] underline underline-offset-2 cursor-pointer"
              >
                Add your first player
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(0,0,0,0.06)]">
            {filtered.map((player) => {
              const isAssigned = assignedIds.has(player.id)
              const isSelected = selectedId === player.id
              const isUnavailable = player.status !== 'available'

              return (
                <li
                  key={player.id}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{
                    background: isSelected ? 'rgba(0,0,0,0.05)' : 'transparent',
                    opacity: isUnavailable ? 0.45 : 1,
                  }}
                >
                  {/* Number badge */}
                  <button
                    onClick={() =>
                      isUnavailable
                        ? undefined
                        : onSelect(isSelected ? null : player.id)
                    }
                    disabled={isUnavailable}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm transition-all cursor-pointer disabled:cursor-default"
                    style={{
                      background: isSelected
                        ? '#0a0a0a'
                        : isAssigned
                          ? 'rgba(0,0,0,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      color: isSelected ? '#ffffff' : '#0a0a0a',
                      textDecoration: isAssigned && !isSelected ? 'line-through' : 'none',
                    }}
                  >
                    {player.number}
                  </button>

                  {/* Name */}
                  <button
                    onClick={() =>
                      isUnavailable ? undefined : onSelect(isSelected ? null : player.id)
                    }
                    disabled={isUnavailable}
                    className="flex-1 text-left cursor-pointer disabled:cursor-default"
                  >
                    <span
                      className="font-display font-bold text-sm uppercase tracking-wide"
                      style={{
                        color: isSelected ? '#0a0a0a' : isAssigned ? 'rgba(0,0,0,0.45)' : '#0a0a0a',
                        textDecoration: isAssigned && !isSelected ? 'line-through' : 'none',
                      }}
                    >
                      {getDisplayName(player, displayMode)}
                    </span>
                    {player.nickname && displayMode === 'surname' && (
                      <span className="ml-2 text-xs text-[rgba(0,0,0,0.3)]">
                        {player.nickname}
                      </span>
                    )}
                  </button>

                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: STATUS_DOT[player.status] }}
                  />

                  {/* Edit button — always visible */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(player) }}
                    className="p-1.5 rounded-lg text-[rgba(0,0,0,0.25)] hover:text-[#0a0a0a] hover:bg-[rgba(0,0,0,0.05)] transition-all cursor-pointer shrink-0"
                  >
                    <Pencil size={12} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
