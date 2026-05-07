import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useArmStore } from '../state/useArmStore';

export default function UptimeCounter({ style }: { style?: any }) {
  const getUptimeSeconds = useArmStore(s => s.getUptimeSeconds);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    setSecs(getUptimeSeconds());
    const t = setInterval(() => setSecs(getUptimeSeconds()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  const fmt = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

  return <Text style={[styles.text, style]}>{fmt}</Text>;
}

const styles = StyleSheet.create({
  text: { fontVariant: ['tabular-nums'], color: '#00b4ff', fontSize: 22, fontWeight: '500' },
});
