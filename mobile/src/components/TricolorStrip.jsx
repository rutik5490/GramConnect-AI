import React from 'react'
import { View, StyleSheet } from 'react-native'

export default function TricolorStrip({ height = 4 }) {
  return (
    <View style={{ height, flexDirection: 'row' }}>
      <View style={[styles.band, { backgroundColor: '#FF9933' }]} />
      <View style={[styles.band, { backgroundColor: '#FFFFFF' }]} />
      <View style={[styles.band, { backgroundColor: '#138808' }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  band: { flex: 1 },
})
