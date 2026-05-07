import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Sidebar, { Screen } from '../components/Sidebar';
import ControlBanner from '../components/ControlBanner';
import OverviewScreen from './OverviewScreen';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';

export default function MainLayout({ navigation }: any) {
  const [active, setActive] = useState<Screen>('Control');
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  function renderScreen() {
    switch (active) {
      case 'Overview': return <OverviewScreen />;
      case 'Control':  return <DashboardScreen navigation={navigation} />;
      case 'Profile':  return <ProfileScreen navigation={navigation} />;
    }
  }

  return (
    <View style={[s.root, isWide && s.rootWide]}>
      {isWide && <Sidebar active={active} onNavigate={setActive} />}

      <View style={s.main}>
        <ControlBanner />
        {renderScreen()}
      </View>

      {!isWide && <Sidebar active={active} onNavigate={setActive} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050d14', flexDirection: 'column' },
  rootWide: { flexDirection: 'row' },
  main: { flex: 1, flexDirection: 'column' },
});
