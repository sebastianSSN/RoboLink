import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useArmStore } from '../state/useArmStore';

const TYPE_COLORS = {
  ok: '#00e5a0',
  warn: '#ffaa00',
  err: '#ff4455',
  '': '#7ab3d4',
};

export default function EventLog() {
  const logs = useArmStore(s => s.logs);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Registro de eventos</Text>
      <ScrollView style={s.area} nestedScrollEnabled>
        {logs.length === 0
          ? <Text style={s.empty}>Sin eventos aún</Text>
          : logs.map((l, i) => (
            <View key={i} style={s.line}>
              <Text style={s.time}>{l.time}</Text>
              <Text style={[s.msg, { color: TYPE_COLORS[l.type] }]}>{l.msg}</Text>
            </View>
          ))
        }
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#0d1f35', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)', marginBottom: 16 },
  title: { fontSize: 11, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#00b4ff', paddingLeft: 8 },
  area: { maxHeight: 130, backgroundColor: '#081525', borderRadius: 8, padding: 10 },
  empty: { color: '#4a7899', fontSize: 11 },
  line: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  time: { fontSize: 11, color: '#4a7899', minWidth: 64, fontVariant: ['tabular-nums'] },
  msg: { fontSize: 11, flex: 1 },
});