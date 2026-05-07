import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useArmStore } from '../state/useArmStore';
import { logout, removeSession, SESSION_ID } from '../lib/firebase';
import UptimeCounter from '../components/UptimeCounter';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={p.row}>
      <Text style={p.rowLabel}>{label}</Text>
      <Text style={p.rowVal}>{value}</Text>
    </View>
  );
}

const p = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLabel: { fontSize: 13, color: '#4a7899' },
  rowVal: { fontSize: 13, color: '#e8f4ff', fontWeight: '500', fontVariant: ['tabular-nums'] },
});

export default function ProfileScreen({ navigation }: any) {
  const { user, logs, sessionCount, alertCount, unsubscribeAll, addLog } = useArmStore();

  async function handleLogout() {
    if (user) await removeSession(user.uid);
    unsubscribeAll();
    await logout();
    addLog('Sesión cerrada', 'warn');
    navigation.replace('Login');
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';
  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.uid}>UID: {user?.uid?.slice(0, 12)}…</Text>
      </View>

      {/* Info de cuenta */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Información de cuenta</Text>
        <InfoRow label="Correo" value={user?.email ?? '—'} />
        <InfoRow label="Cuenta creada" value={createdAt} />
        <InfoRow label="Proveedor" value="Email / contraseña" />
        <InfoRow label="ID de sesión" value={`…${SESSION_ID.slice(-6)}`} />
      </View>

      {/* Estadísticas */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Estadísticas de sesión</Text>
        <InfoRow label="Sesiones hoy" value={String(sessionCount)} />
        <InfoRow label="Alertas" value={String(alertCount)} />
        <InfoRow label="Eventos registrados" value={String(logs.length)} />
        <View style={p.row}>
          <Text style={p.rowLabel}>Tiempo operativo</Text>
          <UptimeCounter style={{ fontSize: 13, fontWeight: '500' }} />
        </View>
      </View>

      {/* Parámetros DH */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Parámetros del robot</Text>
        <InfoRow label="L1 (base)" value="25 mm" />
        <InfoRow label="L2 (hombro)" value="65 mm" />
        <InfoRow label="L3 (codo)" value="85 mm" />
        <InfoRow label="DOF" value="3" />
        <InfoRow label="Workspace máx." value={`${(65 + 85).toFixed(0)} mm`} />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050d14' },
  content: { padding: 24, gap: 16 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,180,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(0,180,255,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#00b4ff' },
  email: { fontSize: 16, fontWeight: '500', color: '#e8f4ff', marginBottom: 4 },
  uid: { fontSize: 11, color: '#4a7899', fontVariant: ['tabular-nums'] },

  card: {
    backgroundColor: '#0d1f35', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.12)',
  },
  cardTitle: {
    fontSize: 11, fontWeight: '600', color: '#4a7899',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4,
    borderLeftWidth: 3, borderLeftColor: '#00b4ff', paddingLeft: 8,
  },

  logoutBtn: {
    backgroundColor: 'rgba(255,68,85,0.1)', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,68,85,0.3)',
    marginTop: 8,
  },
  logoutText: { color: '#ff4455', fontWeight: '600', fontSize: 15 },
});
