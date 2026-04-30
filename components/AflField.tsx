'use client'

import { Player, Lineup, getDisplayName, isLightColour } from '@/lib/types'
import { FIELD_POSITIONS, INTERCHANGE_KEYS, EMERGENCY_KEYS } from '@/lib/positions'

// ── Player card ───────────────────────────────────────────────────────────────

function PlayerCard({
  player,
  posLabel,
  primary,
  displayMode,
  isSelected,
  isPickTarget,
  onClick,
  small = false,
}: {
  player: Player | null
  posLabel: string
  primary: string
  displayMode: 'surname' | 'nickname'
  isSelected: boolean
  isPickTarget: boolean
  onClick: () => void
  small?: boolean
}) {
  const W = small ? 58 : 62
  const H = small ? 48 : 54
  const headerH = small ? 18 : 21
  const numSz = small ? 13 : 15
  const nameSz = small ? 7 : 8
  const pillH = 16
  const pillPadX = 5

  const onPrimary = isLightColour(primary) ? '#000000' : '#ffffff'

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer"
      style={{ background: 'none', border: 'none', padding: 0, gap: 2 }}
      aria-label={`${posLabel}${player ? `: #${player.number} ${getDisplayName(player, displayMode)}` : ': empty'}`}
    >
      {/* Position label pill */}
      <span
        style={{
          fontSize: 7,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: `1px ${pillPadX}px`,
          lineHeight: pillH - 2 + 'px',
          height: pillH,
          borderRadius: 4,
          fontFamily: "'Oswald', 'Arial Narrow', Arial, sans-serif",
          background: isSelected
            ? primary
            : isPickTarget
              ? 'rgba(0,0,0,0.55)'
              : 'rgba(0,0,0,0.45)',
          color: isSelected ? onPrimary : '#ffffff',
          border: isPickTarget && !isSelected ? '1px solid rgba(255,255,255,0.5)' : 'none',
        }}
      >
        {posLabel}
      </span>

      {/* Card body */}
      {player ? (
        <div
          style={{
            width: W,
            height: H,
            borderRadius: 7,
            overflow: 'hidden',
            boxShadow: isSelected
              ? `0 0 0 2.5px ${primary}, 0 4px 14px rgba(0,0,0,0.28)`
              : '0 2px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)',
            transition: 'box-shadow 150ms',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Coloured header */}
          <div
            style={{
              height: headerH,
              background: primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: numSz,
                fontWeight: 700,
                lineHeight: 1,
                fontFamily: "'Oswald', 'Arial Narrow', Arial, sans-serif",
                color: onPrimary,
              }}
            >
              {player.number}
            </span>
          </div>
          {/* White name section */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            <span
              style={{
                fontSize: nameSz,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1,
                color: '#111111',
                maxWidth: W - 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: "'Oswald', 'Arial Narrow', Arial, sans-serif",
              }}
            >
              {getDisplayName(player, displayMode)}
            </span>
          </div>
        </div>
      ) : (
        /* Empty slot */
        <div
          className={isPickTarget ? 'animate-pulse-target' : ''}
          style={{
            width: W,
            height: H,
            borderRadius: 7,
            background: isPickTarget
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(255,255,255,0.1)',
            border: `1.5px dashed ${isPickTarget ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: isPickTarget ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
              lineHeight: 1,
            }}
          >
            +
          </span>
        </div>
      )}
    </button>
  )
}

// ── Field markings SVG ────────────────────────────────────────────────────────

function FieldMarkings() {
  return (
    <svg
      viewBox="0 0 560 780"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {/* Mowing stripes */}
      <defs>
        <clipPath id="ovalClip">
          <ellipse cx="280" cy="390" rx="250" ry="362" />
        </clipPath>
        <pattern id="stripes" x="0" y="0" width="560" height="43.3" patternUnits="userSpaceOnUse">
          <rect width="560" height="21.65" fill="#1B5E20" />
          <rect y="21.65" width="560" height="21.65" fill="#1E6B24" />
        </pattern>
      </defs>

      {/* Striped fill clipped to oval */}
      <ellipse cx="280" cy="390" rx="250" ry="362" fill="url(#stripes)" />

      {/* Outer boundary */}
      <ellipse cx="280" cy="390" rx="250" ry="362" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" />

      {/* 50m arcs — semicircles at each end, centred on goal line, r=200 */}
      <path
        d="M 80 30 A 200 200 0 0 1 480 30"
        stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none"
        clipPath="url(#ovalClip)"
      />
      <path
        d="M 80 750 A 200 200 0 0 0 480 750"
        stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none"
        clipPath="url(#ovalClip)"
      />

      {/* Centre circle */}
      <circle cx="280" cy="390" r="46" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

      {/* Centre square */}
      <rect x="228" y="358" width="104" height="64" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />

      {/* Centre dot */}
      <circle cx="280" cy="390" r="5" fill="rgba(255,255,255,0.75)" />

      {/* Goal squares */}
      <rect x="253" y="30" width="54" height="24" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="rgba(255,255,255,0.07)" />
      <rect x="253" y="726" width="54" height="24" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="rgba(255,255,255,0.07)" />

      {/* Goal posts top */}
      <line x1="266" y1="10" x2="266" y2="30" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="280" y1="4" x2="280" y2="30" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
      <line x1="294" y1="10" x2="294" y2="30" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Goal posts bottom */}
      <line x1="266" y1="770" x2="266" y2="750" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="280" y1="776" x2="280" y2="750" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
      <line x1="294" y1="770" x2="294" y2="750" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  lineup: Lineup
  squad: Player[]
  selectedPlayerId: string | null
  onPositionClick: (posKey: string) => void
}

export default function AflField({ lineup, squad, selectedPlayerId, onPositionClick }: Props) {
  const primary = lineup.primaryColour || '#003087'
  const displayMode = lineup.displayMode || 'surname'
  const playerById = Object.fromEntries(squad.map((p) => [p.id, p]))

  return (
    <div className="select-none w-full">

      {/* ── Oval ──────────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full mx-auto"
        style={{ aspectRatio: '560 / 780' }}
      >
        <FieldMarkings />

        {FIELD_POSITIONS.map((pos) => {
          const playerId = lineup.positions[pos.key]
          const player   = playerId ? (playerById[playerId] ?? null) : null
          const isSelected   = !!(selectedPlayerId && playerId === selectedPlayerId)
          const isPickTarget = !!(selectedPlayerId && !playerId)

          return (
            <div
              key={pos.key}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top:  `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <PlayerCard
                player={player}
                posLabel={pos.shortLabel}
                primary={primary}
                displayMode={displayMode}
                isSelected={isSelected}
                isPickTarget={isPickTarget}
                onClick={() => onPositionClick(pos.key)}
              />
            </div>
          )
        })}
      </div>

      {/* ── Interchange ────────────────────────────────────────────────────────── */}
      <div
        className="mt-2 mx-0 rounded-xl py-2.5 px-3"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <p
          className="text-center mb-2"
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Oswald', sans-serif",
          }}
        >
          Interchange
        </p>
        <div className="flex justify-center gap-3">
          {INTERCHANGE_KEYS.map((posKey) => {
            const playerId = lineup.positions[posKey]
            const player   = playerId ? (playerById[playerId] ?? null) : null
            const isSelected   = !!(selectedPlayerId && playerId === selectedPlayerId)
            const isPickTarget = !!(selectedPlayerId && !playerId)

            return (
              <PlayerCard
                key={posKey}
                player={player}
                posLabel="INT"
                primary={primary}
                displayMode={displayMode}
                isSelected={isSelected}
                isPickTarget={isPickTarget}
                onClick={() => onPositionClick(posKey)}
                small
              />
            )
          })}
        </div>
      </div>

      {/* ── Emergencies ──────────────────────────────────────────────────────────── */}
      <div
        className="mt-1.5 mx-0 rounded-xl py-2.5 px-3"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-center mb-2"
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Oswald', sans-serif",
          }}
        >
          Emergencies
        </p>
        <div className="flex justify-center gap-3">
          {EMERGENCY_KEYS.map((posKey) => {
            const playerId = lineup.positions[posKey]
            const player   = playerId ? (playerById[playerId] ?? null) : null
            const isSelected   = !!(selectedPlayerId && playerId === selectedPlayerId)
            const isPickTarget = !!(selectedPlayerId && !playerId)

            return (
              <PlayerCard
                key={posKey}
                player={player}
                posLabel="EMG"
                primary={primary}
                displayMode={displayMode}
                isSelected={isSelected}
                isPickTarget={isPickTarget}
                onClick={() => onPositionClick(posKey)}
                small
              />
            )
          })}
        </div>
      </div>

    </div>
  )
}
