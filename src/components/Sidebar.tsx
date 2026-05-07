import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useArmStore } from '../state/useArmStore';

export type Screen = 'Overview' | 'Control' | 'Profile';

const NAV_ITEMS: { id: Screen; label: string; icon: string; desc: string }[] = [
  { id: 'Overview', label: 'Inicio',  icon: '⌂', desc: 'Resumen del sistema' },
  { id: 'Control',  label: 'Control', icon: '⊕', desc: 'Panel del brazo robótico' },
  { id: 'Profile',  label: 'Perfil',  icon: '◉', desc: 'Cuenta y estadísticas' },
];

type Props = {
  active: Screen;
  onNavigate: (s: Screen) => void;
};

export default function Sidebar({ active, onNavigate }: Props) {
  const { user, spectator, angles } = useArmStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  if (!isWide) {
    return (
      <View style={tb.bar}>
        {NAV_ITEMS.map(item => (
          <TouchableOpacity
            key={item.id}
            style={tb.item}
            onPress={() => onNavigate(item.id)}
          >
            <Text style={[tb.icon, active === item.id && tb.iconActive]}>
              {item.icon}
            </Text>
            <Text style={[tb.label, active === item.id && tb.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={s.sidebar}>
      {/* Logo */}
      <View style={s.logoWrap}>
        <View style={s.logoIcon}>
          <Text style={s.logoIconText}>⬡</Text>
        </View>
        <View>
          <Text style={s.logoText}>CONTEL</Text>
          <Text style={s.logoSub}>ROBOTICS</Text>
        </View>
      </View>

      {/* Estado de conexión */}
      <View style={[s.connBadge, spectator && s.connBadgeWarn]}>
        <View style={[s.connDot, spectator && s.connDotWarn]} />
        <Text style={[s.connText, spectator && s.connTextWarn]}>
          {spectator ? 'Espectador' : 'Firebase · Live'}
        </Text>
      </View>

      {/* Navegación */}
      <View style={s.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.navItem, isActive && s.navItemActive]}
              onPress={() => onNavigate(item.id)}
            >
              <Text style={[s.navIcon, isActive && s.navIconActive]}>{item.icon}</Text>
              <View style={s.navText}>
                <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
                <Text style={s.navDesc}>{item.desc}</Text>
              </View>
              {isActive && <View style={s.navIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mini status brazo */}
      <View style={s.armMini}>
        <Text style={s.armMiniTitle}>Brazo activo</Text>
        {[
          { label: 'J1', val: angles.j1, color: '#00b4ff' },
          { label: 'J2', val: angles.j2, color: '#00e5a0' },
          { label: 'J3', val: angles.j3, color: '#ffaa00' },
        ].map(({ label, val, color }) => (
          <View key={label} style={s.armMiniRow}>
            <Text style={s.armMiniLabel}>{label}</Text>
            <View style={s.armMiniBarBg}>
              <View style={[s.armMiniBar, { width: `${Math.min((val / 180) * 100, 100)}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={[s.armMiniVal, { color }]}>{val.toFixed(0)}°</Text>
          </View>
        ))}
      </View>

      {/* Usuario al fondo */}
      <View style={s.userWrap}>
        <View style={s.userAvatar}>
          <Text style={s.userAvatarText}>
            {user?.email?.slice(0, 2).toUpperCase() ?? '??'}
          </Text>
        </View>
        <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 240, backgroundColor: '#081525', height: '100%',
    borderRightWidth: 1, borderRightColor: 'rgba(0,180,255,0.12)',
    paddingVertical: 24, paddingHorizontal: 16,
    flexDirection: 'column',
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(0,180,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoIconText: { fontSize: 20, color: '#00b4ff' },
  logoText: { fontSize: 16, fontWeight: '700', color: '#e8f4ff', letterSpacing: -0.3 },
  logoSub: { fontSize: 9, color: '#4a7899', letterSpacing: 2 },

  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,229,160,0.07)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
    marginBottom: 24,
  },
  connBadgeWarn: { backgroundColor: 'rgba(255,170,0,0.07)', borderColor: 'rgba(255,170,0,0.2)' },
  connDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e5a0' },
  connDotWarn: { backgroundColor: '#ffaa00' },
  connText: { fontSize: 11, color: '#00e5a0', fontWeight: '500' },
  connTextWarn: { color: '#ffaa00' },

  nav: { flex: 1, gap: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10,
    position: 'relative',
  },
  navItemActive: { backgroundColor: 'rgba(0,180,255,0.08)' },
  navIcon: { fontSize: 18, color: '#4a7899', width: 24, textAlign: 'center' },
  navIconActive: { color: '#00b4ff' },
  navText: { flex: 1 },
  navLabel: { fontSize: 13, fontWeight: '500', color: '#7ab3d4' },
  navLabelActive: { color: '#e8f4ff' },
  navDesc: { fontSize: 10, color: '#4a7899', marginTop: 1 },
  navIndicator: {
    position: 'absolute', right: 0, top: '25%', bottom: '25%',
    width: 3, backgroundColor: '#00b4ff', borderRadius: 2,
  },

  armMini: {
    backgroundColor: '#0d1f35', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.1)', marginBottom: 16, gap: 8,
  },
  armMiniTitle: { fontSize: 10, color: '#4a7899', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  armMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  armMiniLabel: { fontSize: 10, color: '#4a7899', width: 16, fontVariant: ['tabular-nums'] },
  armMiniBarBg: { flex: 1, height: 3, backgroundColor: '#0c1e33', borderRadius: 2 },
  armMiniBar: { height: 3, borderRadius: 2 },
  armMiniVal: { fontSize: 10, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'] },

  userWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,180,255,0.1)',
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,180,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: 12, fontWeight: '700', color: '#00b4ff' },
  userEmail: { fontSize: 11, color: '#4a7899', flex: 1 },
});

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: '#081525',
    borderTopWidth: 1, borderTopColor: 'rgba(0,180,255,0.12)',
    paddingBottom: 8, paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  icon: { fontSize: 20, color: '#4a7899' },
  iconActive: { color: '#00b4ff' },
  label: { fontSize: 10, color: '#4a7899' },
  labelActive: { color: '#00b4ff', fontWeight: '600' },
});
