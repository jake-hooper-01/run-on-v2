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

  // Goal squares
  const gsW = rx * 0.18
  const gsH = ry * 0.04
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.fillRect(cx - gsW / 2, cy - ry + 3, gsW, gsH)
  ctx.strokeRect(cx - gsW / 2, cy - ry + 3, gsW, gsH)
  ctx.fillRect(cx - gsW / 2, cy + ry - gsH - 3, gsW, gsH)
  ctx.strokeRect(cx - gsW / 2, cy + ry - gsH - 3, gsW, gsH)

  // Goal posts
  const gp = rx * 0.05
  ctx.strokeStyle = 'rgba(255,255,255,0.78)'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - gp, cy - ry - 28); ctx.lineTo(cx - gp, cy - ry + 3)
  ctx.moveTo(cx,      cy - ry - 40); ctx.lineTo(cx,      cy - ry + 3)
  ctx.moveTo(cx + gp, cy - ry - 28); ctx.lineTo(cx + gp, cy - ry + 3)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - gp, cy + ry + 28); ctx.lineTo(cx - gp, cy + ry - 3)
  ctx.moveTo(cx,      cy + ry + 40); ctx.lineTo(cx,      cy + ry - 3)
  ctx.moveTo(cx + gp, cy + ry + 28); ctx.lineTo(cx + gp, cy + ry - 3)
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
    const pcy    = fy0 + (pos.y / 100) * fH
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
// Classic AFL team sheet — position groups listed as text rows over the photo

interface ListRow {
  label:    string   // main section header (empty for ruck-group continuation)
  sublabel: string   // position abbreviations shown below the header
  keys:     string[]
}

// 8 rows — midfield split into wing/centre row + ruck row, plus emergencies
const LIST_ROWS: ListRow[] = [
  { label: 'BACK LINE',    sublabel: 'BP  ·  FB  ·  BP',            keys: ['BPL', 'FB', 'BPR']             },
  { label: 'HALF BACK',    sublabel: 'HB  ·  CHB  ·  HB',           keys: ['HBL', 'CHB', 'HBR']            },
  { label: 'MIDFIELD',     sublabel: 'WL  ·  C  ·  WR',             keys: ['WL', 'C', 'WR']                },
  { label: '',             sublabel: 'RR  ·  RK  ·  ROV',           keys: ['RR', 'RK', 'ROV']              },
  { label: 'HALF FORWARD', sublabel: 'HF  ·  CHF  ·  HF',           keys: ['HFL', 'CHF', 'HFR']            },
  { label: 'FORWARD LINE', sublabel: 'FP  ·  FF  ·  FP',            keys: ['FPL', 'FF', 'FPR']             },
  { label: 'INTERCHANGE',  sublabel: 'INT  ·  INT  ·  INT  ·  INT', keys: ['INT1', 'INT2', 'INT3', 'INT4'] },
  { label: 'EMERGENCIES',  sublabel: 'EMG  ·  EMG  ·  EMG',         keys: ['EMG1', 'EMG2', 'EMG3']         },
]

// 3-across column centres
const COL3 = [W / 6, W / 2, 5 * W / 6]          // [180, 540, 900]
// 4-across column centres (interchange)
const COL4 = [W / 8, 3 * W / 8, 5 * W / 8, 7 * W / 8]  // [135, 405, 675, 945]

async function generateListFormat(
  ctx: CanvasRenderingContext2D,
  lineup: Lineup,
  squad: Player[],
  primary: string,
  playerById: Record<string, Player>,
  displayMode: 'surname' | 'nickname',
) {
  // Subtle field oval watermark behind text for AFL texture
  ctx.save()
  ctx.globalAlpha = 0.032
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  const wm_ry = 480
  const wm_rx = Math.round(wm_ry * 560 / 780)
  ctx.beginPath()
  ctx.ellipse(W / 2, H / 2, wm_rx, wm_ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  // Centre circle watermark
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, 55, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Body layout
  const BODY_TOP = HDR + 2   // 2px breathing room after header separator
  const BODY_BOT = 1290
  const ROW_H    = Math.floor((BODY_BOT - BODY_TOP) / LIST_ROWS.length)  // ≈ 136px

  LIST_ROWS.forEach((row, i) => {
    const y0       = BODY_TOP + i * ROW_H
    const hasLabel = row.label.length > 0
    const is4Wide  = row.keys.length === 4

    // ── Full-row background — groups header + players into one visual block ──
    ctx.fillStyle = hexToRgba(primary, i % 2 === 0 ? 0.10 : 0.05)
    ctx.fillRect(0, y0, W, ROW_H)

    // ── Section header band ───────────────────────────────────────────────
    if (hasLabel) {
      // Brighter stripe on top of the row background
      ctx.fillStyle = hexToRgba(primary, 0.28)
      ctx.fillRect(0, y0, W, 46)

      // Solid accent bars at each edge
      ctx.fillStyle = primary
      ctx.fillRect(0, y0, 6, 46)
      ctx.fillRect(W - 6, y0, 6, 46)

      // Section label — white, bold, centred vertically in top half of stripe
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 18px Oswald, Arial Narrow, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(row.label, W / 2, y0 + 17)

      // Position abbreviations — bottom half of stripe, muted
      ctx.fillStyle = 'rgba(255,255,255,0.38)'
      ctx.font = '600 10px Inter, Arial, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText(row.sublabel, W / 2, y0 + 36)
    } else {
      // Unlabelled continuation (ruck group) — lighter strip
      ctx.fillStyle = hexToRgba(primary, 0.13)
      ctx.fillRect(0, y0, W, 26)

      ctx.fillStyle = primary
      ctx.fillRect(0, y0, 3, 26)
      ctx.fillRect(W - 3, y0, 3, 26)

      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.font = '600 10px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(row.sublabel, W / 2, y0 + 13)
    }

    // ── Player number + name ──────────────────────────────────────────────
    const numBaselineY  = hasLabel ? y0 + 84  : y0 + 68
    const nameBaselineY = hasLabel ? y0 + 132 : y0 + 116

    const cols     = is4Wide ? COL4  : COL3
    const maxNameW = is4Wide ? 210   : 290
    const maxNumSz = is4Wide ? 20    : 24
    const maxNmSz  = is4Wide ? 36    : 46

    cols.forEach((colX, ci) => {
      const posKey = row.keys[ci]
      if (!posKey) return
      const player = playerById[lineup.positions[posKey]] ?? null

      if (player) {
        // Number — club colour, above name
        ctx.fillStyle = hexToRgba(primary, 0.80)
        ctx.font = `700 ${maxNumSz}px Oswald, Arial Narrow, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(String(player.number), colX, numBaselineY)

        // Name — white, auto-scaled, with soft shadow
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor   = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur    = 10
        ctx.shadowOffsetY = 2
        drawAutoName(ctx, getDisplayName(player, displayMode).toUpperCase(), colX, nameBaselineY, maxNameW, maxNmSz, 22)
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      } else {
        // Empty slot
        const slotW = is4Wide ? 180 : 240
        const slotH = 70
        const slotMidY = (numBaselineY + nameBaselineY) / 2 - 6
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        roundRect(ctx, colX - slotW / 2, slotMidY - slotH / 2, slotW, slotH, 8)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.13)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 4])
        roundRect(ctx, colX - slotW / 2, slotMidY - slotH / 2, slotW, slotH, 8)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  })

  // Thin club-colour rule above footer
  const FTR_Y = BODY_BOT + 2
  ctx.strokeStyle = hexToRgba(primary, 0.3)
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
