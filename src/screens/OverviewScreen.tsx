import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useArmStore } from '../state/useArmStore';
import { computeMGD } from '../lib/kinematics';
import UptimeCounter from '../components/UptimeCounter';

function StatCard({ value, label, color = '#00b4ff', sub }: {
  value: React.ReactNode; label: string; color?: string; sub?: string;
}) {
  return (
    <View style={[sc.card, { borderTopColor: color }]}>
      <Text style={[sc.val, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {sub && <Text style={sc.sub}>{sub}</Text>}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1, minWidth: 140, backgroundColor: '#0d1f35', borderRadius: 14,
    padding: 20, borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)',
    borderTopWidth: 2,
  },
  val: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  label: { fontSize: 11, color: '#4a7899', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  sub: { fontSize: 10, color: '#4a7899', marginTop: 2 },
});

export default function OverviewScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  const { user, angles, logs, spectator, sessionCount, alertCount, otherSessionsCount } = useArmStore();

  const mgd = computeMGD(angles.j1, angles.j2, angles.j3);
  const reach = Math.sqrt(mgd.X ** 2 + mgd.Y ** 2).toFixed(0);

  const firstName = user?.email?.split('@')[0] ?? 'Usuario';

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = time.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroLeft}>
          <Text style={s.greeting}>{greeting},</Text>
          <Text style={s.heroName}>{firstName}</Text>
          <View style={[s.statusBadge, spectator && s.statusBadgeWarn]}>
            <View style={[s.statusDot, spectator && s.statusDotWarn]} />
            <Text style={[s.statusText, spectator && s.statusTextWarn]}>
              {spectator ? 'Modo espectador activo' : 'Sistema activo'}
            </Text>
          </View>
        </View>
        <View style={s.heroRight}>
          <Text style={s.heroTime}>
            {time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={s.heroDate}>
            {time.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={[s.statsGrid, isWide && s.statsGridWide]}>
        <StatCard value={otherSessionsCount + 1} label="Sesiones activas" color="#00b4ff" sub="En línea ahora" />
        <StatCard value={sessionCount} label="Sesiones hoy" color="#00e5a0" sub="Esta cuenta" />
        <StatCard
          value={alertCount}
          label="Alertas"
          color={alertCount > 0 ? '#ff4455' : '#4a7899'}
          sub="Últimas 24h"
        />
        <View style={[sc.card, { borderTopColor: '#ffaa00', flex: 1, minWidth: 140 }]}>
          <UptimeCounter />
          <Text style={sc.label}>Tiempo operativo</Text>
          <Text style={sc.sub}>Desde el inicio de sesión</Text>
        </View>
      </View>

      {/* Estado del brazo */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Estado actual del brazo</Text>
        <View style={s.armStatusGrid}>
          {[
            { label: 'J1 Base',    val: `${angles.j1.toFixed(1)}°`, color: '#00b4ff' },
            { label: 'J2 Hombro', val: `${angles.j2.toFixed(1)}°`, color: '#00e5a0' },
            { label: 'J3 Codo',   val: `${angles.j3.toFixed(1)}°`, color: '#ffaa00' },
            { label: 'Alcance',   val: `${reach} mm`,              color: '#00b4ff' },
            { label: 'Altura Z',  val: `${mgd.Z.toFixed(1)} mm`,   color: '#00b4ff' },
            { label: 'Pos. X',    val: `${mgd.X.toFixed(1)} mm`,   color: '#7ab3d4' },
          ].map(({ label, val, color }) => (
            <View key={label} style={s.armItem}>
              <Text style={s.armLabel}>{label}</Text>
              <Text style={[s.armVal, { color }]}>{val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actividad reciente */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Actividad reciente</Text>
        {logs.length === 0
          ? <Text style={s.emptyLog}>Sin actividad registrada</Text>
          : logs.slice(0, 8).map((l, i) => {
              const typeColor = ({ ok: '#00e5a0', warn: '#ffaa00', err: '#ff4455', '': '#7ab3d4' } as any)[l.type];
              return (
                <View key={i} style={[s.logItem, i < logs.slice(0, 8).length - 1 && s.logItemBorder]}>
                  <View style={[s.logDot, { backgroundColor: typeColor }]} />
                  <View style={s.logBody}>
                    <Text style={[s.logMsg, { color: typeColor }]}>{l.msg}</Text>
                    <Text style={s.logTime}>{l.time}</Text>
                  </View>
                </View>
              );
            })
        }
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050d14' },
  content: { padding: 24, gap: 16 },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#0d1f35', borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)',
  },
  heroLeft: { flex: 1 },
  greeting: { fontSize: 14, color: '#4a7899', marginBottom: 4 },
  heroName: { fontSize: 32, fontWeight: '700', color: '#e8f4ff', letterSpacing: -0.5, marginBottom: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,229,160,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)',
  },
  statusBadgeWarn: { backgroundColor: 'rgba(255,170,0,0.08)', borderColor: 'rgba(255,170,0,0.3)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e5a0' },
  statusDotWarn: { backgroundColor: '#ffaa00' },
  statusText: { fontSize: 11, fontWeight: '500', color: '#00e5a0' },
  statusTextWarn: { color: '#ffaa00' },
  heroRight: { alignItems: 'flex-end' },
  heroTime: { fontSize: 28, fontWeight: '300', color: '#e8f4ff', fontVariant: ['tabular-nums'] },
  heroDate: { fontSize: 12, color: '#4a7899', marginTop: 4, textTransform: 'capitalize' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statsGridWide: { flexWrap: 'nowrap' },

  card: {
    backgroundColor: '#0d1f35', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)',
  },
  cardTitle: {
    fontSize: 11, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#00b4ff', paddingLeft: 8,
  },
  armStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  armItem: {
    width: '33.33%', paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  armLabel: { fontSize: 10, color: '#4a7899', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  armVal: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },

  emptyLog: { color: '#4a7899', fontSize: 12 },
  logItem: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  logItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  logDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  logBody: { flex: 1 },
  logMsg: { fontSize: 13, fontWeight: '500' },
  logTime: { fontSize: 11, color: '#4a7899', marginTop: 2, fontVariant: ['tabular-nums'] },
});
