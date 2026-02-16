export default function PitCnxOverlay() {
  // Layout constants for the 4x6 print (1200x1800 at 300 DPI)
  const W = 1200
  const H = 1800
  const HALF = W / 2 // 600px per strip
  const PAD = 30
  const GAP = 24
  const HEADER_H = 100
  const FOOTER_H = 200

  // Photo hole dimensions
  const holeW = HALF - PAD * 2
  const totalVertSpace = H - HEADER_H - FOOTER_H - PAD * 2 - GAP * 2
  const holeH = totalVertSpace / 3
  const holeX_left = PAD
  const holeX_right = HALF + PAD

  // Compute hole positions as data
  const holePositions = []
  for (let i = 0; i < 3; i++) {
    const y = HEADER_H + PAD + i * (holeH + GAP)
    holePositions.push({ y, leftX: holeX_left, rightX: holeX_right })
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        <mask id="photo-mask">
          {/* White = visible (the white background) */}
          <rect x={0} y={0} width={W} height={H} fill="white" />
          {/* Black = transparent (the photo holes) */}
          {holePositions.map((pos, i) => (
            <g key={i}>
              <rect x={pos.leftX} y={pos.y} width={holeW} height={holeH} rx={8} fill="black" />
              <rect x={pos.rightX} y={pos.y} width={holeW} height={holeH} rx={8} fill="black" />
            </g>
          ))}
        </mask>
      </defs>

      {/* White mask with transparent holes */}
      <rect x={0} y={0} width={W} height={H} fill="white" mask="url(#photo-mask)" />

      {/* Left strip header */}
      <text
        x={HALF / 2}
        y={HEADER_H / 2 + PAD / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="black"
        fontSize={36}
        fontWeight="bold"
        fontFamily="'Inter', system-ui, sans-serif"
        letterSpacing="4"
      >
        Pit.CNX
      </text>

      {/* Right strip header */}
      <text
        x={HALF + HALF / 2}
        y={HEADER_H / 2 + PAD / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="black"
        fontSize={36}
        fontWeight="bold"
        fontFamily="'Inter', system-ui, sans-serif"
        letterSpacing="4"
      >
        Pit.CNX
      </text>

      {/* Left strip footer */}
      <text
        x={HALF / 2}
        y={H - FOOTER_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="black"
        fontSize={20}
        fontFamily="'Inter', system-ui, sans-serif"
        letterSpacing="6"
      >
        CHIANG MAI 2026
      </text>

      {/* Right strip footer */}
      <text
        x={HALF + HALF / 2}
        y={H - FOOTER_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="black"
        fontSize={20}
        fontFamily="'Inter', system-ui, sans-serif"
        letterSpacing="6"
      >
        CHIANG MAI 2026
      </text>
    </svg>
  )
}

// Export hole layout constants for PrintCanvas to position photos
export function getHoleLayout() {
  const W = 1200
  const H = 1800
  const HALF = W / 2
  const PAD = 30
  const GAP = 24
  const HEADER_H = 100
  const FOOTER_H = 200

  const holeW = HALF - PAD * 2
  const totalVertSpace = H - HEADER_H - FOOTER_H - PAD * 2 - GAP * 2
  const holeH = totalVertSpace / 3

  const positions = []
  for (let i = 0; i < 3; i++) {
    const y = HEADER_H + PAD + i * (holeH + GAP)
    positions.push({
      left: { x: PAD, y, w: holeW, h: holeH },
      right: { x: HALF + PAD, y, w: holeW, h: holeH },
    })
  }

  return { positions, width: W, height: H }
}
