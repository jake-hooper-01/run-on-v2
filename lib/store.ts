'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Player, Lineup } from './types'

interface AppStore {
  squad: Player[]
  lineups: Lineup[]
  addPlayer: (p: Omit<Player, 'id'>) => void
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void
  deletePlayer: (id: string) => void
  createLineup: (l: Omit<Lineup, 'id' | 'createdAt' | 'positions'>) => string
  duplicateLineup: (id: string) => string
  updateLineup: (id: string, updates: Partial<Lineup>) => void
  deleteLineup: (id: string) => void
  assignPosition: (lineupId: string, position: string, playerId: string) => void
  clearPosition: (lineupId: string, position: string) => void
  clearAllPositions: (lineupId: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      squad: [],
      lineups: [],

      addPlayer: (p) => {
        const id = crypto.randomUUID()
        set((s) => ({ squad: [...s.squad, { ...p, id }] }))
      },

      updatePlayer: (id, updates) => {
        set((s) => ({
          squad: s.squad.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },

      deletePlayer: (id) => {
        set((s) => ({
          squad: s.squad.filter((p) => p.id !== id),
          lineups: s.lineups.map((l) => {
            const positions = { ...l.positions }
            for (const key of Object.keys(positions)) {
              if (positions[key] === id) delete positions[key]
            }
            return { ...l, positions }
          }),
        }))
      },

      createLineup: (l) => {
        const id = crypto.randomUUID()
        const lineup: Lineup = { ...l, id, createdAt: Date.now(), positions: {} }
        set((s) => ({ lineups: [...s.lineups, lineup] }))
        return id
      },

      duplicateLineup: (sourceId) => {
        const id = crypto.randomUUID()
        set((s) => {
          const source = s.lineups.find((l) => l.id === sourceId)
          if (!source) return s
          const copy: Lineup = {
            ...source,
            id,
            createdAt: Date.now(),
            opponent: '',
            date: '',
            time: '',
          }
          return { lineups: [...s.lineups, copy] }
        })
        return id
      },

      updateLineup: (id, updates) => {
        set((s) => ({
          lineups: s.lineups.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }))
      },

      deleteLineup: (id) => {
        set((s) => ({ lineups: s.lineups.filter((l) => l.id !== id) }))
      },

      assignPosition: (lineupId, position, playerId) => {
        set((s) => ({
          lineups: s.lineups.map((l) => {
            if (l.id !== lineupId) return l
            const positions: Record<string, string> = {}
            for (const [k, v] of Object.entries(l.positions)) {
              if (v !== playerId) positions[k] = v
            }
            positions[position] = playerId
            return { ...l, positions }
          }),
        }))
      },

      clearPosition: (lineupId, position) => {
        set((s) => ({
          lineups: s.lineups.map((l) => {
            if (l.id !== lineupId) return l
            const positions = { ...l.positions }
            delete positions[position]
            return { ...l, positions }
          }),
        }))
      },

      clearAllPositions: (lineupId) => {
        set((s) => ({
          lineups: s.lineups.map((l) =>
            l.id === lineupId ? { ...l, positions: {} } : l,
          ),
        }))
      },
    }),
    {
      name: 'run-on-v2-data',
      skipHydration: true,
      storage: {
        getItem: (name) => {
          try { return JSON.parse(localStorage.getItem(name) ?? 'null') }
          catch { return null }
        },
        setItem: (name, value) => {
          try { localStorage.setItem(name, JSON.stringify(value)) }
          catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
              console.warn('[run-on] localStorage full — try removing old lineups or logos')
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
)
