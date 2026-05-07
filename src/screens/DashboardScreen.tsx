// src/screens/DashboardScreen.tsx
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useArmStore } from '../state/useArmStore';
import { logout, removeSession } from '../lib/firebase';
import { computeMGD } from '../lib/kinematics';
import JointControl from '../components/JointControl';
import ArmCanvas from '../components/ArmCanvas';
import KinematicsPanel from '../components/KinematicsPanel';
import TrajectoryPanel from '../components/TrajectoryPanel';
import EventLog from '../components/EventLog';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function DashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const {
    user, angles, setAngle, isMaster,
    unsubscribeAll, addLog,
  } = useArmStore();
  const spectator = !isMaster;

  const mgd = computeMGD(angles.j1, angles.j2, angles.j3);
  const reach = Math.sqrt(mgd.X ** 2 + mgd.Y ** 2).toFixed(0);

  const handleLogout = useCallback(async () => {
    if (user) await removeSession(user.uid);
    unsubscribeAll();
    await logout();
    addLog('Sesión cerrada', 'warn');
    navigation.replace('Login');
  }, [user]);

  const colLeftStyle = isWide ? { flex: 1 } : { width: '100%' as const };
  const colRightStyle = isWide ? { width: 400 } : { width: '100%' as const };

  return (
    <View style={s.root}>

      {/* ══ Topbar ══ */}
      <View style={s.topbar}>
        <View style={s.topLeft}>
          <Text style={s.logo}>CONTEL</Text>
          <Text style={s.logoSub}>ROBOTICS</Text>
          <View style={[s.pill, spectator && s.pillWarn]}>
            <View style={[s.dot, spectator && s.dotWarn]} />
            <Text style={[s.pillText, spectator && s.pillTextWarn]}>
              {spectator ? '👁 ESPECTADOR · Otra sesión activa' : 'LIVE · Firebase'}
            </Text>
          </View>
        </View>
        <View style={s.topRight}>
          {isWide && (
            <Text style={s.userBadge} numberOfLines={1}>{user?.email}</Text>
          )}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ Contenido principal ══ */}
      <ScrollView
        contentContainerStyle={[s.content, isWide && s.contentWide]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Columna izquierda ── */}
        <View style={colLeftStyle}>

          {/* Card: Control de articulaciones */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Control de Articulaciones</Text>

            <JointControl
              joint="J1" label="Base / Rotación" sub="Giro horizontal"
              value={angles.j1} disabled={spectator}
              onChange={v => setAngle('j1', v)}
            />
            <JointControl
              joint="J2" label="Hombro" sub="Elevación del brazo"
              value={angles.j2} disabled={spectator}
              onChange={v => setAngle('j2', v)}
            />
            <JointControl
              joint="J3" label="Codo" sub="Extensión del brazo"
              value={angles.j3} disabled={spectator}
              onChange={v => setAngle('j3', v)}
            />

            {/* Stats */}
            <View style={s.statsRow}>
              {[
                { val: reach, label: 'Alcance (mm)' },
                { val: mgd.Z.toFixed(0), label: 'Altura (mm)' },
                { val: (angles.j1 + angles.j2 + angles.j3).toFixed(0), label: 'Ángulo total (°)' },
              ].map(({ val, label }) => (
                <View key={label} style={s.statCard}>
                  <Text style={s.statVal}>{val}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Sync bar */}
            <View style={s.syncBar}>
              <View style={s.syncLeft}>
                <View style={s.syncDot} />
                <Text style={s.syncText}>Sincronización en tiempo real</Text>
              </View>
              <Text style={s.syncTime}>
                {new Date().toLocaleTimeString('es-CO')}
              </Text>
            </View>
          </View>

          {/* Cinemática */}
          <KinematicsPanel />
        </View>

        {/* ── Columna derecha ── */}
        <View style={colRightStyle}>

          {/* Visualizador 3D */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Simulación del Brazo</Text>
            <ArmCanvas />
            <Text style={s.vizSub}>Vista 3D isométrica · Proyección DH</Text>
          </View>

          <TrajectoryPanel />
          <EventLog />
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050d14' },

  // Topbar
  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    backgroundColor: 'rgba(5,13,20,0.97)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,180,255,0.12)',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontSize: 18, fontWeight: '700', color: '#e8f4ff', letterSpacing: -0.5 },
  logoSub: { fontSize: 9, color: '#4a7899', letterSpacing: 2, marginTop: 2 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,229,160,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)',
  },
  pillWarn: { backgroundColor: 'rgba(255,170,0,0.08)', borderColor: 'rgba(255,170,0,0.3)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e5a0' },
  dotWarn: { backgroundColor: '#ffaa00' },
  pillText: { fontSize: 11, fontWeight: '500', color: '#00e5a0' },
  pillTextWarn: { color: '#ffaa00' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userBadge: { fontSize: 13, color: '#7ab3d4', maxWidth: 200 },
  logoutBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,180,255,0.22)',
  },
  logoutText: { fontSize: 12, fontWeight: '500', color: '#7ab3d4' },

  // Layout
  content: { padding: 20, gap: 0 },
  contentWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },

  // Cards
  card: {
    backgroundColor: '#0d1f35', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)', marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: '#00b4ff', paddingLeft: 8,
  },
  vizSub: { fontSize: 10, color: '#4a7899', textAlign: 'center', marginTop: 8 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: '#0c1e33', borderRadius: 8, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)',
  },
  statVal: { fontSize: 18, fontWeight: '500', color: '#00b4ff', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, color: '#4a7899', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },

  // Sync bar
  syncBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, padding: 10, backgroundColor: 'rgba(0,229,160,0.05)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,229,160,0.12)',
  },
  syncLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00e5a0' },
  syncText: { fontSize: 11, color: '#4a7899' },
  syncTime: { fontSize: 11, color: '#4a7899', fontVariant: ['tabular-nums'] },
});