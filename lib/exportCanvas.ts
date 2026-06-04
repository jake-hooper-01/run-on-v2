import { Lineup, Player, getDisplayName, isLightColour, formatTime, formatMatchDate } from './types'
import { FIELD_POSITIONS, INTERCHANGE_KEYS, EMERGENCY_KEYS } from './positions'

// ─── Canvas dimension ─────────────────────────────────────────────────────────
const W = 1080
const H = 1350

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null
  return new Promise((resolve) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${alpha})`
}

function darkenHex(hex: string, factor = 0.35): string {
  const h = (hex || '#000000').replace('#', '')
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor))
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor))
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Draw player name with auto-scaling, fallback to truncation
function drawAutoName(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baselineY: number,
  maxW: number,
  maxSize: number,
  minSize = 20,
  weight = '700',
) {
  let sz = maxSize
  ctx.font = `${weight} ${sz}px Oswald, Arial Narrow, Arial, sans-serif`
  while (ctx.measureText(text).width > maxW && sz > minSize) {
    sz -= 2
    ctx.font = `${weight} ${sz}px Oswald, Arial Narrow, Arial, sans-serif`
  }
  let name = text
  while (ctx.measureText(name).width > maxW && name.length > 3) {
    name = name.slice(0, -2) + '…'
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(name, cx, baselineY)
}

// ─── Shared: background layer ─────────────────────────────────────────────────

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  photoDataUrl: string,
  primary: string,
) {
  if (photoDataUrl) {
    const photo = await loadImage(photoDataUrl)
    if (photo) {
      // Cover-fill: scale so photo fills the entire canvas, crop if needed
      const scale = Math.max(W / photo.width, H / photo.height)
      const sw = photo.width * scale
      const sh = photo.height * scale
      const sx = (W - sw) / 2
      const sy = (H - sh) / 2
      ctx.drawImage(photo, sx, sy, sw, sh)
    } else {
      // Photo failed to load — fall back to gradient
      drawGradientBg(ctx, primary)
    }
  } else {
    drawGradientBg(ctx, primary)
  }

  // Dark overlay — applied regardless of whether a photo is present
  ctx.fillStyle = 'rgba(0,0,0,0.68)'
  ctx.fillRect(0, 0, W, H)

  // Club colour gradient bleeding from the top (gives the AFL club post look)
  const colourGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55)
  colourGrad.addColorStop(0, hexToRgba(primary, 0.62))
  colourGrad.addColorStop(1, hexToRgba(primary, 0))
  ctx.fillStyle = colourGrad
  ctx.fillRect(0, 0, W, H)

  // Subtle vignette around edges
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.75)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)
}

function drawGradientBg(ctx: CanvasRenderingContext2D, primary: string) {
  const dark = darkenHex(primary, 0.4)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, dark)
  grad.addColorStop(0.45, '#0d0d0d')
  grad.addColorStop(1, '#070707')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}

// ─── Shared: header (y 0–200) ─────────────────────────────────────────────────

const HDR = 200

async function drawHeader(
  ctx: CanvasRenderingContext2D,
  lineup: Lineup,
  primary: string,
) {
  // Extra darkening over photo for text legibility
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(0, 0, W, HDR)

  // Club logo
  const LOGO_SZ = 96
  const LOGO_X  = 32
  const LOGO_Y  = (HDR - LOGO_SZ) / 2   // = 52 — vertically centred in header
  let textX = 44

  if (lineup.logoDataUrl) {
    const logo = await loadImage(lineup.logoDataUrl)
    if (logo) {
      ctx.save()
      ctx.shadowColor    = 'rgba(0,0,0,0.55)'
      ctx.shadowBlur     = 22
      ctx.shadowOffsetY  = 4
      ctx.drawImage(logo, LOGO_X, LOGO_Y, LOGO_SZ, LOGO_SZ)
      ctx.restore()
      textX = LOGO_X + LOGO_SZ + 20
    }
  }

  // "TEAM NAMED" badge — top right
  ctx.save()
  ctx.font = '600 13px Inter, Arial, sans-serif'
  ctx.textBaseline = 'middle'
  const badgeLabel = 'TEAM NAMED'
  const badgeW = ctx.measureText(badgeLabel).width + 30
  const badgeH = 28
  const badgeX = W - badgeW - 28
  const badgeY = 26
  ctx.fillStyle = 'rgba(255,255,255,0.13)'
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14)
  ctx.fill()
  // Green status dot
  ctx.fillStyle = '#4ade80'
  ctx.beginPath()
  ctx.arc(badgeX + 14, badgeY + badgeH / 2, 3.5, 0, Math.PI * 2)
  ctx.fill()
  // Badge text
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.textAlign = 'left'
  ctx.fillText(badgeLabel, badgeX + 24, badgeY + badgeH / 2)
  ctx.restore()

  // Team name (large)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor  = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur   = 10
  const teamDisplay = (lineup.teamName || lineup.clubName || 'MY TEAM').toUpperCase()
  ctx.font = '700 56px Oswald, Arial Narrow, Arial, sans-serif'
  ctx.fillText(teamDisplay, textX, 95)
  ctx.shadowBlur = 0

  // Age group + opponent
  const sub = [lineup.ageGroup, lineup.opponent ? `vs ${lineup.opponent}` : '']
    .filter(Boolean).join('  ·  ')
  if (sub) {
    ctx.globalAlpha = 0.75
    ctx.font = '400 28px Oswald, Arial Narrow, Arial, sans-serif'
    ctx.fillText(sub, textX, 130)
  }

  // Date · time · venue
  const detail = [formatMatchDate(lineup.date), formatTime(lineup.time), lineup.venue || '']
    .filter(Boolean).join('  ·  ')
  if (detail) {
    ctx.globalAlpha = 0.5
    ctx.font = '400 18px Inter, Arial, sans-serif'
    ctx.fillText(detail, textX, 160)
  }

  ctx.globalAlpha = 1

  // Bottom separator: club-colour accent line
  ctx.strokeStyle = hexToRgba(primary, 0.6)
  ctx.lineWidth   = 3
  ctx.beginPath()
  ctx.moveTo(0, HDR - 1.5)
  ctx.lineTo(W, HDR - 1.5)
  ctx.stroke()
}

// ─── Shared: footer ───────────────────────────────────────────────────────────

function drawFooter(ctx: CanvasRenderingContext2D, ftrY: number, primary: string) {
  ctx.fillStyle = hexToRgba(primary, 0.06)
  ctx.fillRect(0, ftrY, W, H - ftrY)
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.font = '400 15px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('RUN-ON  ·  BY HOTBOX DESIGN', W / 2, ftrY + (H - ftrY) / 2)
}

// ─── Format A: Field View ─────────────────────────────────────────────────────
// Oval with player cards overlaid on the dark background

function drawOval(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
) {
  // Mowing stripes — clipped to oval
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.clip()
  const stripes = 20
  const sh = (ry * 2) / stripes
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1B5E20' : '#1E6B24'
    ctx.fillRect(cx - rx, cy - ry + i * sh, rx * 2, sh)
  }
  ctx.restore()

  // Oval glow effect (drawn before boundary for layering)
  ctx.save()
  ctx.shadowColor = 'rgba(0,160,0,0.25)'
  ctx.shadowBlur  = 32
  ctx.strokeStyle = 'transparent'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Outer boundary
  ctx.strokeStyle = 'rgba(255,255,255,0.72)'
  ctx.lineWidth   = 4
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur  = 0
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()

  // 50m arcs
  const arcR = rx * 0.80
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth   = 2.5
  ctx.beginPath(); ctx.arc(cx, cy - ry, arcR, 0, Math.PI); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + ry, arcR, Math.PI, 0); ctx.stroke()
  ctx.restore()

  // Centre circle
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth   = 2.5
  ctx.beginPath()
  ctx.arc(cx, cy, rx * 0.12, 0, Math.PI * 2)
  ctx.stroke()

  // Centre square
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth   = 2
  ctx.strokeRect(cx - rx * 0.135, cy - ry * 0.045, rx * 0.27, ry * 0.09)

  // Centre dot
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fill()

  // Goal squares — span between the two inner goal posts
  const gp_i    = rx * 0.048   // inner goal post half-span
  const gp_o    = rx * 0.112   // behind post half-span
  const p_tall  = ry * 0.069   // inner post protrusion above/below oval
  const p_short = ry * 0.025   // behind post protrusion
  const gsW = gp_i * 2
  const gsH = ry * 0.089
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.fillRect(cx - gsW / 2, cy - ry + 3, gsW, gsH)
  ctx.strokeRect(cx - gsW / 2, cy - ry + 3, gsW, gsH)
  ctx.fillRect(cx - gsW / 2, cy + ry - gsH - 3, gsW, gsH)
  ctx.strokeRect(cx - gsW / 2, cy + ry - gsH - 3, gsW, gsH)

  // Goal posts — 4 per end: 2 taller inner (goal) + 2 shorter outer (behind)
  ctx.lineCap = 'round'
  // Inner goal posts (taller, bolder)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 4.5
  ctx.beginPath()
  ctx.moveTo(cx - gp_i, cy - ry - p_tall);  ctx.lineTo(cx - gp_i, cy - ry)
  ctx.moveTo(cx + gp_i, cy - ry - p_tall);  ctx.lineTo(cx + gp_i, cy - ry)
  ctx.moveTo(cx - gp_i, cy + ry + p_tall);  ctx.lineTo(cx - gp_i, cy + ry)
  ctx.moveTo(cx + gp_i, cy + ry + p_tall);  ctx.lineTo(cx + gp_i, cy + ry)
  ctx.stroke()
  // Behind posts (shorter, lighter)
  ctx.strokeStyle = 'rgba(255,255,255,0.52)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - gp_o, cy - ry - p_short); ctx.lineTo(cx - gp_o, cy - ry)
  ctx.moveTo(cx + gp_o, cy - ry - p_short); ctx.lineTo(cx + gp_o, cy - ry)
  ctx.moveTo(cx - gp_o, cy + ry + p_short); ctx.lineTo(cx - gp_o, cy + ry)
  ctx.moveTo(cx + gp_o, cy + ry + p_short); ctx.lineTo(cx + gp_o, cy + ry)
  ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawFieldCard(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  player: Player | null,
  posLabel: string,
  primary: string,
  displayMode: 'surname' | 'nickname',
  small = false,
) {
  const CW       = small ? 86  : 92
  const CH       = small ? 66  : 72
  const headerH  = small ? 26  : 30
  const numSz    = small ? 20  : 23
  const nameSz   = small ? 12  : 14
  const pillH    = 22

  const x = cx - CW / 2
  const y = cy - pillH - CH

  // Position pill
  const pillW = Math.max(posLabel.length * 8.5 + 16, 40)
  const pillX = cx - pillW / 2
  ctx.fillStyle = player ? 'rgba(10,10,10,0.70)' : 'rgba(10,10,10,0.22)'
  roundRect(ctx, pillX, y, pillW, pillH - 3, 5)
  ctx.fill()
  ctx.fillStyle = player ? '#ffffff' : 'rgba(255,255,255,0.42)'
  ctx.font = `700 ${small ? 11 : 12}px Inter, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(posLabel, cx, y + (pillH - 3) / 2)

  // Card shadow
  ctx.shadowColor   = 'rgba(0,0,0,0.32)'
  ctx.shadowBlur    = 16
  ctx.shadowOffsetY = 5

  if (player) {
    // White card base
    roundRect(ctx, x, y + pillH, CW, CH, 9)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

    // Subtle border
    roundRect(ctx, x, y + pillH, CW, CH, 9)
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Club colour header (clipped to card top-rounded corners)
    ctx.save()
    roundRect(ctx, x, y + pillH, CW, CH, 9)
    ctx.clip()
    ctx.fillStyle = primary
    ctx.fillRect(x, y + pillH, CW, headerH)
    ctx.restore()

    // Player number
    const onPrimary = isLightColour(primary) ? '#000000' : '#ffffff'
    ctx.fillStyle = onPrimary
    ctx.font = `700 ${numSz}px Oswald, Arial Narrow, Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(player.number), cx, y + pillH + headerH / 2)

    // Player name
    let name = getDisplayName(player, displayMode).toUpperCase()
    const bodyY = y + pillH + headerH
    const bodyH = CH - headerH
    ctx.fillStyle = '#111111'
    ctx.font = `700 ${nameSz}px Oswald, Arial Narrow, Arial, sans-serif`
    ctx.textBaseline = 'middle'
    const maxW = CW - 10
    while (ctx.measureText(name).width > maxW && name.length > 2) {
      name = name.slice(0, -2) + '…'
    }
    ctx.fillText(name, cx, bodyY + bodyH / 2)
  } else {
    // Empty slot
    roundRect(ctx, x, y + pillH, CW, CH, 9)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'
    ctx.fill()
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    roundRect(ctx, x, y + pillH, CW, CH, 9)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 5])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.font = '300 24px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('+', cx, y + pillH + CH / 2)
  }
}

async function generateFieldFormat(
  ctx: CanvasRenderingContext2D,
  lineup: Lineup,
  squad: Player[],
  primary: string,
  playerById: Record<string, Player>,
  displayMode: 'surname' | 'nickname',
) {
  // Field geometry — ry reduced from 430→405 to make room for EMG section below
  const ry       = 405
  const rx       = Math.round(ry * 560 / 780)   // = 291
  const cx       = W / 2
  const FIELD_TOP = HDR + 60    // = 260 — enough clearance above FF card pill
  const cy       = FIELD_TOP + ry  // = 665

  drawOval(ctx, cx, cy, rx, ry)

  // Field position cards
  const fx0 = cx - rx
  const fy0 = cy - ry    // = FIELD_TOP
  const fW  = rx * 2
  const fH  = ry * 2

  for (const pos of FIELD_POSITIONS) {
    const pcx    = fx0 + (pos.x / 100) * fW
    const posY   = lineup.fieldFlipped ? 100 - pos.y : pos.y
    const pcy    = fy0 + (posY / 100) * fH
    const player = playerById[lineup.positions[pos.key]] ?? null
    // +47 = (pillH + CH) / 2 — center-anchors the card at the position coordinate
    drawFieldCard(ctx, pcx, pcy + 47, player, pos.shortLabel, primary, displayMode)
  }

  // Interchange section
  const INT_TOP = cy + ry + 44    // = 1164 — below goal posts

  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.04)'
  roundRect(ctx, 36, INT_TOP - 4, W - 72, 140, 14)
  ctx.fill()

  // "INTERCHANGE" label
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '700 12px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('INTERCHANGE', W / 2, INT_TOP + 16)

  // Interchange cards — icy is bottom anchor of card+pill, matching drawFieldCard convention
  const spacing = 200
  const startX  = W / 2 - spacing * 1.5
  for (let i = 0; i < 4; i++) {
    const posKey = INTERCHANGE_KEYS[i]
    const icx    = startX + i * spacing
    const icy    = INT_TOP + 112
    const player = playerById[lineup.positions[posKey]] ?? null
    drawFieldCard(ctx, icx, icy, player, 'INT', primary, displayMode, true)
  }

  // Emergencies section — compact text strip
  const EMG_TOP = INT_TOP + 144

  ctx.fillStyle = 'rgba(0,0,0,0.04)'
  roundRect(ctx, 36, EMG_TOP - 4, W - 72, 54, 14)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font = '700 11px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('EMERGENCIES', W / 2, EMG_TOP + 13)

  const emgSpacing = 280
  const emgStartX  = W / 2 - emgSpacing
  for (let i = 0; i < 3; i++) {
    const posKey = EMERGENCY_KEYS[i]
    const player = playerById[lineup.positions[posKey]] ?? null
    const ecx    = emgStartX + i * emgSpacing
    if (player) {
      ctx.fillStyle = hexToRgba(primary, 0.70)
      ctx.font = '700 16px Oswald, Arial Narrow, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(`#${player.number}`, ecx, EMG_TOP + 30)
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      ctx.font = '700 18px Oswald, Arial Narrow, Arial, sans-serif'
      let emgName = getDisplayName(player, displayMode).toUpperCase()
      while (ctx.measureText(emgName).width > 230 && emgName.length > 2) {
        emgName = emgName.slice(0, -2) + '…'
      }
      ctx.fillText(emgName, ecx, EMG_TOP + 50)
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.font = '400 13px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('—', ecx, EMG_TOP + 40)
    }
  }

  const FTR_Y = EMG_TOP + 54
  drawFooter(ctx, FTR_Y, primary)
}

