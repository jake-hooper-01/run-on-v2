export type PlayerStatus = 'available' | 'injured' | 'suspended'

export interface Player {
  id: string
  firstName: string
  lastName: string
  nickname: string
  number: number
  status: PlayerStatus
  group: string   // optional team/group tag e.g. "U14s", "Seniors" — empty = ungrouped
}

export interface Lineup {
  id: string
  createdAt: number
  // Club
  clubName: string
  teamName: string
  ageGroup: string
  logoDataUrl: string      // base64 from device file upload
  primaryColour: string
  backgroundPhotoDataUrl: string  // base64 background photo for share graphic
  // Match
  opponent: string
  venue: string
  date: string
  time: string
  // Display
  displayMode: 'surname' | 'nickname'
  fieldFlipped?: boolean
  // Positions: positionKey -> playerId
  positions: Record<string, string>
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatMatchDate(date: string): string {
  if (!date) return ''
  try {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
  } catch { return '' }
}

export function getDisplayName(player: Player, mode: 'surname' | 'nickname'): string {
  if (mode === 'nickname' && player.nickname) return player.nickname
  return player.lastName || player.firstName
}

export function isLightColour(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  if (isNaN(r)) return false
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}
