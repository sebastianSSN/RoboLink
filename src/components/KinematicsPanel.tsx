// src/components/KinematicsPanel.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { useArmStore } from '../state/useArmStore';
import { computeMGD, computeIK, L1, L2, L3 } from '../lib/kinematics';

export default function KinematicsPanel() {
  const { angles, setAngles, addLog, spectator } = useArmStore();
  const mgd = computeMGD(angles.j1, angles.j2, angles.j3);

  const [tx, setTx] = useState('120');
  const [ty, setTy] = useState('80');
  const [tz, setTz] = useState('50');
  const [mgiResult, setMgiResult] = useState<{ j1: string; j2: string; j3: string } | null>(null);
  const [mgiError, setMgiError] = useState('');

  function handleComputeMGI() {
    const px = parseFloat(tx) || 0;
    const py = parseFloat(ty) || 0;
    const pz = parseFloat(tz) || 0;
    const raw = computeIK(px, py, pz);

    if (!raw) {
      setMgiResult(null);
      setMgiError('Fuera de alcance');
      addLog(`MGI: punto (${px},${py},${pz}) fuera de workspace`, 'err');
      return;
    }

    setMgiError('');
    setMgiResult({
      j1: raw.j1.toFixed(1) + '°',
      j2: raw.j2.toFixed(1) + '°',
      j3: raw.j3.toFixed(1) + '°',
    });
    setAngles({ j1: raw.j1, j2: raw.j2, j3: raw.j3 });
    addLog(`MGI → θ1=${raw.j1.toFixed(1)}° θ2=${raw.j2.toFixed(1)}° θ3=${raw.j3.toFixed(1)}°`, 'ok');
  }

  return (
    <View style={s.wrap}>
      <Text style={s.sectionTitle}>Modelos Cinemáticos</Text>

      <View style={s.cols}>

        {/* ── MGD ── */}
        <View style={s.block}>
          <View style={s.blockHeader}>
            <Text style={s.blockTitle}>Modelo Geométrico Directo</Text>
            <View style={s.badgeMGD}><Text style={s.badgeMGDText}>MGD</Text></View>
          </View>
          {[
            { k: 'X', v: mgd.X.toFixed(1) + ' mm', accent: true },
            { k: 'Y', v: mgd.Y.toFixed(1) + ' mm', accent: true },
            { k: 'Z', v: mgd.Z.toFixed(1) + ' mm', accent: true },
            { k: 'φ', v: mgd.phi.toFixed(1) + '° (base)' },
            { k: 'θ', v: mgd.theta.toFixed(1) + '° (hombro)' },
            { k: 'ψ', v: mgd.psi.toFixed(1) + '° (codo)' },
          ].map(r => (
            <View key={r.k} style={s.kinRow}>
              <Text style={s.kinKey}>{r.k}</Text>
              <Text style={[s.kinVal, r.accent && s.kinAccent]}>{r.v}</Text>
            </View>
          ))}
        </View>

        {/* ── MGI ── */}
        <View style={s.block}>
          <View style={s.blockHeader}>
            <Text style={s.blockTitle}>Modelo Geométrico Inverso</Text>
            <View style={s.badgeMGI}><Text style={s.badgeMGIText}>MGI</Text></View>
          </View>

          {[
            { label: 'X', val: tx, set: setTx },
            { label: 'Y', val: ty, set: setTy },
            { label: 'Z', val: tz, set: setTz },
          ].map(({ label, val, set }) => (
            <View key={label} style={s.mgiRow}>
              <Text style={s.mgiLabel}>{label}</Text>
              <TextInput
                style={s.mgiInput}
                value={val}
                onChangeText={set}
                keyboardType="numeric"
                placeholderTextColor="#4a7899"
                editable={!spectator}
              />
            </View>
          ))}

          <TouchableOpacity style={s.calcBtn} onPress={handleComputeMGI} disabled={spectator}>
            <Text style={s.calcBtnText}>↳ Calcular ángulos</Text>
          </TouchableOpacity>

          {mgiError
            ? <Text style={s.mgiError}>{mgiError}</Text>
            : mgiResult && (
              <View style={{ marginTop: 10 }}>
                {[
                  { k: 'θ₁', v: mgiResult.j1 },
                  { k: 'θ₂', v: mgiResult.j2 },
                  { k: 'θ₃', v: mgiResult.j3 },
                ].map(r => (
                  <View key={r.k} style={s.kinRow}>
                    <Text style={s.kinKey}>{r.k}</Text>
                    <Text style={[s.kinVal, s.kinGreen]}>{r.v}</Text>
                  </View>
                ))}
              </View>
            )
          }
        </View>
      </View>

      {/* ── Tabla DH ── */}
      <View style={{ marginTop: 20 }}>
        <Text style={s.sectionTitle}>Parámetros Denavit–Hartenberg</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View style={[s.dhRow, s.dhHeader]}>
              {['Eslab.', 'a (mm)', 'α (°)', 'd (mm)', 'θ (°)'].map(h => (
                <Text key={h} style={[s.dhCell, s.dhHeadText]}>{h}</Text>
              ))}
            </View>
            {/* Rows */}
            {[
              { name: '1 — Base',    a: '0',   al: '90°', d: 'L1', th: angles.j1.toFixed(1) },
              { name: '2 — Hombro', a: `${L2}`, al: '0°', d: '0',  th: angles.j2.toFixed(1) },
              { name: '3 — Codo',   a: `${L3}`, al: '0°', d: '0',  th: angles.j3.toFixed(1) },
            ].map((row, i) => (
              <View key={i} style={s.dhRow}>
                <Text style={[s.dhCell, s.dhCellLeft]}>{row.name}</Text>
                <Text style={s.dhCell}>{row.a}</Text>
                <Text style={s.dhCell}>{row.al}</Text>
                <Text style={s.dhCell}>{row.d}</Text>
                <Text style={[s.dhCell, { color: '#00b4ff' }]}>{row.th}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#0d1f35', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)', marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#00b4ff', paddingLeft: 8 },
  cols: { flexDirection: 'row', gap: 12 },
  block: { flex: 1, backgroundColor: '#0c1e33', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)' },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12 },
  blockTitle: { fontSize: 10, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  badgeMGD: { backgroundColor: 'rgba(0,180,255,0.12)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.25)' },
  badgeMGDText: { fontSize: 9, fontWeight: '600', color: '#00b4ff' },
  badgeMGI: { backgroundColor: 'rgba(0,229,160,0.1)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)' },
  badgeMGIText: { fontSize: 9, fontWeight: '600', color: '#00e5a0' },
  kinRow: { flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)' },
  kinKey: { fontSize: 11, color: '#4a7899', fontVariant: ['tabular-nums'] },
  kinVal: { fontSize: 12, color: '#e8f4ff', fontVariant: ['tabular-nums'] },
  kinAccent: { color: '#00b4ff' },
  kinGreen: { color: '#00e5a0' },
  mgiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  mgiLabel: { fontSize: 10, color: '#4a7899', width: 16, fontVariant: ['tabular-nums'] },
  mgiInput: { flex: 1, backgroundColor: '#050d14', borderWidth: 1,
    borderColor: 'rgba(0,180,255,0.12)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 5,
    color: '#e8f4ff', fontSize: 11, fontVariant: ['tabular-nums'] },
  calcBtn: { width: '100%', marginTop: 8, paddingVertical: 8,
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.25)',
    borderRadius: 6, alignItems: 'center' },
  calcBtnText: { fontSize: 11, fontWeight: '600', color: '#00e5a0' },
  mgiError: { color: '#ff4455', fontSize: 11, marginTop: 8 },
  dhRow: { flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)' },
  dhHeader: { backgroundColor: '#050d14' },
  dhCell: { width: 90, paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 11, color: '#7ab3d4', textAlign: 'right',
    fontVariant: ['tabular-nums'] },
  dhCellLeft: { textAlign: 'left', color: '#4a7899' },
  dhHeadText: { fontSize: 10, color: '#4a7899', fontWeight: '500' },
});