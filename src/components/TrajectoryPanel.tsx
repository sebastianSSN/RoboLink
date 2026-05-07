// src/components/TrajectoryPanel.tsx
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { useArmStore } from '../state/useArmStore';

export default function TrajectoryPanel() {
  const {
    trajectory, angles, spectator,
    addPosition, removeTrajectory, setAngles,
    addLog, playTrajectory, playing, playIdx,
  } = useArmStore();

  function goToPosition(i: number) {
    if (spectator) return;
    setAngles({ ...trajectory[i] });
    addLog(`Posición #${i + 1} aplicada`, 'ok');
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.title}>Trayectoria guardada</Text>
        {trajectory.length > 0 && (
          <Text style={s.count}>{trajectory.length} poses</Text>
        )}
      </View>

      {/* Barra de progreso durante reproducción */}
      {playing && (
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <View style={[s.progressBar, {
              width: `${((playIdx + 1) / trajectory.length) * 100}%`
            }]} />
          </View>
          <Text style={s.progressText}>
            Reproduciendo {playIdx + 1} / {trajectory.length}
          </Text>
        </View>
      )}

      <ScrollView style={s.list} nestedScrollEnabled>
        {trajectory.length === 0
          ? <Text style={s.empty}>Sin posiciones guardadas</Text>
          : trajectory.map((pos, i) => {
            const isActive = playing && playIdx === i;
            return (
              <TouchableOpacity
                key={i}
                style={[s.item, isActive && s.itemActive]}
                onPress={() => goToPosition(i)}
                disabled={spectator || playing}
              >
                <View style={[s.itemDot, isActive && s.itemDotActive]} />
                <Text style={s.idx}>#{i + 1}</Text>
                <Text style={[s.angles, isActive && s.anglesActive]}>
                  J1:{pos.j1.toFixed(0)}°{' '}
                  J2:{pos.j2.toFixed(0)}°{' '}
                  J3:{pos.j3.toFixed(0)}°
                </Text>
                {isActive && <Text style={s.playingTag}>▶</Text>}
              </TouchableOpacity>
            );
          })
        }
      </ScrollView>

      <View style={s.controls}>
        <TouchableOpacity
          style={[s.btn, spectator && s.btnDisabled]}
          onPress={addPosition}
          disabled={spectator || playing}
        >
          <Text style={s.btnText}>+ Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, playing && s.btnPlaying, spectator && s.btnDisabled]}
          onPress={playTrajectory}
          disabled={spectator || trajectory.length === 0}
        >
          <Text style={[s.btnText, playing && s.btnPlayingText]}>
            {playing ? '⏹ Detener' : '▶ Reproducir'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnRed, spectator && s.btnDisabled]}
          onPress={removeTrajectory}
          disabled={spectator || playing}
        >
          <Text style={[s.btnText, { color: '#ff4455' }]}>✕ Limpiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#0d1f35', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 11, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1.5,
    borderLeftWidth: 3, borderLeftColor: '#00b4ff', paddingLeft: 8 },
  count: { fontSize: 11, color: '#00b4ff', fontVariant: ['tabular-nums'] },

  // Progreso
  progressWrap: { marginBottom: 12 },
  progressBg: { height: 3, backgroundColor: '#0c1e33', borderRadius: 2, marginBottom: 6 },
  progressBar: { height: 3, backgroundColor: '#00e5a0', borderRadius: 2 },
  progressText: { fontSize: 10, color: '#00e5a0', fontVariant: ['tabular-nums'] },

  // Lista
  list: { maxHeight: 200, marginBottom: 12 },
  empty: { color: '#4a7899', fontSize: 12, textAlign: 'center', paddingVertical: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8,
    backgroundColor: '#0c1e33', borderRadius: 8, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)' },
  itemActive: { borderColor: '#00e5a0', backgroundColor: 'rgba(0,229,160,0.06)' },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0c1e33',
    borderWidth: 1, borderColor: '#4a7899' },
  itemDotActive: { backgroundColor: '#00e5a0', borderColor: '#00e5a0' },
  idx: { fontSize: 10, color: '#4a7899', width: 24, fontVariant: ['tabular-nums'] },
  angles: { fontSize: 11, color: '#7ab3d4', flex: 1, fontVariant: ['tabular-nums'] },
  anglesActive: { color: '#00e5a0' },
  playingTag: { fontSize: 10, color: '#00e5a0' },

  // Controles
  controls: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 8, backgroundColor: '#0c1e33',
    borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.22)' },
  btnPlaying: { borderColor: '#00e5a0', backgroundColor: 'rgba(0,229,160,0.08)' },
  btnPlayingText: { color: '#00e5a0' },
  btnRed: { borderColor: 'rgba(255,68,85,0.3)' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 11, fontWeight: '500', color: '#7ab3d4' },
});