// ─── Format B: Team List ──────────────────────────────────────────────────────
// Left-column group labels (BACKS / MIDFIELDERS / FOLLOWERS / FORWARDS) with
// 3-player rows to the right.  Interchange + emergencies span full width below.

interface FieldGroup {
  label: string
  rows:  string[][]   // each inner array = 3 position keys
}

const FIELD_GROUPS: FieldGroup[] = [
  { label: 'BACKS',       rows: [['BPL', 'FB', 'BPR'], ['HBL', 'CHB', 'HBR']] },
  { label: 'MIDFIELDERS', rows: [['WL', 'C', 'WR']] },
  { label: 'FOLLOWERS',   rows: [['RR', 'RK', 'ROV']] },
  { label: 'FORWARDS',    rows: [['HFL', 'CHF', 'HFR'], ['FPL', 'FF', 'FPR']] },
]

const LABEL_W = 140
const PCW     = (W - LABEL_W) / 3
const PCOLS   = [LABEL_W + PCW * 0.5, LABEL_W + PCW * 1.5, LABEL_W + PCW * 2.5]
const COL3    = [W / 6, W / 2, 5 * W / 6]
const COL4    = [W / 8, 3 * W / 8, 5 * W / 8, 7 * W / 8]

async function generateListFormat(
  ctx: CanvasRenderingContext2D,
  lineup: Lineup,
  squad: Player[],
  primary: string,
  playerById: Record<string, Player>,
  displayMode: 'surname' | 'nickname',
) {
  const posLabelOf: Record<string, string> = {}
  for (const p of FIELD_POSITIONS) posLabelOf[p.key] = p.shortLabel
  for (const k of INTERCHANGE_KEYS) posLabelOf[k] = 'INT'
  for (const k of EMERGENCY_KEYS) posLabelOf[k] = 'EMG'

  // Oval watermark
  ctx.save()
  ctx.globalAlpha = 0.032
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  const wm_ry = 480
  const wm_rx = Math.round(wm_ry * 560 / 780)
  ctx.beginPath()
  ctx.ellipse(W / 2, H / 2, wm_rx, wm_ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, 55, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  const BODY_TOP = HDR + 2   // = 202
  const ROW_H   = 150        // height per 3-player row
  const TOTAL_ROWS = FIELD_GROUPS.reduce((s, g) => s + g.rows.length, 0)  // = 6
  const FIELD_BOT = BODY_TOP + TOTAL_ROWS * ROW_H  // = 1102

  // Left label column background
  ctx.fillStyle = hexToRgba(primary, 0.14)
  ctx.fillRect(0, BODY_TOP, LABEL_W, FIELD_BOT - BODY_TOP)

  // Vertical separator
  ctx.strokeStyle = hexToRgba(primary, 0.38)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(LABEL_W, BODY_TOP)
  ctx.lineTo(LABEL_W, FIELD_BOT)
  ctx.stroke()

  let rowY = BODY_TOP

  FIELD_GROUPS.forEach((group, gi) => {
    const groupTop = rowY
    const groupH   = group.rows.length * ROW_H

    // Group separator line (full width, except before first group)
    if (gi > 0) {
      ctx.strokeStyle = hexToRgba(primary, 0.32)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, groupTop)
      ctx.lineTo(W, groupTop)
      ctx.stroke()
    }

    // Group label — rotated 90°, centred in label column over group height
    ctx.save()
    ctx.translate(LABEL_W / 2, groupTop + groupH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '700 20px Oswald, Arial Narrow, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(group.label, 0, 0)
    ctx.restore()

    group.rows.forEach((rowKeys, ri) => {
      const y0 = groupTop + ri * ROW_H

      // Player area background — alternating tint
      ctx.fillStyle = hexToRgba(primary, (gi + ri) % 2 === 0 ? 0.10 : 0.05)
      ctx.fillRect(LABEL_W, y0, W - LABEL_W, ROW_H)

      // Thin divider between sub-rows within a group
      if (ri > 0) {
        ctx.strokeStyle = hexToRgba(primary, 0.16)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(LABEL_W, y0)
        ctx.lineTo(W, y0)
        ctx.stroke()
      }

      // Player cells: pos label → number → name
      const posLblY = y0 + 22
      const numY    = y0 + 70
      const nameY   = y0 + 124

      rowKeys.forEach((posKey, ci) => {
        const colX   = PCOLS[ci]
        const player = playerById[lineup.positions[posKey]] ?? null

        if (player) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.font = '700 11px Inter, Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(posLabelOf[posKey] ?? posKey, colX, posLblY)

          ctx.fillStyle = hexToRgba(primary, 0.85)
          ctx.font = '700 32px Oswald, Arial Narrow, Arial, sans-serif'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(String(player.number), colX, numY)

          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2
          drawAutoName(ctx, getDisplayName(player, displayMode).toUpperCase(), colX, nameY, 270, 46, 22)
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
        } else {
          const slotW = 230, slotH = 90, slotMidY = (posLblY + nameY) / 2 - 4
          ctx.fillStyle = 'rgba(255,255,255,0.03)'
          roundRect(ctx, colX - slotW / 2, slotMidY - slotH / 2, slotW, slotH, 8)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1
          ctx.setLineDash([5, 4])
          roundRect(ctx, colX - slotW / 2, slotMidY - slotH / 2, slotW, slotH, 8)
          ctx.stroke(); ctx.setLineDash([])
        }
      })
    })

    rowY += groupH
  })

  // Bottom border of field section
  ctx.strokeStyle = hexToRgba(primary, 0.38)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, FIELD_BOT); ctx.lineTo(W, FIELD_BOT)
  ctx.stroke()

  // ── Interchange ──────────────────────────────────────────────────────────────
  const INT_TOP   = FIELD_BOT + 10
  const INT_HDR_H = 30
  const INT_H     = INT_HDR_H + 90

  ctx.fillStyle = hexToRgba(primary, 0.08)
  ctx.fillRect(0, INT_TOP, W, INT_H)
  ctx.fillStyle = hexToRgba(primary, 0.24)
  ctx.fillRect(0, INT_TOP, W, INT_HDR_H)
  ctx.fillStyle = primary
  ctx.fillRect(0, INT_TOP, 5, INT_HDR_H)
  ctx.fillRect(W - 5, INT_TOP, 5, INT_HDR_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 16px Oswald, Arial Narrow, Arial, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('INTERCHANGE', W / 2, INT_TOP + INT_HDR_H / 2)

  const intTop = INT_TOP + INT_HDR_H
  COL4.forEach((colX, i) => {
    const posKey = INTERCHANGE_KEYS[i]
    const player = playerById[lineup.positions[posKey]] ?? null
    if (player) {
      ctx.fillStyle = 'rgba(255,255,255,0.32)'
      ctx.font = '700 10px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
      ctx.fillText('INT', colX, intTop + 13)
      ctx.fillStyle = hexToRgba(primary, 0.85)
      ctx.font = '700 26px Oswald, Arial Narrow, Arial, sans-serif'
      ctx.fillText(String(player.number), colX, intTop + 44)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1
      drawAutoName(ctx, getDisplayName(player, displayMode).toUpperCase(), colX, intTop + 80, 200, 36, 18)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      roundRect(ctx, colX - 85, intTop + 12, 170, 64, 8); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.setLineDash([5, 4]); roundRect(ctx, colX - 85, intTop + 12, 170, 64, 8)
      ctx.stroke(); ctx.setLineDash([])
    }
  })

  // ── Emergencies ──────────────────────────────────────────────────────────────
  const EMG_TOP   = INT_TOP + INT_H + 8
  const EMG_HDR_H = 26
  const EMG_H     = EMG_HDR_H + 54

  ctx.fillStyle = hexToRgba(primary, 0.05)
  ctx.fillRect(0, EMG_TOP, W, EMG_H)
  ctx.fillStyle = hexToRgba(primary, 0.18)
  ctx.fillRect(0, EMG_TOP, W, EMG_HDR_H)
  ctx.fillStyle = primary
  ctx.fillRect(0, EMG_TOP, 5, EMG_HDR_H)
  ctx.fillRect(W - 5, EMG_TOP, 5, EMG_HDR_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 14px Oswald, Arial Narrow, Arial, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('EMERGENCIES', W / 2, EMG_TOP + EMG_HDR_H / 2)

  const emgTop = EMG_TOP + EMG_HDR_H
  COL3.forEach((colX, i) => {
    const posKey = EMERGENCY_KEYS[i]
    const player = playerById[lineup.positions[posKey]] ?? null
    if (player) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.font = '700 9px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
      ctx.fillText('EMG', colX, emgTop + 11)
      ctx.fillStyle = hexToRgba(primary, 0.82)
      ctx.font = '700 22px Oswald, Arial Narrow, Arial, sans-serif'
      ctx.fillText(String(player.number), colX, emgTop + 34)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 5
      drawAutoName(ctx, getDisplayName(player, displayMode).toUpperCase(), colX, emgTop + 52, 240, 30, 16)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.font = '400 13px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('—', colX, emgTop + 27)
    }
  })

  const FTR_Y = EMG_TOP + EMG_H + 6
  ctx.strokeStyle = hexToRgba(primary, 0.25)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, FTR_Y); ctx.lineTo(W, FTR_Y)
  ctx.stroke()

  drawFooter(ctx, FTR_Y + 4, primary)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateShareImage(
  lineup: Lineup,
  squad:  Player[],
  format: 'field' | 'list' = 'field',
): Promise<Blob | null> {
  try {
    // Wait for fonts before rendering — critical for Oswald/Inter to load
    await document.fonts.ready
    await Promise.allSettled([
      document.fonts.load('700 60px Oswald'),
      document.fonts.load('700 23px Oswald'),
      document.fonts.load('400 18px Inter'),
    ])

    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    const primary     = lineup.primaryColour || '#003087'
    const displayMode = lineup.displayMode   || 'surname'
    const photoUrl    = lineup.backgroundPhotoDataUrl || ''
    const playerById  = Object.fromEntries(squad.map((p) => [p.id, p]))

    // 1. Background layer (photo or gradient + overlays)
    await drawBackground(ctx, photoUrl, primary)

    // 2. Header
    await drawHeader(ctx, lineup, primary)

    // 3. Format-specific body
    if (format === 'field') {
      await generateFieldFormat(ctx, lineup, squad, primary, playerById, displayMode)
    } else {
      await generateListFormat(ctx, lineup, squad, primary, playerById, displayMode)
    }

    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0),
    )
  } catch (err) {
    console.error('[exportCanvas] failed:', err)
    return null
  }
}
