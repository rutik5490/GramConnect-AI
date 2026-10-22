import React from 'react'

/**
 * A stylised 24-spoke chakra motif (not the official state emblem) used as
 * GramConnect AI's recurring brand mark: on the login screen as a watermark,
 * in the sidebar as the logo, and as the loading spinner.
 */
export default function AshokaChakra({ size = 40, className = '', spin = false, color = '#0B3D6B' }) {
  const spokes = Array.from({ length: 24 })
  const r = 46
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${spin ? 'animate-chakra' : ''} ${className}`}
      role="img"
      aria-label="GramConnect AI"
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="3" />
      {spokes.map((_, i) => {
        const angle = (i * 360) / spokes.length
        return (
          <line
            key={i}
            x1="50"
            y1="50"
            x2="50"
            y2="8"
            stroke={color}
            strokeWidth="2"
            transform={`rotate(${angle} 50 50)`}
          />
        )
      })}
      <circle cx="50" cy="50" r="5" fill={color} />
    </svg>
  )
}
