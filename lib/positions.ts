export interface PositionDef {
  key: string
  label: string
  shortLabel: string
  x: number  // % left-to-right across oval bounding box
  y: number  // % top-to-bottom (forward line at top, back line at bottom)
}

// Field is displayed in "attack up" orientation — forwards at top, backs at bottom.
// Percentages reference the oval bounding box.
export const FIELD_POSITIONS: PositionDef[] = [
  // ── Forward line — pushed close to the top goal ───────────────────────────
  { key: 'FPL', label: 'Fwd Pocket',       shortLabel: 'FP',  x: 20, y: 6  },
  { key: 'FF',  label: 'Full Forward',     shortLabel: 'FF',  x: 50, y: 5  },
  { key: 'FPR', label: 'Fwd Pocket',       shortLabel: 'FP',  x: 80, y: 6  },
  // ── Half forward ──────────────────────────────────────────────────────────
  { key: 'HFL', label: 'Half Fwd',         shortLabel: 'HF',  x: 22, y: 25 },
  { key: 'CHF', label: 'Ctr Half Fwd',     shortLabel: 'CHF', x: 50, y: 22 },
  { key: 'HFR', label: 'Half Fwd',         shortLabel: 'HF',  x: 78, y: 25 },
  // ── Midfield ──────────────────────────────────────────────────────────────
  { key: 'WL',  label: 'Wing',             shortLabel: 'WL',  x: 10, y: 47 },
  { key: 'RR',  label: 'Ruck Rover',       shortLabel: 'RR',  x: 32, y: 43 },
  { key: 'RK',  label: 'Ruck',             shortLabel: 'RK',  x: 50, y: 40 },
  { key: 'C',   label: 'Centre',           shortLabel: 'C',   x: 68, y: 43 },
  { key: 'WR',  label: 'Wing',             shortLabel: 'WR',  x: 90, y: 47 },
  { key: 'ROV', label: 'Rover',            shortLabel: 'ROV', x: 50, y: 57 },
  // ── Half back ─────────────────────────────────────────────────────────────
  { key: 'HBL', label: 'Half Back',        shortLabel: 'HB',  x: 22, y: 72 },
  { key: 'CHB', label: 'Ctr Half Back',    shortLabel: 'CHB', x: 50, y: 75 },
  { key: 'HBR', label: 'Half Back',        shortLabel: 'HB',  x: 78, y: 72 },
  // ── Back line — pushed close to the bottom goal ───────────────────────────
  { key: 'BPL', label: 'Back Pocket',      shortLabel: 'BP',  x: 20, y: 91 },
  { key: 'FB',  label: 'Full Back',        shortLabel: 'FB',  x: 50, y: 93 },
  { key: 'BPR', label: 'Back Pocket',      shortLabel: 'BP',  x: 80, y: 91 },
]

export const INTERCHANGE_KEYS = ['INT1', 'INT2', 'INT3', 'INT4']

export const EMERGENCY_KEYS = ['EMG1', 'EMG2', 'EMG3']
