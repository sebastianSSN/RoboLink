import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

type Props = {
  joint: 'J1' | 'J2' | 'J3';
  label: string;
  sub: string;
  value: number;
  disabled?: boolean;
  onChange: (val: number) => void;
};

const COLORS = {
  J1: '#00b4ff',
  J2: '#00e5a0',
  J3: '#ffaa00',
};

export default function JointControl({ joint, label, sub, value, disabled, onChange }: Props) {
  const color = COLORS[joint];

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View style={s.nameRow}>
          <View style={[s.badge, { borderColor: color, backgroundColor: color + '22' }]}>
            <Text style={[s.badgeText, { color }]}>{joint}</Text>
          </View>
          <View>
            <Text style={s.label}>{label}</Text>
            <Text style={s.sub}>{sub}</Text>
          </View>
        </View>
        <Text style={[s.value, { color }]}>
          {Math.round(value)}<Text style={s.deg}>°</Text>
        </Text>
      </View>

      <Slider
        style={s.slider}
        minimumValue={0}
        maximumValue={180}
        value={value}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#0c1e33"
        thumbTintColor={color}
        disabled={disabled}
        onValueChange={onChange}
      />

      <View style={s.marks}>
        {['0°', '45°', '90°', '135°', '180°'].map(m => (
          <Text key={m} style={s.mark}>{m}</Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '500', color: '#e8f4ff' },
  sub: { fontSize: 11, color: '#4a7899', marginTop: 1 },
  value: { fontSize: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
  deg: { fontSize: 12, color: '#4a7899', marginLeft: 2 },
  slider: { width: '100%', height: 32 },
  marks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  mark: { fontSize: 10, color: '#4a7899', fontVariant: ['tabular-nums'] },
});