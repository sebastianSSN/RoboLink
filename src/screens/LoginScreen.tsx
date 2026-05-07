import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loginWithEmail, registerWithEmail, registerSession } from '../lib/firebase';
import { useArmStore } from '../state/useArmStore';

type Props = { navigation: NativeStackNavigationProp<any> };

const ERROR_MAP: Record<string, string> = {
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/email-already-in-use': 'Correo ya registrado',
  'auth/weak-password': 'Contraseña muy débil (mínimo 6 caracteres)',
  'auth/invalid-email': 'Correo electrónico inválido',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Error de red',
};

function mapError(code: string) {
  return ERROR_MAP[code] || `Error: ${code}`;
}

export default function LoginScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔑 refs para navegación con Enter
  const passRef = useRef<TextInput>(null);
  const pass2Ref = useRef<TextInput>(null);

  const { setUser, subscribeAll, addLog, startUptime } = useArmStore();

  async function handleLogin() {
    if (!email || !pass) { setError('Completa todos los campos'); return; }
    setError(''); setLoading(true);
    try {
      const cred = await loginWithEmail(email, pass);
      await registerSession(cred.user.uid);
      setUser(cred.user);
      subscribeAll(cred.user.uid);
      startUptime();
      addLog(`Sesión iniciada: ${email}`, 'ok');
      navigation.replace('Main');
    } catch (e: any) {
      setError(mapError(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!email || !pass) { setError('Completa todos los campos'); return; }
    if (pass.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (pass !== pass2) { setError('Las contraseñas no coinciden'); return; }
    setError(''); setLoading(true);
    try {
      const cred = await registerWithEmail(email, pass);
      await registerSession(cred.user.uid);
      setUser(cred.user);
      subscribeAll(cred.user.uid);
      startUptime();
      addLog(`Cuenta creada: ${email}`, 'ok');
      navigation.replace('Main');
    } catch (e: any) {
      setError(mapError(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Fondo decorativo */}
      <View style={s.bg} pointerEvents="none">
        <View style={s.bgCircle1} />
        <View style={s.bgCircle2} />
        <View style={s.bgCircle3} />
        <View style={s.bgLine1} />
        <View style={s.bgLine2} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoText}>CONTEL</Text>
          <Text style={s.logoSub}>ROBOTICS CONTROL</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Acceso al sistema</Text>
          <Text style={s.sub}>Ingresa tus credenciales para continuar</Text>

          {/* Tabs */}
          <View style={s.tabRow}>
            {(['login', 'register'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => { setTab(t); setError(''); }}
              >
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@ejemplo.com"
            placeholderTextColor="#4a7899"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
          />

          {/* Password */}
          <Text style={s.label}>Contraseña</Text>
          <TextInput
            ref={passRef}
            style={s.input}
            value={pass}
            onChangeText={setPass}
            placeholder="••••••••"
            placeholderTextColor="#4a7899"
            secureTextEntry
            returnKeyType={tab === 'login' ? 'go' : 'next'}
            onSubmitEditing={
              tab === 'login'
                ? handleLogin
                : () => pass2Ref.current?.focus()
            }
          />

          {/* Confirm Password */}
          {tab === 'register' && (
            <>
              <Text style={s.label}>Confirmar contraseña</Text>
              <TextInput
                ref={pass2Ref}
                style={s.input}
                value={pass2}
                onChangeText={setPass2}
                placeholder="Repite la contraseña"
                placeholderTextColor="#4a7899"
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleRegister}
              />
            </>
          )}

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={s.btn}
            onPress={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>
                  {tab === 'login' ? 'Ingresar' : 'Crear cuenta'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020c18' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  // Fondo decorativo
  bg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgCircle1: {
    position: 'absolute', width: 420, height: 420, borderRadius: 210,
    backgroundColor: 'rgba(0,100,200,0.13)',
    top: -120, left: -100,
  },
  bgCircle2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0,180,255,0.07)',
    bottom: -60, right: -80,
  },
  bgCircle3: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,229,160,0.05)',
    bottom: 160, left: 20,
  },
  bgLine1: {
    position: 'absolute', width: 1, height: '60%',
    backgroundColor: 'rgba(0,180,255,0.08)',
    top: '20%', left: '30%',
  },
  bgLine2: {
    position: 'absolute', height: 1, width: '50%',
    backgroundColor: 'rgba(0,180,255,0.06)',
    top: '45%', left: '25%',
  },

  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoText: { fontSize: 36, fontWeight: '700', color: '#e8f4ff', letterSpacing: -1 },
  logoSub: { fontSize: 11, color: '#4a7899', letterSpacing: 3, marginTop: 4 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0d1f35',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,180,255,0.22)'
  },
  title: { fontSize: 20, fontWeight: '600', color: '#e8f4ff', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 13, color: '#4a7899', textAlign: 'center', marginBottom: 24 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0c1e33', borderRadius: 8, padding: 3, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  tabActive: { backgroundColor: '#102540' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#4a7899' },
  tabTextActive: { color: '#00b4ff' },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7ab3d4',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  input: {
    backgroundColor: '#0c1e33',
    borderWidth: 1,
    borderColor: 'rgba(0,180,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e8f4ff',
    fontSize: 14,
    marginBottom: 16
  },
  error: {
    color: '#ff4455',
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: 'rgba(255,68,85,0.1)',
    padding: 10,
    borderRadius: 8
  },
  btn: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});