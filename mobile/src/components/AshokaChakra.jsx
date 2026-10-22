import React from 'react'
import Svg, { Circle, Line } from 'react-native-svg'

export default function AshokaChakra({ size = 40, color = '#0B3D6B' }) {
  const spokes = Array.from({ length: 24 })
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3" />
      {spokes.map((_, i) => {
        const angle = (i * 360) / spokes.length
        const rad = (angle * Math.PI) / 180
        const x2 = 50 + 42 * Math.sin(rad)
        const y2 = 50 - 42 * Math.cos(rad)
        return <Line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke={color} strokeWidth="2" />
      })}
      <Circle cx="50" cy="50" r="5" fill={color} />
    </Svg>
  )
}
